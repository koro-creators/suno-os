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

    # Langfuse (ADR-013 — substitui MLflow como observabilidade LLM)
    # Gated por LANGFUSE_ENABLED: em prod (flag off) o SDK nunca é importado/inicializado.
    LANGFUSE_SECRET_KEY: str | None = None
    LANGFUSE_PUBLIC_KEY: str | None = None
    LANGFUSE_HOST: str = "https://cloud.langfuse.com"
    LANGFUSE_ENABLED: bool = False

    # LLM Models
    GOOGLE_API_KEY: str | None = None
    OPENAI_API_KEY: str | None = None
    ANTHROPIC_API_KEY: str | None = None

    # Default model
    DEFAULT_MODEL: str = "gemini-flash"

    # Firebase Auth — projeto de identidade do sunOS (frontend + backend usam o mesmo)
    FIREBASE_PROJECT_ID: str = "koro-creators"
    FIREBASE_USE_ADC: bool = True
    FIREBASE_SERVICE_ACCOUNT_PATH: str | None = None

    # GCP
    GCP_PROJECT_ID: str | None = None
    GCP_REGION: str = "us-central1"

    # Drive da Suno — pasta por cliente (recorte da SPEC-006).
    # A SA do Cloud Run lê pastas compartilhadas com ela (Leitor); o e-mail é
    # exibido na UI para o admin saber com quem compartilhar.
    DRIVE_SA_EMAIL: str = "sunos-backend@koro-creators.iam.gserviceaccount.com"

    # Google OAuth 2.0 — acesso por usuário ao Drive (SPEC-006 FA-14).
    # Fonte: Secret Manager gws-oauth-client (project: koro-creators).
    # ATENÇÃO: adicionar redirect URI em GCP Console antes de usar em prod:
    #   Local dev: http://localhost:8080/api/drive/callback
    #   Cloud Run: https://<service-url>/api/drive/callback
    GOOGLE_OAUTH_CLIENT_ID: str = ""
    GOOGLE_OAUTH_CLIENT_SECRET: str = ""
    GOOGLE_OAUTH_REDIRECT_URI: str = "http://localhost:8080/api/drive/callback"
    # Restringe contas ao domínio G Suite (ex: "korocreators.com"). Vazio = sem restrição.
    GOOGLE_OAUTH_HD: str = ""

    # Logging
    LOG_LEVEL: str = "INFO"

    # Request
    REQUEST_TIMEOUT: int = 60
    ALLOWED_ORIGINS: str = "http://localhost:3003,http://localhost:3000"

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


settings = Settings()
