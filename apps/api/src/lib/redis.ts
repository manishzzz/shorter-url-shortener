import { Redis } from "ioredis";
import { getConfig } from "../config.js";

let redisInstance: Redis | null = null;

export const getRedis = (): Redis => {
  if (!redisInstance) {
    redisInstance = new Redis(getConfig().REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });
  }

  return redisInstance;
};

export const closeRedis = async () => {
  if (redisInstance) {
    await redisInstance.quit();
    redisInstance = null;
  }
};
