import { describe, expect, it } from "vitest";
import { isAllowedOrigin, parseAllowedOrigins } from "../src/lib/origins.js";

describe("origin helpers", () => {
  it("parses a comma-separated allowlist", () => {
    expect(
      parseAllowedOrigins("https://app.example.com, https://admin.example.com/"),
    ).toEqual(["https://app.example.com", "https://admin.example.com"]);
  });

  it("allows configured origins and safe deployment defaults", () => {
    const configuredOrigins = ["https://app.example.com"];

    expect(isAllowedOrigin(undefined, configuredOrigins)).toBe(true);
    expect(isAllowedOrigin("https://app.example.com/", configuredOrigins)).toBe(true);
    expect(isAllowedOrigin("http://localhost:3000", configuredOrigins)).toBe(true);
    expect(
      isAllowedOrigin(
        "https://groove-favorite-tire-pulse.trycloudflare.com",
        configuredOrigins,
      ),
    ).toBe(true);
    expect(isAllowedOrigin("https://evil-example.com", configuredOrigins)).toBe(false);
  });
});
