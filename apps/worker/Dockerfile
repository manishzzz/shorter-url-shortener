FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/database/package.json packages/database/package.json
COPY packages/database/prisma packages/database/prisma
COPY packages/database/src packages/database/src
COPY apps/worker/package.json apps/worker/package.json
COPY apps/worker/tsconfig.json apps/worker/tsconfig.json
COPY apps/worker/tsconfig.build.json apps/worker/tsconfig.build.json
COPY apps/worker/src apps/worker/src

RUN pnpm install --frozen-lockfile --ignore-scripts && pnpm rebuild esbuild @prisma/client prisma @prisma/engines
RUN pnpm --filter @shorter/database prisma:generate
RUN pnpm --filter @shorter/worker build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN corepack enable

COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/tsconfig.base.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/worker/package.json ./apps/worker/package.json
COPY --from=builder /app/apps/worker/node_modules ./apps/worker/node_modules
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist
COPY --from=builder /app/packages/database/package.json ./packages/database/package.json
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/packages/database/src/index.js ./packages/database/src/index.js
COPY --from=builder /app/packages/database/src/index.d.ts ./packages/database/src/index.d.ts
COPY --from=builder /app/packages/database/src/generated ./packages/database/src/generated

CMD ["node", "apps/worker/dist/index.js"]
