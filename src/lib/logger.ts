import pino from "pino";

const REDACT_KEYS = [
  "password",
  "passwordHash",
  "token",
  "sessionToken",
  "cookie",
  "authorization",
  "apiKey",
  "BUYER_API_KEY",
  "AUTH_SECRET",
  "CRON_SECRET",
  "bankAccountNo",
  "*.password",
  "*.token",
  "*.cookie",
  "*.authorization",
  "*.apiKey",
  "req.headers.cookie",
  "req.headers.authorization"
];

export const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  redact: {
    paths: REDACT_KEYS,
    censor: "[REDACTED]"
  },
  base: { service: "vn-ecommerce" }
});

export function maskBankAccount(accountNo: string): string {
  const clean = accountNo.trim();
  if (clean.length <= 4) return "****";
  return `${"*".repeat(clean.length - 4)}${clean.slice(-4)}`;
}

export function redactSensitiveText(input: string): string {
  return input
    .replace(/tgb_[a-f0-9]{16,}/gi, "[REDACTED_API_KEY]")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [REDACTED]");
}
