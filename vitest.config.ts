import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["src/__tests__/setup.ts"],
    env: {
      NODE_ENV: "test",
      PORT: "8000",
      MONGO_URI: "mongodb://localhost:27017/project-camp-test",
      ACCESS_TOKEN_SECRET: "test-access-secret-32-chars-minimum-abc",
      REFRESH_TOKEN_SECRET: "test-refresh-secret-32-chars-minimum-abc",
      ACCESS_TOKEN_EXPIRY: "1d",
      REFRESH_TOKEN_EXPIRY: "10d",
      SERVER_URL: "http://localhost:8000",
      CORS_ORIGIN: "http://localhost:5173",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/__tests__/**",
        "src/types/**",
        "src/index.ts",
        "src/config/env.ts",
      ],
    },
  },
});
