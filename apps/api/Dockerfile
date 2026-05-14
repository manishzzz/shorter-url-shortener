FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/database/package.json packages/database/package.json
COPY packages/database/prisma packages/database/prisma
COPY packages/database/src packages/database/src
COPY apps/api/package.json apps/api/package.json
COPY apps/api/tsconfig.json apps/api/tsconfig.json
COPY apps/api/tsconfig.build.json apps/api/tsconfig.build.json
COPY apps/api/src apps/api/src

RUN pnpm install --frozen-lockfile --ignore-scripts && pnpm rebuild esbuild @prisma/client prisma @prisma/engines
RUN pnpm --filter @shorter/database prisma:generate
RUN pnpm --filter @shorter/api build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN corepack enable

COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/tsconfig.base.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY apps/api/docker-entrypoint.sh ./apps/api/docker-entrypoint.sh
COPY --from=builder /app/packages/database/package.json ./packages/database/package.json
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/packages/database/src/index.js ./packages/database/src/index.js
COPY --from=builder /app/packages/database/src/index.d.ts ./packages/database/src/index.d.ts
COPY --from=builder /app/packages/database/src/generated ./packages/database/src/generated

EXPOSE 4000

CMD ["sh", "apps/api/docker-entrypoint.sh"]
