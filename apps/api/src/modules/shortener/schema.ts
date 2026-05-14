import { z } from "zod";

export const shortenUrlSchema = z.object({
  url: z.url(),
  customAlias: z
    .string()
    .trim()
    .min(4)
    .max(32)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
});

export type ShortenUrlInput = z.infer<typeof shortenUrlSchema>;
