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

    # Initialize Firebase — obrigatório, falha no startup se não configurado
    from core.firebase import get_firebase_app

    get_firebase_app()
    logger.info("Firebase Admin SDK initialized")

    # Initialize MLflow
    try:
        import mlflow

        mlflow.set_tracking_uri(settings.MLFLOW_TRACKING_URI)
        logger.info(f"MLflow tracking URI: {settings.MLFLOW_TRACKING_URI}")
    except Exception as e:
        logger.warning(f"MLflow initialization skipped: {e}")

    # Start preview-runs cleanup loop (TASK-C12 — deletes TTL-expired runs every 30min)
    import asyncio

    async def _cleanup_previews_loop() -> None:
        from agents.preview import cleanup_expired_previews

        while True:
            await asyncio.sleep(1800)  # 30 min
            try:
                n = cleanup_expired_previews()
                if n:
                    logger.info("Cleaned up %d expired preview runs", n)
            except Exception as exc:
                logger.warning("Preview cleanup error: %s", exc)

    cleanup_task = asyncio.create_task(_cleanup_previews_loop())

    # Start APScheduler for agent scheduled runs (Phase 22 — SPEC-021)
    try:
        from agents.scheduler import load_active_schedules_from_store, scheduler

        if not scheduler.running:
            scheduler.start()
        await load_active_schedules_from_store()
        logger.info("Agent scheduler started")
    except Exception as e:
        logger.warning(f"Agent scheduler initialization skipped: {e}")

    yield

    cleanup_task.cancel()

    logger.info(f"Shutting down {settings.PROJECT_NAME}")

    # Shutdown APScheduler
    try:
        from agents.scheduler import scheduler

        if scheduler.running:
            scheduler.shutdown(wait=False)
            logger.info("Agent scheduler stopped")
    except Exception as e:
        logger.warning(f"Agent scheduler shutdown error: {e}")


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


# CORS — habilitado no app para as origens permitidas (ALLOWED_ORIGINS).
# ADR-001 previa CORS no Load Balancer, mas hoje o frontend chama as URLs
# *.run.app diretamente (sem LB), então o app precisa emitir os headers.
# Em dev inclui localhost; em prod, a(s) URL(s) do frontend (set via deploy).
from fastapi.middleware.cors import CORSMiddleware

_cors_origins = [o.strip() for o in (settings.ALLOWED_ORIGINS or "").split(",") if o.strip()]
if settings.DEBUG:
    for _dev in ("http://localhost:3003", "http://localhost:3000"):
        if _dev not in _cors_origins:
            _cors_origins.append(_dev)

if _cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=_cors_origins,
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

# Mount notifications router (Phase 20 — in-memory notification system)
from notifications.router import router as notifications_router

app.include_router(notifications_router, prefix=f"{settings.API_PREFIX}/notifications")

# Mount meetings router (Phase 21 — SPEC-016 Captura Seletiva de Reunioes)
from reunioes.router import router as reunioes_router

app.include_router(reunioes_router, prefix=f"{settings.API_PREFIX}/meetings")

# Mount agents router (Phase 22 — SPEC-021 FA-17 Agentes)
from agents.router import router as agents_router

app.include_router(agents_router, prefix=f"{settings.API_PREFIX}/agents")

# Mount admin router (Phase 23 — SPEC-022 Configurações Admin)
from admin.router import router as admin_router

app.include_router(admin_router, prefix=f"{settings.API_PREFIX}/admin")


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
