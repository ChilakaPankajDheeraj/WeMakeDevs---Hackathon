import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.config import settings

logger = logging.getLogger("aquanex.database")

# Database engine initialization
connect_args = {}
if settings.effective_db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(
        settings.effective_db_url,
        echo=False,
        connect_args=connect_args,
        pool_pre_ping=True
    )
except Exception as e:
    logger.warning(f"Failed to create primary engine ({e}), falling back to SQLite in-memory.")
    engine = create_engine("sqlite:///:memory:", echo=False, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    from backend import models  # Ensure all models are imported before create_all
    try:
        Base.metadata.create_all(bind=engine)
        logger.info(f"Database initialized successfully with mode: {'supabase' if settings.is_supabase_enabled else 'sqlite'}")
        return True
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        return False

def check_db_connection() -> dict:
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {
            "status": "connected",
            "mode": "supabase" if settings.is_supabase_enabled else "sqlite",
            "url_type": "postgresql" if settings.effective_db_url.startswith("postgresql") else "sqlite"
        }
    except Exception as e:
        return {
            "status": "error",
            "mode": settings.DATABASE_MODE,
            "error": str(e)
        }
