# ── Build stage ──────────────────────────────────────────────────────────────
# Compilers and the full dependency tree live here only; none of it ships.
FROM node:22-slim AS builder

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY --from=oven/bun:1 /usr/local/bin/bun /usr/local/bin/bun

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# ── Runtime stage ─────────────────────────────────────────────────────────────
# Nitro bundles every dependency into .output except better-sqlite3, which is
# kept external (nuxt.config.ts). Its native binding plus the two tiny packages
# that load it are all the server needs at runtime.
FROM node:22-slim AS runner

WORKDIR /app

COPY --from=builder /app/.output ./.output
COPY --from=builder /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3
COPY --from=builder /app/node_modules/bindings ./node_modules/bindings
COPY --from=builder /app/node_modules/file-uri-to-path ./node_modules/file-uri-to-path

RUN mkdir -p /data

ENV NODE_ENV=production
ENV DATABASE_PATH=/data/storelog.db
ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

VOLUME ["/data"]

CMD ["node", ".output/server/index.mjs"]
