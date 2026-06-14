import app from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";

const start = async (): Promise<void> => {
  await connectDB();

  app.listen(env.PORT, () => {
    logger.info(`Project Camp API listening on http://localhost:${env.PORT}`);
  });
};

start().catch((error) => {
  logger.error({ err: error }, "Failed to start server");
  process.exit(1);
});
