import { describe, expect, it, vi } from "vitest";
import { PopularUrlCache } from "../src/modules/shortener/cache.js";

describe("PopularUrlCache", () => {
  it("starts caching once the threshold is reached", async () => {
    const redis = {
      incr: vi.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(2),
      expire: vi.fn().mockResolvedValue(1),
      set: vi.fn().mockResolvedValue("OK"),
      get: vi.fn(),
    } as any;

    const cache = new PopularUrlCache(redis, 2);

    await cache.markHit("demo", "https://example.com");
    await cache.markHit("demo", "https://example.com");

    expect(redis.expire).toHaveBeenCalledWith("hits:demo", 3600);
    expect(redis.set).toHaveBeenCalledWith(
      "url:demo",
      "https://example.com",
      "EX",
      3600,
    );
  });
});
