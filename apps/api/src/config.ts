import { z } from "zod";
import { parseAllowedOrigins } from "./lib/origins.js";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().positive().default(4000),
  API_BASE_URL: z.url().default("http://localhost:4000"),
  WEB_BASE_URL: z.url().default("http://localhost:3000"),
  ALLOWED_ORIGINS: z.string().default(""),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  POPULAR_CACHE_THRESHOLD: z.coerce.number().int().positive().default(10),
  CLICK_BATCH_SIZE: z.coerce.number().int().positive().default(100),
});

export type AppConfig = z.infer<typeof envSchema>;

let cachedConfig: AppConfig | null = null;

export const getConfig = (): AppConfig => {
  cachedConfig ??= envSchema.parse(process.env);
  return cachedConfig;
};

export const getAllowedOrigins = () => {
  const config = getConfig();

  return Array.from(
    new Set([config.WEB_BASE_URL, ...parseAllowedOrigins(config.ALLOWED_ORIGINS)]),
  );
};
