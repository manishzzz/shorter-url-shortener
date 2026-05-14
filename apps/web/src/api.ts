const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export type ShortenResponse = {
  code: string;
  shortUrl: string;
};

export type AnalyticsResponse = {
  code: string;
  originalUrl: string;
  clickCount: number;
  createdAt: string;
  lastAccessedAt: string | null;
  timeline: Array<{ date: string; clicks: number }>;
  topReferrers: Array<{ referrer: string; clicks: number }>;
};

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? "Request failed");
  }

  return response.json() as Promise<T>;
}

export const shortenUrl = async (input: { url: string; customAlias?: string }) =>
  handleResponse<ShortenResponse>(
    await fetch(`${API_BASE_URL}/shorten`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    }),
  );

export const fetchAnalytics = async (code: string) =>
  handleResponse<AnalyticsResponse>(await fetch(`${API_BASE_URL}/analytics/${code}`));

export const resolveShortLink = (code: string) => `${API_BASE_URL}/${code}`;
