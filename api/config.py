"""
Application Settings — Pydantic BaseSettings
Gerencia configurações de ambiente para sunOS API
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Configurações da aplicação sunOS API."""

    # Environment
    ENVIRONMENT: str = "local"
    DEBUG: bool = True

    # API
    API_PREFIX: str = "/api"
    PROJECT_NAME: str = "sunOS API"
    VERSION: str = "0.1.0"
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8080

    # Database (shared Cloud SQL)
    DATABASE_URL: str = "postgresql+asyncpg://sunos:sunos_dev_pass@localhost:5432/sunos_db"

    # MLflow
    MLFLOW_TRACKING_URI: str = "http://localhost:5001"
    MLFLOW_ARTIFACT_ROOT: str = "gs://toolbox-mlflow-artifacts/sunos"

    # LLM Models
    GOOGLE_API_KEY: str | None = None
    OPENAI_API_KEY: str | None = None
    ANTHROPIC_API_KEY: str | None = None

    # Default model
    DEFAULT_MODEL: str = "gemini-flash"

    # Firebase Auth
    FIREBASE_PROJECT_ID: str = "toolbox-67a0e"
    FIREBASE_USE_ADC: bool = True

    # GCP
    GCP_PROJECT_ID: str | None = None
    GCP_REGION: str = "us-central1"

    # Logging
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


settings = Settings()
