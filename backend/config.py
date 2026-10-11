import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "AquaNex"
    APP_DESCRIPTION: str = "AI Water & Climate Early Warning System (Predict. Protect. Act.)"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DATA_MODE_LABEL: str = "Prototype Mode • Simulated Data"
    WEATHER_DATA_MODE: str = os.getenv("WEATHER_MODE", "live").lower()
    
    # Database Configuration
    DATABASE_MODE: str = os.getenv("DATABASE_MODE", "sqlite").lower()
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./aquanex.db")
    
    # Supabase Configuration (Optional for cloud mode)
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]
    
    # Server host & port
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    @property
    def is_supabase_enabled(self) -> bool:
        return (
            self.DATABASE_MODE == "supabase"
            and bool(self.SUPABASE_URL)
            and (bool(self.DATABASE_URL.startswith("postgresql")) or bool(self.SUPABASE_SERVICE_ROLE_KEY))
        )

    @property
    def effective_db_url(self) -> str:
        if self.is_supabase_enabled and self.DATABASE_URL.startswith("postgresql"):
            return self.DATABASE_URL
        # On Vercel / serverless Linux containers, the deployment filesystem is read-only.
        # Only /tmp is writable for SQLite database and WAL files.
        if (os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME") or os.path.exists("/tmp")) and os.name != "nt":
            return "sqlite:////tmp/aquanex.db"
        return "sqlite:///./aquanex.db"

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
