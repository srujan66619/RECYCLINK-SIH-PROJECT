"""
Vercel and ASGI Entrypoint for RECYCLINK FastAPI backend service.
Exposes the FastAPI instance 'app' initialized in app.main.
"""
from app.main import app

__all__ = ["app"]
