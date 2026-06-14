import app from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";

const start = async (): Promise<void> => {
  await connectDB();

  app.listen(env.PORT, () => {
    console.log(`Project Camp API listening on http://localhost:${env.PORT}`);
  });
};

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
