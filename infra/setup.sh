#!/usr/bin/env bash
# infra/setup.sh — sunOS GCP one-time provisioning
# ADR-014: Cloud SQL, Cloud Run, GCS, VPC Connector, Secret Manager, Artifact Registry
#
# Usage: PROJECT_ID=koro-creators bash infra/setup.sh
# Requires: gcloud CLI authenticated as project owner or equivalent
#
# Idempotent: safe to re-run — most commands use --quiet and tolerate existing resources.

set -euo pipefail

PROJECT_ID="${PROJECT_ID:-koro-creators}"
REGION="us-west1"
DB_INSTANCE="sunos-db"
DB_NAME="sunos"
DB_USER="sunos"
BUCKET="sunos-${PROJECT_ID}"
VPC_CONNECTOR="sunos-vpc-connector"
AR_REPO="sunos"
SA_BACKEND="sunos-backend"
SA_FRONTEND="sunos-frontend"
SA_CLOUDBUILD="sunos-cloudbuild"

echo "▶ Project: ${PROJECT_ID} | Region: ${REGION}"
gcloud config set project "${PROJECT_ID}"

# ─────────────────────────────────────────────────────────
# 1. Enable required APIs
# ─────────────────────────────────────────────────────────
echo "▶ Enabling GCP APIs..."
gcloud services enable \
  run.googleapis.com \
  sql-component.googleapis.com \
  sqladmin.googleapis.com \
  storage.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com \
  vpcaccess.googleapis.com \
  cloudbuild.googleapis.com \
  iam.googleapis.com \
  --quiet

# ─────────────────────────────────────────────────────────
# 2. Artifact Registry repo
# ─────────────────────────────────────────────────────────
echo "▶ Creating Artifact Registry repo: ${AR_REPO}..."
gcloud artifacts repositories create "${AR_REPO}" \
  --repository-format=docker \
  --location="${REGION}" \
  --description="sunOS Docker images" \
  --quiet 2>/dev/null || echo "  (already exists)"

# ─────────────────────────────────────────────────────────
# 3. Service accounts
# ─────────────────────────────────────────────────────────
echo "▶ Creating service accounts..."

for SA in "${SA_BACKEND}" "${SA_FRONTEND}" "${SA_CLOUDBUILD}"; do
  gcloud iam service-accounts create "${SA}" \
    --display-name="sunOS ${SA}" \
    --quiet 2>/dev/null || echo "  SA ${SA} already exists"
done

# Backend SA: Cloud SQL client + GCS object admin + Secret Manager accessor
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --condition=None \
  --member="serviceAccount:${SA_BACKEND}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client" --quiet
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --condition=None \
  --member="serviceAccount:${SA_BACKEND}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin" --quiet
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --condition=None \
  --member="serviceAccount:${SA_BACKEND}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" --quiet

# Frontend SA: minimal (no DB, no secrets directly)
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --condition=None \
  --member="serviceAccount:${SA_FRONTEND}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/run.invoker" --quiet

# Cloud Build SA: deploy to Cloud Run + push to Artifact Registry
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --condition=None \
  --member="serviceAccount:${SA_CLOUDBUILD}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/run.admin" --quiet
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --condition=None \
  --member="serviceAccount:${SA_CLOUDBUILD}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer" --quiet
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --condition=None \
  --member="serviceAccount:${SA_CLOUDBUILD}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser" --quiet

# ─────────────────────────────────────────────────────────
# 4. VPC Connector (required for private Cloud SQL access)
# ─────────────────────────────────────────────────────────
echo "▶ Creating VPC Connector: ${VPC_CONNECTOR}..."
gcloud compute networks vpc-access connectors create "${VPC_CONNECTOR}" \
  --region="${REGION}" \
  --range="10.8.0.0/28" \
  --quiet 2>/dev/null || echo "  (already exists)"

# ─────────────────────────────────────────────────────────
# 5. Cloud SQL — PostgreSQL 15 + pgvector
# ─────────────────────────────────────────────────────────
echo "▶ Creating Cloud SQL instance: ${DB_INSTANCE} (this takes ~5 min)..."
INSTANCE_STATE="$(gcloud sql instances describe "${DB_INSTANCE}" \
  --format='value(state)' 2>/dev/null || echo "MISSING")"

if [[ "${INSTANCE_STATE}" == "MISSING" ]]; then
  gcloud sql instances create "${DB_INSTANCE}" \
    --database-version=POSTGRES_15 \
    --tier=db-g1-small \
    --region="${REGION}" \
    --no-assign-ip \
    --enable-google-private-path \
    --storage-auto-increase \
    --storage-size=20GB \
    --storage-type=SSD \
    --backup-start-time=03:00 \
    --maintenance-window-day=SUN \
    --maintenance-window-hour=4 \
    --quiet
  echo "  Cloud SQL instance criada."
else
  echo "  (já existe — state: ${INSTANCE_STATE})"
fi

# Aguardar instância ficar RUNNABLE
echo "▶ Aguardando Cloud SQL ficar RUNNABLE..."
for i in $(seq 1 30); do
  STATE="$(gcloud sql instances describe "${DB_INSTANCE}" --format='value(state)' 2>/dev/null)"
  echo "  state: ${STATE} (${i}/30)"
  [[ "${STATE}" == "RUNNABLE" ]] && break
  sleep 10
done

echo "▶ Creating database and user..."
gcloud sql databases create "${DB_NAME}" \
  --instance="${DB_INSTANCE}" --quiet 2>/dev/null || echo "  (already exists)"

DB_PASSWORD="$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 32)"
gcloud sql users create "${DB_USER}" \
  --instance="${DB_INSTANCE}" \
  --password="${DB_PASSWORD}" \
  --quiet 2>/dev/null || echo "  (user already exists — password NOT updated)"

INSTANCE_IP="$(gcloud sql instances describe "${DB_INSTANCE}" \
  --format='value(ipAddresses[0].ipAddress)' 2>/dev/null || echo "IP_PENDENTE")"
DATABASE_URL="postgresql+asyncpg://${DB_USER}:${DB_PASSWORD}@${INSTANCE_IP}/${DB_NAME}"
echo ""
echo "  ⚠️  DATABASE_URL (salve isso → Secret Manager):"
echo "  ${DATABASE_URL}"
echo ""

echo "▶ Enabling pgvector extension (run after first DB connection)..."
echo "  SQL: CREATE EXTENSION IF NOT EXISTS vector;"
echo "  Run via: gcloud sql connect ${DB_INSTANCE} --user=${DB_USER} --database=${DB_NAME}"

# ─────────────────────────────────────────────────────────
# 6. GCS Bucket
# ─────────────────────────────────────────────────────────
echo "▶ Creating GCS bucket: gs://${BUCKET}..."
gcloud storage buckets create "gs://${BUCKET}" \
  --location="${REGION}" \
  --uniform-bucket-level-access \
  --quiet 2>/dev/null || echo "  (already exists)"

# ─────────────────────────────────────────────────────────
# 7. Secret Manager — create secrets (values set separately)
# ─────────────────────────────────────────────────────────
echo "▶ Creating Secret Manager secrets..."

for SECRET in \
  sunos-database-url \
  sunos-google-api-key \
  sunos-langfuse-secret-key \
  sunos-langfuse-public-key; do
  gcloud secrets create "${SECRET}" \
    --replication-policy=user-managed \
    --locations="${REGION}" \
    --quiet 2>/dev/null || echo "  secret ${SECRET} already exists"
done

echo ""
echo "▶ Populate secrets with:"
echo "  echo -n 'VALUE' | gcloud secrets versions add sunos-database-url --data-file=-"
echo "  echo -n 'VALUE' | gcloud secrets versions add sunos-google-api-key --data-file=-"
echo "  echo -n 'VALUE' | gcloud secrets versions add sunos-langfuse-secret-key --data-file=-"
echo "  echo -n 'VALUE' | gcloud secrets versions add sunos-langfuse-public-key --data-file=-"

# ─────────────────────────────────────────────────────────
# 8. Cloud Build trigger setup reminder
# ─────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════════"
echo " ✅  Provisioning complete."
echo ""
echo " Next steps:"
echo "  1. Set secret values (see commands above)"
echo "  2. Enable pgvector: gcloud sql connect ${DB_INSTANCE} --user=${DB_USER}"
echo "     → CREATE EXTENSION IF NOT EXISTS vector;"
echo "  3. Create Cloud Build triggers:"
echo "     Backend : cloudbuild config = api/cloudbuild.yaml, filter = api/**"
echo "     Frontend: cloudbuild config = cloudbuild-frontend.yaml, filter = app/** components/**"
echo "  4. First deploy: gcloud builds submit --config=api/cloudbuild.yaml ."
echo "════════════════════════════════════════════════════"
