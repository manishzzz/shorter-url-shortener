import { prisma } from "../../../packages/database/src/index.js";
import { Redis } from "ioredis";
import { z } from "zod";

const envSchema = z.object({
  REDIS_URL: z.string().min(1),
  CLICK_BATCH_SIZE: z.coerce.number().int().positive().default(100),
});

const clickEventSchema = z.object({
  code: z.string().min(1),
  clickedAt: z.string().datetime(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  referrer: z.string().optional(),
});

const CLICK_QUEUE_KEY = "click-events";

const run = async () => {
  const env = envSchema.parse(process.env);
  const redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
  });

  const shutdown = async () => {
    await redis.quit();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  while (true) {
    const messages = await redis.brpop(CLICK_QUEUE_KEY, 0);
    if (!messages?.[1]) {
      continue;
    }

    const batch = [messages[1]];
    const extraMessages = await redis.rpop(CLICK_QUEUE_KEY, env.CLICK_BATCH_SIZE - 1);
    if (Array.isArray(extraMessages)) {
      batch.push(...extraMessages);
    }

    const parsed = batch.map((raw) => clickEventSchema.parse(JSON.parse(raw)));
    const uniqueCodes = [...new Set(parsed.map((entry) => entry.code))];
    const urls = await prisma.shortUrl.findMany({
      where: {
        code: {
          in: uniqueCodes,
        },
      },
      select: {
        id: true,
        code: true,
      },
    });

    const idByCode = new Map(urls.map((item) => [item.code, item.id]));
    const validEvents = parsed.filter((entry) => idByCode.has(entry.code));

    if (validEvents.length === 0) {
      continue;
    }

    await prisma.$transaction([
      prisma.clickEvent.createMany({
        data: validEvents.map((entry) => ({
          shortUrlId: idByCode.get(entry.code)!,
          clickedAt: new Date(entry.clickedAt),
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          referrer: entry.referrer,
        })),
      }),
      ...Array.from(
        validEvents.reduce((acc, entry) => {
          acc.set(entry.code, (acc.get(entry.code) ?? 0) + 1);
          return acc;
        }, new Map<string, number>()),
      ).map(([code, increment]) =>
        prisma.shortUrl.update({
          where: { code },
          data: {
            clickCount: {
              increment,
            },
            lastAccessedAt: new Date(),
          },
        }),
      ),
    ]);
  }
};

run().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
