# Project Details

## What This Project Is

Shorter is a production-style URL shortener platform built as a TypeScript monorepo. It is designed to look and behave like a real product instead of a toy demo:

- short-link creation with optional custom aliases
- redirect handling with asynchronous click logging
- analytics for click counts, timeline trends, and top referrers
- Redis-assisted hot-path caching
- Dockerized local infrastructure with Postgres and Redis
- a React frontend for link creation and analytics browsing

## Product Model

This project follows the standard model used by commercial shorteners:

```text
public-short-domain/alias
```

Examples in the market include:

- branded links on Bitly
- custom domains on Dub
- branded domains on Rebrandly

The important implication is that the shortener should never expose an internal infrastructure host such as `localhost` or a raw backend origin to end users. Instead, it should be configured with a user-facing short-link base domain.

## Architecture

### API

The API is built with Fastify and handles:

- creating short URLs
- resolving codes into `301` redirects
- validating input with Zod
- rate limiting traffic per IP
- returning analytics aggregates

### Worker

The worker consumes queued click events from Redis and persists them to Postgres. Redirects stay fast because the user does not wait for the analytics write path.

### Database

Postgres stores:

- short URLs
- click counts
- click events used for timeline and referrer analytics

Prisma is used for the schema and query client.

### Cache

Redis is used for:

- queueing click events for asynchronous processing
- caching popular URL resolutions for one hour
- lightweight request counting for rate limiting

### Frontend

The frontend is a React + Vite app that provides:

- a URL composer
- a recent-links list
- analytics dashboards
- a UI that emphasizes the short code and the branded short domain

## Key Configuration

### API-side

- `API_BASE_URL`: where the API itself lives
- `SHORT_BASE_URL`: what users should see in the short link
- `WEB_BASE_URL`: where the frontend lives
- `ALLOWED_ORIGINS`: extra CORS origins if needed
- `CLICK_LOG_MODE`: `queue` for worker-based processing or `inline` for single-service deployments

### Web-side

- `VITE_API_BASE_URL`: the origin used for API requests
- `VITE_SHORT_BASE_URL`: the short-link domain shown in the UI

## Why Users Were Seeing `localhost`

If the system is configured with:

```text
API_BASE_URL=http://localhost:4000
SHORT_BASE_URL not set
```

then the generated short links will naturally look like:

```text
http://localhost:4000/your-alias
```

That does **not** mean the shortener failed. It means the alias is short, but the public base domain is still a local development host. The fix is to point the shortener at a real public short-link domain.

## Recommended Production Setup

Use separate domains for clarity:

- frontend app: `https://app.yourbrand.com`
- backend API: `https://api.yourbrand.com`
- short links: `https://go.yourbrand.com`

That gives users links like:

```text
https://go.yourbrand.com/spring
```

instead of:

```text
http://localhost:4000/spring
```

## Endpoints

### `POST /shorten`

Request:

```json
{
  "url": "https://example.com/product-launch",
  "customAlias": "launch"
}
```

Response:

```json
{
  "code": "launch",
  "shortUrl": "https://go.yourbrand.com/launch"
}
```

### `GET /:code`

- resolves the short code
- returns a `301` redirect
- logs click activity asynchronously

### `GET /analytics/:code`

Returns:

- click count
- created date
- last accessed date
- daily timeline
- top referrers

## Operational Notes

- redirects are optimized for responsiveness
- analytics writes are decoupled through Redis
- popular URLs are cached for faster repeat resolution
- the system is suitable for local Docker use and can be adapted to cloud deployment with a proper public domain
- for hosts that do not allow a free background worker, the API can run in `CLICK_LOG_MODE=inline` and persist clicks directly

## Summary

This project is a full-stack shortener platform, not just a redirect script. The main thing that determines whether links *feel* short to users is the public short domain you configure. The code path already supports short aliases; the correct next step is using a branded short domain as the visible base URL.
