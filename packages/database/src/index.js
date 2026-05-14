import { PrismaClient } from "./generated/client/index.js";

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__shorterPrisma ??
  new PrismaClient({
    log: ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__shorterPrisma = prisma;
}

export * from "./generated/client/index.js";
