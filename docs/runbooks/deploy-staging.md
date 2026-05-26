# Runbook: Deploy Manual para Staging

## Visão geral

O workflow `.github/workflows/deploy-staging.yml` faz deploy da API (`api/`) para o Cloud Run
no ambiente `sunos-api-staging`. É acionado **apenas manualmente** via GitHub Actions UI
(`workflow_dispatch`) — não dispara automaticamente em push.

## Pré-requisitos

### 1. Workload Identity Federation (WIF) no GCP

O workflow autentica sem chave de serviço (keyless) via WIF. Passos de configuração:

```bash
# 1. Criar Workload Identity Pool
gcloud iam workload-identity-pools create "github-actions" \
  --project="${GCP_PROJECT_ID}" \
  --location="global" \
  --display-name="GitHub Actions"

# 2. Criar provider OIDC para o repo
gcloud iam workload-identity-pools providers create-oidc "github-repo" \
  --project="${GCP_PROJECT_ID}" \
  --location="global" \
  --workload-identity-pool="github-actions" \
  --display-name="GitHub OIDC" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# 3. Conceder acesso à service account para o repo
gcloud iam service-accounts add-iam-policy-binding "${GCP_SERVICE_ACCOUNT}@${GCP_PROJECT_ID}.iam.gserviceaccount.com" \
  --project="${GCP_PROJECT_ID}" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${GCP_PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-actions/attribute.repository/heitorsm/sunos"
```

### 2. Service Account — permissões mínimas necessárias

| Role | Para que |
|------|----------|
| `roles/run.admin` | Deploy no Cloud Run |
| `roles/artifactregistry.writer` | Push de imagem Docker |
| `roles/iam.serviceAccountUser` | Associar SA ao Cloud Run service |
| `roles/secretmanager.secretAccessor` | Ler secrets no deploy |

### 3. GitHub Secrets — configurar em Settings > Secrets > Actions

| Secret | Valor esperado |
|--------|----------------|
| `GCP_PROJECT_ID` | ID do projeto GCP (ex: `sunos-prod-123`) |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Full provider resource name: `projects/<number>/locations/global/workloadIdentityPools/github-actions/providers/github-repo` |
| `GCP_SERVICE_ACCOUNT` | Email da SA: `<nome>@<project>.iam.gserviceaccount.com` |
| `FIREBASE_PROJECT_ID` | ID do projeto Firebase |

Secrets de aplicação (gerenciados pelo Secret Manager, não como GitHub Secrets):
- `sunos-database-url` — Cloud SQL connection string
- `sunos-google-api-key` — chave da Google AI / Vertex

## Como acionar o deploy

1. Acesse **Actions** no repositório GitHub
2. Selecione o workflow **"Deploy — Staging"**
3. Clique em **"Run workflow"**
4. Preencha o campo `reason` (opcional) e confirme

O workflow faz automaticamente:
- Build e push da imagem para Artifact Registry (`us-central1-docker.pkg.dev`)
- Deploy para `sunos-api-staging` no Cloud Run (us-central1)
- Smoke test em `GET /health` com token de identidade
