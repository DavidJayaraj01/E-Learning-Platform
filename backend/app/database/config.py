from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy import create_engine
from pydantic_settings import BaseSettings
from typing import AsyncGenerator
import os


class Settings(BaseSettings):
    """Application settings"""
    database_url: str = "postgresql+asyncpg://username:password@localhost/elearning_db"
    database_url_sync: str = "postgresql://username:password@localhost/elearning_db"
    secret_key: str = "your-secret-key-here"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    environment: str = "development"

    class Config:
        env_file = ".env"


# Settings instance
settings = Settings()


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models"""
    pass


# Async engine for FastAPI
async_engine = create_async_engine(
    settings.database_url,
    echo=settings.environment == "development",
    future=True
)

# Sync engine for Alembic migrations
sync_engine = create_engine(
    settings.database_url_sync,
    echo=settings.environment == "development"
)

# Async session maker
AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Sync session maker for migrations
SessionLocal = sessionmaker(
    bind=sync_engine,
    autocommit=False,
    autoflush=False
)


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency to get async database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


def get_sync_session():
    """Get sync database session for migrations"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()