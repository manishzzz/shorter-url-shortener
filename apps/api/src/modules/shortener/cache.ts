import type { Redis } from "ioredis";

const urlKey = (code: string) => `url:${code}`;
const hitKey = (code: string) => `hits:${code}`;

export class PopularUrlCache {
  constructor(
    private readonly redis: Redis,
    private readonly threshold: number,
  ) {}

  async get(code: string) {
    return this.redis.get(urlKey(code));
  }

  async markHit(code: string, originalUrl: string) {
    const hits = await this.redis.incr(hitKey(code));
    if (hits === 1) {
      await this.redis.expire(hitKey(code), 3600);
    }

    if (hits >= this.threshold) {
      await this.redis.set(urlKey(code), originalUrl, "EX", 3600);
    }
  }
}
