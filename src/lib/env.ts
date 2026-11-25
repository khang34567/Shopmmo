import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1, "Thiếu DATABASE_URL"),
  DIRECT_URL: z.string().min(1, "Thiếu DIRECT_URL").optional(),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET phải có ít nhất 32 ký tự"),
  CRON_SECRET: z.string().min(32, "CRON_SECRET phải có ít nhất 32 ký tự"),
  BUYER_API_BASE_URL: z.string().url().optional(),
  BUYER_API_KEY: z.string().optional(),
  WEBHOOK_SECRET: z.string().optional(),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  REDIS_URL: z.string().optional(),
  REDIS_TOKEN: z.string().optional(),
  EMAIL_PROVIDER: z.enum(["none", "resend"]).default("none"),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  PENDING_DEPOSIT_TTL_HOURS: z.coerce.number().int().min(1).max(168).default(24),
  MIN_DEPOSIT_VND: z.coerce.number().int().min(1000).default(10000),
  MAX_DEPOSIT_VND: z.coerce.number().int().min(10000).default(50000000),
  MAX_PENDING_DEPOSITS_PER_USER: z.coerce.number().int().min(1).max(20).default(3),
  PRICE_MARKUP_TYPE: z.enum(["NONE", "PERCENT", "FIXED"]).default("NONE"),
  PRICE_MARKUP_VALUE: z.coerce.number().int().min(0).default(0),
  PRICE_ROUNDING_STEP: z.coerce.number().int().refine((v) => v === 1 || v === 1000, {
    message: "PRICE_ROUNDING_STEP chỉ nhận 1 hoặc 1000"
  }).default(1000)
});

export type AppEnv = z.infer<typeof EnvSchema>;

let cachedEnv: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cachedEnv) return cachedEnv;
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Cấu hình biến môi trường không hợp lệ: ${details}`);
  }
  cachedEnv = parsed.data;
  return cachedEnv;
}

export function isProviderConfigured(): boolean {
  const baseUrl = process.env.BUYER_API_BASE_URL?.trim();
  const apiKey = process.env.BUYER_API_KEY?.trim();
  return Boolean(baseUrl && apiKey && !apiKey.startsWith("changeme-"));
}

export function isEmailConfigured(): boolean {
  return process.env.EMAIL_PROVIDER === "resend" && Boolean(process.env.RESEND_API_KEY?.trim());
}

export function assertNotProductionForSeedOrMock(): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error("CẤM chạy seed/mock ở môi trường production (NODE_ENV=production).");
  }
}
