const LOCALHOST_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;
const CLOUDFLARE_TUNNEL_ORIGIN = /^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/i;

const normalizeOrigin = (origin: string) => origin.trim().replace(/\/$/, "");

export const parseAllowedOrigins = (origins: string) =>
  origins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map(normalizeOrigin);

export const isAllowedOrigin = (
  origin: string | undefined,
  configuredOrigins: readonly string[],
) => {
  if (!origin) {
    return true;
  }

  const normalizedOrigin = normalizeOrigin(origin);

  if (configuredOrigins.includes(normalizedOrigin)) {
    return true;
  }

  return (
    LOCALHOST_ORIGIN.test(normalizedOrigin) ||
    CLOUDFLARE_TUNNEL_ORIGIN.test(normalizedOrigin)
  );
};
