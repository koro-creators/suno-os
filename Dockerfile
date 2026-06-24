# Dockerfile do frontend sunOS (Next.js 14 standalone) — Cloud Run: sunos-frontend (us-west1)
# Build: docker build -t <img> --build-arg NEXT_PUBLIC_API_URL=<api-url> .
#
# NEXT_PUBLIC_API_URL é inlined em build-time (variáveis NEXT_PUBLIC_* entram no
# bundle durante `next build`); por isso vem como --build-arg, não só env de runtime.

# ── Stage 1: deps ────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
# .npmrc mapeia o escopo @koro-creators (pacote privado da feature Projetos) para
# o GitHub Packages e lê o token de ${NODE_AUTH_TOKEN}. O token entra como secret
# do BuildKit (não fica em layer/imagem). Build: docker build --secret
# id=node_auth_token,env=NODE_AUTH_TOKEN ...
COPY package.json package-lock.json .npmrc ./
RUN --mount=type=secret,id=node_auth_token \
    NODE_AUTH_TOKEN="$(cat /run/secrets/node_auth_token 2>/dev/null || true)" npm ci

# ── Stage 2: builder ─────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

ARG NEXT_PUBLIC_API_URL
# Backend do Venus consumido pela feature Projetos. Usado no rewrites() do
# next.config, que o Next avalia em BUILD-TIME (vai pro routes-manifest) — por
# isso é build-arg, não só env de runtime. Vazio → sem rewrite (aba Projetos
# sem dados até configurar).
ARG VENUS_API_URL
# Config do Firebase (NEXT_PUBLIC_* é inlined no bundle em build-time).
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    VENUS_API_URL=$VENUS_API_URL \
    NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY \
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN \
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID \
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET \
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID \
    NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID \
    NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ── Stage 3: runner ──────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Non-root user
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Standalone output: server.js + traced node_modules, static assets e public/
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
