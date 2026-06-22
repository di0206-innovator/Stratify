# ════════════════════════════════════════════════════════════════════
#  NeuralBI — Multi-stage Dockerfile
#  Stage 1 (builder): compile Vite frontend
#  Stage 2 (runner):  production Node.js server (minimal image)
# ════════════════════════════════════════════════════════════════════

# ── Stage 1: Build the React/Vite frontend ─────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps first (better layer caching — only re-runs if package.json changes)
COPY package*.json ./
RUN npm ci --include=dev

# Copy source and build
COPY . .
RUN npm run build

# ── Stage 2: Production runner ─────────────────────────────────────
FROM node:20-alpine AS runner

# Security: run as non-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 --ingroup nodejs neuralbi

WORKDIR /app

# Install PRODUCTION dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy server-side code
COPY --from=builder /app/dist          ./dist
COPY --from=builder /app/lib           ./lib
COPY --from=builder /app/server.js     ./server.js
COPY --from=builder /app/cluster.js    ./cluster.js

# Ensure data dir is owned by our user BEFORE switching user
RUN mkdir -p /app/data && chown -R neuralbi:nodejs /app/data && chmod -R 775 /app/data

# Copy .env.example as default template (overridden by Docker environment vars at runtime)
COPY .env.example .env

# ── Runtime env ────────────────────────────────────────────────────
ENV NODE_ENV=production
ENV PORT=3000

# Default Firebase project (override at runtime via -e or docker-compose)
ENV FIREBASE_PROJECT_ID=studio-9817976701-89717
ENV GOOGLE_CLOUD_PROJECT=studio-9817976701-89717

# PG pool: 10 connections per worker (conservative for Docker)
ENV PG_POOL_MAX=10

EXPOSE 3000

# ── Volume for file-store fallback ─────────────────────────────────
VOLUME ["/app/data"]

USER neuralbi

# Use cluster.js so all CPU cores are used in the container.
# Set WORKERS=1 in Kubernetes (let the orchestrator handle replicas).
CMD ["node", "cluster.js"]
