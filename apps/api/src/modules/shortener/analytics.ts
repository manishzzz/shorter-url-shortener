export type TimelinePoint = {
  date: string;
  clicks: number;
};

export type ReferrerStat = {
  referrer: string;
  clicks: number;
};

export const buildTimeline = (rows: Array<{ date: Date; clicks: bigint | number }>): TimelinePoint[] =>
  rows.map((row) => ({
    date: row.date.toISOString().slice(0, 10),
    clicks: Number(row.clicks),
  }));

export const normalizeReferrers = (
  rows: Array<{ referrer: string | null; clicks: bigint | number }>,
): ReferrerStat[] =>
  rows.map((row) => ({
    referrer: row.referrer ?? "direct",
    clicks: Number(row.clicks),
  }));
