import os
import json
from pathlib import Path
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_ROOT_DIR = Path(__file__).resolve().parents[3]
_DEFAULT_DB_FILE = _ROOT_DIR / "recyclink.db"
_DEFAULT_SQLITE_URL = f"sqlite:///{_DEFAULT_DB_FILE.as_posix()}"

class Settings(BaseSettings):
    PROJECT_NAME: str = "RECYCLINK"
    TAGLINE: str = "From Informal Collection to Formal Recycling."
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = True

    # Database Configuration: Primary target PostgreSQL, local fallback SQLite
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        _DEFAULT_SQLITE_URL
    )

    # JWT Authentication
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "recyclink-sih-2026-production-grade-jwt-secret-key-salt")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "recyclink-sih-2026-production-grade-jwt-secret-key-salt")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

    # Service Bindings (e.g. Vercel Services FRONTEND_URL)
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    # CORS Settings
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    def parse_cors(cls, v):
        origins = []
        if isinstance(v, str):
            try:
                origins = json.loads(v)
            except Exception:
                origins = [origin.strip() for origin in v.split(",") if origin.strip()]
        elif isinstance(v, list):
            origins = list(v)

        frontend_binding = os.getenv("FRONTEND_URL")
        if frontend_binding and frontend_binding not in origins:
            origins.append(frontend_binding)
        return origins

    ENABLE_DEMO_MODE: bool = True
    PRICE_ANOMALY_THRESHOLD_PCT: float = 40.0

    model_config = SettingsConfigDict(env_file=".env", extra="allow")

settings = Settings()
