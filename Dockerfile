# Multi-stage build for Next.js + better-sqlite3 (native module).
# WHY: We need python3/make/g++ to compile better-sqlite3 from source for Linux.
#      Alpine keeps the final image small while still having the build tools.
# EFFECT: Produces a self-contained image — no dependency on the host OS.

# ── Stage 1: build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# Native module compilation requires these build tools
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy manifests first so npm ci layer is cached unless deps change
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: runtime ────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

# Keep build tools in the runner so better-sqlite3 can be required at runtime
RUN apk add --no-cache python3 make g++

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy everything we need to run the app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/app/generated ./app/generated

EXPOSE 3000

# prisma db push creates/migrates the schema on the volume before the server starts
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npm start"]
