import { Prisma, prisma } from "../../../../../packages/database/src/index.js";
import type { Redis } from "ioredis";
import { getConfig, getShortBaseUrl } from "../../config.js";
import type { QueuedClickEvent } from "../../worker-types.js";
import { buildTimeline, normalizeReferrers } from "./analytics.js";
import { PopularUrlCache } from "./cache.js";
import { generateCode } from "./code.js";
import type { ShortenUrlInput } from "./schema.js";

const CLICK_QUEUE_KEY = "click-events";

export class AliasConflictError extends Error {
  constructor(code: string) {
    super(`Short code "${code}" is already in use.`);
  }
}

export class ShortCodeNotFoundError extends Error {
  constructor(code: string) {
    super(`Short code "${code}" was not found.`);
  }
}

export class ShortenerService {
  private readonly cache: PopularUrlCache;
  private readonly config = getConfig();

  constructor(private readonly redis: Redis) {
    this.cache = new PopularUrlCache(redis, this.config.POPULAR_CACHE_THRESHOLD);
  }

  async createShortUrl(input: ShortenUrlInput) {
    const code = input.customAlias ?? generateCode();

    try {
      const shortUrl = await prisma.shortUrl.create({
        data: {
          code,
          originalUrl: input.url,
          customAlias: Boolean(input.customAlias),
        },
      });

      return {
        code: shortUrl.code,
        shortUrl: `${getShortBaseUrl()}/${shortUrl.code}`,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new AliasConflictError(code);
      }

      throw error;
    }
  }

  async resolveShortCode(code: string) {
    const cached = await this.cache.get(code);
    if (cached) {
      return {
        originalUrl: cached,
        cached: true,
      };
    }

    const shortUrl = await prisma.shortUrl.findUnique({
      where: { code },
      select: {
        originalUrl: true,
      },
    });

    if (!shortUrl) {
      throw new ShortCodeNotFoundError(code);
    }

    return {
      originalUrl: shortUrl.originalUrl,
      cached: false,
    };
  }

  async queueClick(code: string, payload: Omit<QueuedClickEvent, "code" | "clickedAt">) {
    if (this.config.CLICK_LOG_MODE === "inline") {
      await this.persistClick({
        code,
        clickedAt: new Date().toISOString(),
        ...payload,
      });
      return;
    }

    await this.redis.lpush(
      CLICK_QUEUE_KEY,
      JSON.stringify({
        code,
        clickedAt: new Date().toISOString(),
        ...payload,
      } satisfies QueuedClickEvent),
    );
  }

  async warmPopularCache(code: string, originalUrl: string) {
    await this.cache.markHit(code, originalUrl);
  }

  private async persistClick(event: QueuedClickEvent) {
    const shortUrl = await prisma.shortUrl.findUnique({
      where: { code: event.code },
      select: { id: true },
    });

    if (!shortUrl) {
      return;
    }

    await prisma.$transaction([
      prisma.clickEvent.create({
        data: {
          shortUrlId: shortUrl.id,
          clickedAt: new Date(event.clickedAt),
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          referrer: event.referrer,
        },
      }),
      prisma.shortUrl.update({
        where: { code: event.code },
        data: {
          clickCount: {
            increment: 1,
          },
          lastAccessedAt: new Date(event.clickedAt),
        },
      }),
    ]);
  }

  async getAnalytics(code: string) {
    const shortUrl = await prisma.shortUrl.findUnique({
      where: { code },
      select: {
        id: true,
        code: true,
        originalUrl: true,
        clickCount: true,
        createdAt: true,
        lastAccessedAt: true,
      },
    });

    if (!shortUrl) {
      throw new ShortCodeNotFoundError(code);
    }

    const timelineRows = await prisma.$queryRaw<Array<{ date: Date; clicks: bigint }>>`
      SELECT DATE_TRUNC('day', "clickedAt") AS date, COUNT(*)::bigint AS clicks
      FROM "ClickEvent"
      WHERE "shortUrlId" = ${shortUrl.id}
      GROUP BY DATE_TRUNC('day', "clickedAt")
      ORDER BY date ASC
    `;

    const referrerRows = await prisma.$queryRaw<
      Array<{ referrer: string | null; clicks: bigint }>
    >`
      SELECT COALESCE(NULLIF(TRIM("referrer"), ''), 'direct') AS referrer, COUNT(*)::bigint AS clicks
      FROM "ClickEvent"
      WHERE "shortUrlId" = ${shortUrl.id}
      GROUP BY COALESCE(NULLIF(TRIM("referrer"), ''), 'direct')
      ORDER BY clicks DESC
      LIMIT 5
    `;

    return {
      code: shortUrl.code,
      originalUrl: shortUrl.originalUrl,
      clickCount: shortUrl.clickCount,
      createdAt: shortUrl.createdAt,
      lastAccessedAt: shortUrl.lastAccessedAt,
      timeline: buildTimeline(timelineRows),
      topReferrers: normalizeReferrers(referrerRows),
    };
  }
}

export const clickQueueKey = CLICK_QUEUE_KEY;
