import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: "./.env" });

const envSchema = z.object({
  PORT: z.coerce.number().default(8000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  MONGO_URI: z.string().min(1, "MONGO_URI is required"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  SERVER_URL: z.string().default("http://localhost:8000"),
  ACCESS_TOKEN_SECRET: z.string().min(1),
  REFRESH_TOKEN_SECRET: z.string().min(1),
  ACCESS_TOKEN_EXPIRY: z.string().default("1d"),
  REFRESH_TOKEN_EXPIRY: z.string().default("10d"),
  MAILTRAP_SMTP_HOST: z.string().optional(),
  MAILTRAP_SMTP_PORT: z.coerce.number().optional(),
  MAILTRAP_SMTP_USER: z.string().optional(),
  MAILTRAP_SMTP_PASS: z.string().optional(),
  FORGOT_PASSWORD_REDIRECT_URL: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
