from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.config import settings
from app.core.exceptions import AppException
from app.database.session import engine, Base, SessionLocal
from app.routers import (
    auth, collector, materials, ai_router, pricing_router,
    recyclers, lots, transactions, trace, admin, safety, sync,
    recycler_portal, handover, intelligence, orchestration
)
from app.database.migration_phase7 import migrate_database
from app.database.migration_phase9 import migrate_database_phase9
from app.database.migration_phase10 import migrate_database_phase10
from app.database.migration_phase11 import migrate_database_phase11
from app.database.migration_phase12 import migrate_database_phase12

# Ensure database tables exist and Phase 7, 9, 10, 11 & 12 columns/tables are migrated
Base.metadata.create_all(bind=engine)
try:
    migrate_database("recyclink.db")
except Exception:
    pass

try:
    migrate_database_phase9("recyclink.db")
except Exception:
    pass

try:
    migrate_database_phase10("recyclink.db")
except Exception:
    pass

try:
    migrate_database_phase11("recyclink.db")
except Exception:
    pass

try:
    migrate_database_phase12("recyclink.db")
except Exception:
    pass



app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Intelligent informal-to-formal e-waste ecosystem platform for Smart India Hackathon 2026 (SIH26229)",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if "*" in origins or settings.DEBUG else origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception Handlers
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    error_payload = {
        "code": exc.code,
        "message": exc.message
    }
    if getattr(exc, "details", None) is not None:
        error_payload["details"] = exc.details
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": error_payload
        }
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    code_mapping = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        409: "CONFLICT",
        422: "UNPROCESSABLE_ENTITY",
        500: "INTERNAL_SERVER_ERROR"
    }
    error_code = code_mapping.get(exc.status_code, "HTTP_ERROR")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": error_code,
                "message": str(exc.detail)
            }
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    from fastapi.encoders import jsonable_encoder
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid request payload structure or parameters.",
                "details": jsonable_encoder(exc.errors())
            }
        }
    )

# Register Routers
app.include_router(auth.router)
app.include_router(collector.router)
app.include_router(materials.router)
app.include_router(ai_router.router)
app.include_router(pricing_router.router)
app.include_router(recyclers.router)
app.include_router(lots.router)
app.include_router(transactions.router)
app.include_router(trace.router)
app.include_router(admin.router)
app.include_router(safety.router)
app.include_router(sync.router)
app.include_router(recycler_portal.router)
app.include_router(handover.router)
app.include_router(intelligence.router)
app.include_router(orchestration.router)


@app.get("/")
@app.get("/api")
def root():
    return {
        "project": settings.PROJECT_NAME,
        "tagline": settings.TAGLINE,
        "status": "operational",
        "version": "2.0.0",
        "docs": "/docs"
    }

def check_db_health() -> str:
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        return "connected"
    except Exception as e:
        return f"error: {str(e)}"

@app.get("/health")
def health():
    db_status = check_db_health()
    return {
        "status": "healthy" if "connected" in db_status else "degraded",
        "service": "recycLink-backend",
        "database": db_status
    }

@app.get("/api/health")
def api_health():
    db_status = check_db_health()
    return {
        "status": "healthy" if "connected" in db_status else "degraded",
        "service": "recycLink-backend",
        "database": db_status,
        "ai_engine": "ready",
        "pricing_engine": "ready"
    }
