#!/usr/bin/env bash
# infra/triggers.sh — configura Cloud Build triggers automáticos para sunOS
# ADR-014: CI/CD com Cloud Build + GitHub App
#
# PRÉ-REQUISITO (único passo manual):
#   Conectar o repositório GitHub ao Cloud Build via Console:
#   https://console.cloud.google.com/cloud-build/repositories
#   → "Connect Repository" → GitHub → koro-creators/suno-os
#   Isso instala o Cloud Build GitHub App no repo.
#   Após conectar, rode este script.
#
# Usage: PROJECT_ID=koro-creators bash infra/triggers.sh

set -euo pipefail

PROJECT_ID="${PROJECT_ID:-koro-creators}"
REGION="us-west1"
REPO_OWNER="koro-creators"
REPO_NAME="suno-os"
BRANCH="^main$"

echo "▶ Configurando Cloud Build triggers — projeto: ${PROJECT_ID}"
gcloud config set project "${PROJECT_ID}"

# ─────────────────────────────────────────────────────────
# 1. Backend trigger — push em api/**
# ─────────────────────────────────────────────────────────
echo "▶ Criando trigger: sunos-backend-deploy..."
gcloud builds triggers create github \
  --name="sunos-backend-deploy" \
  --description="Deploy sunOS API (FastAPI+LangGraph) on push to main/api/**" \
  --repo-owner="${REPO_OWNER}" \
  --repo-name="${REPO_NAME}" \
  --branch-pattern="${BRANCH}" \
  --build-config="api/cloudbuild.yaml" \
  --included-files="api/**" \
  --region="${REGION}" \
  --service-account="projects/${PROJECT_ID}/serviceAccounts/sunos-cloudbuild@${PROJECT_ID}.iam.gserviceaccount.com" \
  --substitutions="_GCP_PROJECT_ID=${PROJECT_ID}" \
  --quiet 2>/dev/null || echo "  trigger sunos-backend-deploy já existe — pulando"

# ─────────────────────────────────────────────────────────
# 2. Frontend trigger — push em app/**, components/**, etc.
# ─────────────────────────────────────────────────────────
echo "▶ Criando trigger: sunos-frontend-deploy..."
gcloud builds triggers create github \
  --name="sunos-frontend-deploy" \
  --description="Deploy sunOS Frontend (Next.js 14) on push to main/app|components|lib|public/**" \
  --repo-owner="${REPO_OWNER}" \
  --repo-name="${REPO_NAME}" \
  --branch-pattern="${BRANCH}" \
  --build-config="cloudbuild-frontend.yaml" \
  --included-files="app/**,components/**,lib/**,hooks/**,contexts/**,public/**,next.config.mjs,Dockerfile,package*.json" \
  --region="${REGION}" \
  --service-account="projects/${PROJECT_ID}/serviceAccounts/sunos-cloudbuild@${PROJECT_ID}.iam.gserviceaccount.com" \
  --substitutions="_GCP_PROJECT_ID=${PROJECT_ID}" \
  --quiet 2>/dev/null || echo "  trigger sunos-frontend-deploy já existe — pulando"

# ─────────────────────────────────────────────────────────
# 3. Verificar triggers criados
# ─────────────────────────────────────────────────────────
echo ""
echo "▶ Triggers ativos:"
gcloud builds triggers list \
  --region="${REGION}" \
  --filter="name~sunos" \
  --format="table(name,createTime,github.push.branch,filename)"

echo ""
echo "════════════════════════════════════════════════════"
echo " ✅  Triggers configurados."
echo ""
echo " Próximos passos:"
echo "  1. Verifique em: https://console.cloud.google.com/cloud-build/triggers"
echo "  2. Para forçar deploy imediato:"
echo "     gcloud builds triggers run sunos-backend-deploy --region=${REGION} --branch=main"
echo "     gcloud builds triggers run sunos-frontend-deploy --region=${REGION} --branch=main"
echo "  3. Monitore builds:"
echo "     https://console.cloud.google.com/cloud-build/builds;region=${REGION}"
echo "════════════════════════════════════════════════════"
