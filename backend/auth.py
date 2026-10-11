"""
AquaNex Authentication & Role Authorization Adapter
Provides seamless local demo mode (when Supabase credentials are absent)
and secure Supabase JWT verification when enabled.
Roles:
- Administrator
- Water-management operator
- Disaster-response operator
- Read-only viewer
"""

import logging
from typing import Optional, Dict, Any
from fastapi import Header, HTTPException, status
from jose import jwt, JWTError
from backend.config import settings

logger = logging.getLogger("aquanex.auth")

DEMO_OPERATOR_USER = {
    "user_id": "demo-operator-01",
    "email": "operator@aquanex.local",
    "role": "Water-management operator",
    "mode": "local_demo",
    "is_authenticated": True
}

def verify_supabase_token(token: str) -> Dict[str, Any]:
    if not settings.is_supabase_enabled:
        return DEMO_OPERATOR_USER

    secret = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase mode is enabled but no signing key is configured."
        )

    try:
        payload = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            audience="authenticated"
        )
        return {
            "user_id": payload.get("sub"),
            "email": payload.get("email"),
            "role": payload.get("app_metadata", {}).get("role", "Read-only viewer"),
            "mode": "supabase_cloud",
            "is_authenticated": True
        }
    except JWTError as e:
        logger.warning(f"Supabase JWT validation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Supabase authentication token.",
            headers={"WWW-Authenticate": "Bearer"}
        )

def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    # In local demo mode, automatically allow authorized operator access
    if not settings.is_supabase_enabled:
        return DEMO_OPERATOR_USER

    # If Supabase mode is enabled, enforce valid Bearer token
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization token required for cloud operations.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = authorization.split(" ")[1]
    return verify_supabase_token(token)

def get_optional_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    if not settings.is_supabase_enabled:
        return DEMO_OPERATOR_USER

    if authorization and authorization.startswith("Bearer "):
        try:
            token = authorization.split(" ")[1]
            return verify_supabase_token(token)
        except Exception:
            return {"role": "Read-only viewer", "mode": "unverified", "is_authenticated": False}

    return {"role": "Read-only viewer", "mode": "anonymous", "is_authenticated": False}
