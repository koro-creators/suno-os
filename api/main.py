"""
sunOS API — FastAPI Application
Backend multi-agent para ferramentas de IA do sunohub.
"""

import logging
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException

from config import settings

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle: startup / shutdown."""
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}")
    logger.info(f"Environment: {settings.ENVIRONMENT}")

    # Initialize Firebase
    try:
        from core.firebase import get_firebase_app

        get_firebase_app()
        logger.info("Firebase Admin SDK initialized")
    except Exception as e:
        logger.warning(f"Firebase initialization skipped: {e}")

    # Initialize MLflow
    try:
        import mlflow

        mlflow.set_tracking_uri(settings.MLFLOW_TRACKING_URI)
        logger.info(f"MLflow tracking URI: {settings.MLFLOW_TRACKING_URI}")
    except Exception as e:
        logger.warning(f"MLflow initialization skipped: {e}")

    yield

    logger.info(f"Shutting down {settings.PROJECT_NAME}")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend multi-agent (LangGraph) para ferramentas de IA do sunohub.",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# Exception handlers
# ---------------------------------------------------------------------------


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception: %s", exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "internal_error",
            "message": "An unexpected error occurred.",
            "detail": str(exc) if settings.DEBUG else None,
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "error": "validation_error",
            "message": "Invalid request data.",
            "details": exc.errors(),
        },
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": "http_error", "message": exc.detail},
    )


# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------


@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = (time.time() - start) * 1000
    logger.info(
        "%s %s → %d (%.0fms)",
        request.method,
        request.url.path,
        response.status_code,
        duration,
    )
    return response


# CORS — production is handled by Cloud Load Balancer (ADR-001).
# In DEBUG mode, enable CORS middleware for local frontend development.
if settings.DEBUG:
    from fastapi.middleware.cors import CORSMiddleware

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3003", "http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Mount chat router
from chat.router import router as chat_router

app.include_router(chat_router, prefix=settings.API_PREFIX)

# Mount knowledge router
from chat.knowledge.router import router as knowledge_router

app.include_router(knowledge_router, prefix=settings.API_PREFIX)

# Mount workflows router
from workflows.router import router as workflows_router

app.include_router(workflows_router, prefix=f"{settings.API_PREFIX}/workflows")

# Mount tools router (SPEC-005 TASK-C08b — powers canvas NodePalette)
from tools.router import router as tools_router

app.include_router(tools_router, prefix=settings.API_PREFIX)

# Mount conversations router (Phase 11 — conversation persistence)
from chat.conversations.router import router as conversations_router

app.include_router(conversations_router, prefix=settings.API_PREFIX)

# Mount drive router (Phase 18 — SPEC-006 FA-14 Drive scaffolding)
from drive.router import router as drive_router

app.include_router(drive_router, prefix=settings.API_PREFIX)

# Mount onboarding router (Phase 19 / SPEC-015 — Oráculo do Cliente)
from onboarding.router import router as onboarding_router

app.include_router(onboarding_router, prefix=settings.API_PREFIX)

# Mount approval router (Phase 20 — SPEC-004 / FA-13 Aprovação Hierárquica)
from approval.router import router as approval_router

app.include_router(approval_router, prefix=settings.API_PREFIX)

# Mount meetings router (Phase 21 — SPEC-016 Captura Seletiva de Reunioes)
from reunioes.router import router as reunioes_router

app.include_router(reunioes_router, prefix=f"{settings.API_PREFIX}/meetings")


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for load balancers and Cloud Run probes."""
    return {"status": "healthy", "service": settings.PROJECT_NAME, "version": settings.VERSION}


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API info."""
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "health": "/health",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host=settings.API_HOST, port=settings.API_PORT, reload=settings.DEBUG)
