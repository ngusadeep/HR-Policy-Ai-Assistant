# ── Stage 1: Install & Build ──────────────────────────────────────────────────
# syntax=docker/dockerfile:1
FROM node:22-alpine AS builder

ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="${PNPM_HOME}:${PATH}"

RUN apk add --no-cache bash && \
    corepack enable && \
    corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

# Cache the pnpm store between builds — avoids re-downloading on every build
RUN --mount=type=cache,id=pnpm-frontend,target=/root/.local/share/pnpm/store \
    HUSKY=0 pnpm install --frozen-lockfile

COPY . .

# VITE_API_URL is baked into the bundle at build time
ARG VITE_API_URL=http://localhost/api/v1
ENV VITE_API_URL=${VITE_API_URL}

RUN pnpm run build

# ── Stage 2: Export built files to a shared volume ───────────────────────────
# This container exits after copying dist/ to /output (mounted as a volume).
# Nginx mounts the same volume to serve the static files.
FROM alpine:3.19

COPY --from=builder /app/dist /dist

CMD ["sh", "-c", "cp -r /dist/. /output/ && echo 'Frontend assets ready.'"]
