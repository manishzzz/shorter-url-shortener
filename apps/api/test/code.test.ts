import { describe, expect, it } from "vitest";
import { generateCode } from "../src/modules/shortener/code.js";

describe("generateCode", () => {
  it("creates a 7 character code using the expected alphabet", () => {
    const code = generateCode();
    expect(code).toHaveLength(7);
    expect(code).toMatch(/^[23456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ]+$/);
  });
});
