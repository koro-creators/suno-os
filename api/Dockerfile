# ── Stage 1: Builder ─────────────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /build

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install system build dependencies + uv
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
 && curl -LsSf https://astral.sh/uv/install.sh | sh \
 && apt-get purge -y --auto-remove curl \
 && rm -rf /var/lib/apt/lists/*

ENV PATH="/root/.local/bin:$PATH"

# Copy dependency manifest and install.
# Instala direto do pyproject.toml (sem uv.lock — não há lockfile versionado;
# mesmo comando do Dockerfile.dev). Reprodutibilidade via lockfile fica como
# melhoria futura (gerar uv.lock e reintroduzir o COPY).
COPY pyproject.toml ./
RUN uv pip install --system -r pyproject.toml

# ── Stage 2: Runtime ────────────────────────────────────────────
FROM python:3.11-slim

# Runtime-only system libraries (no build tools)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
 && rm -rf /var/lib/apt/lists/*

# Non-root user for security
RUN useradd --create-home appuser

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

# Copy installed Python packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code — all backend modules (admin, agents, approval, chat,
# core, drive, models, notifications, onboarding, reunioes, tools, workflows,
# config.py, main.py). See .dockerignore for what is excluded (tests, caches).
COPY . .

# Switch to non-root user
USER appuser

EXPOSE 8080

HEALTHCHECK CMD curl -f http://localhost:8080/health || exit 1

ENTRYPOINT ["python", "-m", "uvicorn"]
CMD ["main:app", "--host", "0.0.0.0", "--port", "8080"]
