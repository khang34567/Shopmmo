import { AppError } from "@/lib/errors";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function verifyCsrfOrigin(request: Request): void {
  if (SAFE_METHODS.has(request.method.toUpperCase())) return;

  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");

  if (!origin || !host) {
    throw new AppError("CSRF_FAILED", "Yêu cầu không hợp lệ (thiếu thông tin nguồn).", 403);
  }

  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new AppError("CSRF_FAILED", "Header Origin không hợp lệ.", 403);
  }

  if (originHost !== host) {
    throw new AppError("CSRF_FAILED", "Từ chối yêu cầu khác nguồn (CSRF).", 403);
  }
}
