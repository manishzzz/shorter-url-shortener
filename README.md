# Shorter

Shorter is a production-style URL shortener with a Redis-accelerated redirect path, asynchronous click logging, analytics, rate limiting, Dockerized local infrastructure, and a polished React frontend.

## Features

- `POST /shorten` accepts `{ "url": "...", "customAlias": "optional" }`
- `GET /:code` performs a `301` redirect and logs clicks asynchronously
- `GET /analytics/:code` returns click count, timeline, and top referrers
- Global rate limiting at `100 req/min` per IP
- Redis-backed hot-path caching for popular links with a `1 hour` TTL
- Background worker for click-event persistence
- Docker Compose stack with Postgres and Redis
- TypeScript workspace with unit tests and production builds

## Stack

- API: Fastify, Zod, Prisma, Postgres, Redis
- Worker: Node.js + Prisma + Redis queue consumption
- Frontend: React, Vite, Recharts
- Infra: Docker Compose, nginx, Render blueprint

## Project Structure

```text
apps/
  api/      Fastify API
  worker/   Async click logging worker
  web/      React frontend
packages/
  database/ Prisma schema and shared client
```

## Environment

Copy [.env.example](C:\Users\manis\Desktop\shorter\.env.example) to `.env` and adjust values if needed.

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/shorter
REDIS_URL=redis://localhost:6379
API_PORT=4000
API_BASE_URL=http://localhost:4000
WEB_BASE_URL=http://localhost:3000
POPULAR_CACHE_THRESHOLD=10
CLICK_BATCH_SIZE=100
```

## Run Locally

1. Install dependencies:

```bash
corepack pnpm install
```

2. Generate the Prisma client:

```bash
packages/database/node_modules/.bin/prisma generate --schema packages/database/prisma/schema.prisma
```

3. Start Postgres and Redis:

```bash
docker compose up -d postgres redis
```

4. Run the initial migration:

```bash
set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/shorter && packages/database/node_modules/.bin/prisma migrate dev --schema packages/database/prisma/schema.prisma --name init
```

5. Start the apps:

```bash
corepack pnpm --parallel --filter @shorter/api --filter @shorter/worker --filter @shorter/web dev
```

Frontend: [http://localhost:3000](http://localhost:3000)  
API: [http://localhost:4000](http://localhost:4000)

## Run With Docker Compose

1. Create a `.env` file from `.env.example`.
2. Build and start the stack:

```bash
docker compose up --build
```

Services:

- Frontend: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:4000](http://localhost:4000)
- Postgres: `localhost:5432`
- Redis: `localhost:6379`

## API Examples

Create a short URL:

```bash
curl -X POST http://localhost:4000/shorten ^
  -H "Content-Type: application/json" ^
  -d "{\"url\":\"https://example.com/blog/launch\",\"customAlias\":\"launch-drop\"}"
```

Fetch analytics:

```bash
curl http://localhost:4000/analytics/launch-drop
```

Visit a short link:

```bash
curl -I http://localhost:4000/launch-drop
```

## Tests and Builds

API unit tests:

```bash
apps/api/node_modules/.bin/vitest run --coverage
```

Type-check:

```bash
apps/api/node_modules/.bin/tsc --noEmit -p apps/api/tsconfig.json
apps/worker/node_modules/.bin/tsc --noEmit -p apps/worker/tsconfig.json
apps/web/node_modules/.bin/tsc --noEmit -p apps/web/tsconfig.json
```

Production build:

```bash
apps/api/node_modules/.bin/tsc -p apps/api/tsconfig.build.json
apps/worker/node_modules/.bin/tsc -p apps/worker/tsconfig.build.json
apps/web/node_modules/.bin/vite build
```

## Deployment

### Render

The repo includes [render.yaml](C:\Users\manis\Desktop\shorter\render.yaml), which defines:

- `shorter-api` web service
- `shorter-worker` background worker
- `shorter-web` frontend service
- managed Postgres
- managed Redis

### Notes

- Redirects are served immediately; click persistence happens through a Redis-backed queue.
- Popular links are cached in Redis after they cross the popularity threshold.
- Analytics timeline is aggregated per day from persisted click events.
- The Docker API image runs `prisma migrate deploy` on startup before launching the Fastify server.
