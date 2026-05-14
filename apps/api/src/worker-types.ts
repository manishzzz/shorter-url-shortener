export type QueuedClickEvent = {
  code: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  clickedAt: string;
};
