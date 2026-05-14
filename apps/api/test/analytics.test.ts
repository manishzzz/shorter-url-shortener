import { describe, expect, it } from "vitest";
import { buildTimeline, normalizeReferrers } from "../src/modules/shortener/analytics.js";

describe("analytics helpers", () => {
  it("builds a serializable timeline", () => {
    expect(
      buildTimeline([
        { date: new Date("2026-05-14T00:00:00.000Z"), clicks: 4n },
        { date: new Date("2026-05-15T00:00:00.000Z"), clicks: 2 },
      ]),
    ).toEqual([
      { date: "2026-05-14", clicks: 4 },
      { date: "2026-05-15", clicks: 2 },
    ]);
  });

  it("normalizes empty referrers to direct", () => {
    expect(
      normalizeReferrers([
        { referrer: null, clicks: 5n },
        { referrer: "https://news.ycombinator.com", clicks: 2 },
      ]),
    ).toEqual([
      { referrer: "direct", clicks: 5 },
      { referrer: "https://news.ycombinator.com", clicks: 2 },
    ]);
  });
});
