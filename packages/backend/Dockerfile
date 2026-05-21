# ---- Base ----
FROM node:24-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.28.1 --activate
WORKDIR /app

# ---- Development ----
FROM base AS development
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/
RUN pnpm install --filter @openxeco/atlas-connector-backend...
COPY tsconfig.base.json ./
COPY packages/backend/ ./packages/backend/
WORKDIR /app/packages/backend
CMD ["pnpm", "dev"]

# ---- Dependencies ----
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/
RUN pnpm install --frozen-lockfile --filter @openxeco/atlas-connector-backend...

# ---- Builder ----
FROM deps AS builder
COPY tsconfig.base.json ./
COPY packages/backend/ ./packages/backend/
WORKDIR /app/packages/backend
RUN pnpm build

# ---- Production dependencies ----
FROM base AS prod-deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/
RUN pnpm install --frozen-lockfile --filter @openxeco/atlas-connector-backend... --prod

# ---- Production ----
FROM node:24-alpine AS production
WORKDIR /app/packages/backend
ENV NODE_ENV=production

COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=prod-deps /app/packages/backend/node_modules ./node_modules
COPY --from=builder /app/packages/backend/dist ./dist
COPY --from=builder /app/packages/backend/package.json ./package.json

# Include migration files for drizzle-kit migrate
COPY --from=builder /app/packages/backend/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/packages/backend/src/db/migrations ./src/db/migrations

EXPOSE 3001

CMD ["node", "dist/index.js"]
