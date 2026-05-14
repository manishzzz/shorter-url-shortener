import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import Fastify from "fastify";
import { ZodError } from "zod";
import { getAllowedOrigins, getConfig } from "./config.js";
import { getRedis } from "./lib/redis.js";
import { isAllowedOrigin } from "./lib/origins.js";
import {
  AliasConflictError,
  ShortCodeNotFoundError,
  ShortenerService,
} from "./modules/shortener/service.js";
import { shortenUrlSchema } from "./modules/shortener/schema.js";

export const buildApp = () => {
  const config = getConfig();
  const allowedOrigins = getAllowedOrigins();
  const redis = getRedis();
  const shortenerService = new ShortenerService(redis);
  const app = Fastify({
    logger: config.NODE_ENV === "production" ? true : { transport: { target: "pino-pretty" } },
  });

  app.register(sensible);
  app.register(cors, {
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      callback(null, isAllowedOrigin(origin, allowedOrigins) ? origin : false);
    },
  });

  app.addHook("onRequest", async (request, reply) => {
    const key = `rate:${request.ip}`;
    const requestCount = await redis.incr(key);

    if (requestCount === 1) {
      await redis.expire(key, 60);
    }

    if (requestCount > 100) {
      return reply.code(429).send({
        message: "Too many requests. Please try again in a minute.",
      });
    }
  });

  app.get("/health", async () => ({ status: "ok" }));

  app.post("/shorten", async (request, reply) => {
    const payload = shortenUrlSchema.parse(request.body);
    const created = await shortenerService.createShortUrl(payload);
    return reply.code(201).send(created);
  });

  app.get("/analytics/:code", async (request) => {
    const { code } = request.params as { code: string };
    return shortenerService.getAnalytics(code);
  });

  app.get("/:code", async (request, reply) => {
    const { code } = request.params as { code: string };
    const result = await shortenerService.resolveShortCode(code);

    void Promise.all([
      shortenerService.warmPopularCache(code, result.originalUrl),
      shortenerService.queueClick(code, {
        ipAddress: request.ip,
        userAgent: request.headers["user-agent"],
        referrer: request.headers.referer,
      }),
    ]).catch((error) => request.log.error({ err: error, code }, "Failed to queue click event"));

    return reply.redirect(result.originalUrl, 301);
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({
        message: "Invalid request payload",
        issues: error.flatten(),
      });
    }

    if (error instanceof AliasConflictError) {
      return reply.code(409).send({ message: error.message });
    }

    if (error instanceof ShortCodeNotFoundError) {
      return reply.code(404).send({ message: error.message });
    }

    request.log.error(error);
    return reply.code(500).send({ message: "Internal server error" });
  });

  return app;
};
