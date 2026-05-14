import { prisma } from "../../../packages/database/src/index.js";
import { buildApp } from "./app.js";
import { getConfig } from "./config.js";
import { closeRedis } from "./lib/redis.js";

const start = async () => {
  const config = getConfig();
  const app = buildApp();

  const shutdown = async () => {
    await app.close();
    await closeRedis();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  await app.listen({
    port: config.API_PORT,
    host: "0.0.0.0",
  });
};

start().catch(async (error) => {
  console.error(error);
  await closeRedis();
  await prisma.$disconnect();
  process.exit(1);
});
