import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getAllowedOrigins,
  getConfig,
  getShortBaseUrl,
  resetConfigCache,
} from "../src/config.js";

describe("config helpers", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    resetConfigCache();
  });

  it("uses SHORT_BASE_URL when provided", () => {
    vi.stubEnv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/shorter");
    vi.stubEnv("REDIS_URL", "redis://localhost:6379");
    vi.stubEnv("SHORT_BASE_URL", "https://go.example.com/");

    expect(getShortBaseUrl()).toBe("https://go.example.com");
  });

  it("falls back to API_BASE_URL when SHORT_BASE_URL is missing", () => {
    vi.stubEnv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/shorter");
    vi.stubEnv("REDIS_URL", "redis://localhost:6379");
    vi.stubEnv("API_BASE_URL", "http://localhost:4000/");

    expect(getShortBaseUrl()).toBe("http://localhost:4000");
  });

  it("includes configured web origin in the allowlist", () => {
    vi.stubEnv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/shorter");
    vi.stubEnv("REDIS_URL", "redis://localhost:6379");
    vi.stubEnv("WEB_BASE_URL", "https://app.example.com");
    vi.stubEnv("ALLOWED_ORIGINS", "https://admin.example.com");

    expect(getAllowedOrigins()).toEqual([
      "https://app.example.com",
      "https://admin.example.com",
    ]);
    expect(getConfig().WEB_BASE_URL).toBe("https://app.example.com");
  });
});
