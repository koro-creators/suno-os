"""
sunOS API — FastAPI Application
Backend multi-agent para ferramentas de IA do sunohub.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

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

# CORS handled by Cloud Load Balancer (ADR-001)

# Mount chat router
from chat.router import router as chat_router

app.include_router(chat_router, prefix=settings.API_PREFIX)


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
