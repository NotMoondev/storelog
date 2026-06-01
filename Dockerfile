# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:22-slim AS builder

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* bun.lock* bun.lockb* ./
RUN npm install

COPY . .
RUN npm run build

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM node:22-slim AS runner

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* bun.lock* bun.lockb* ./
RUN npm ci --omit=dev

COPY --from=builder /app/.output ./.output

RUN mkdir -p /data

ENV NODE_ENV=production
ENV DATABASE_PATH=/data/storelog.db
ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

VOLUME ["/data"]

CMD ["node", ".output/server/index.mjs"]
