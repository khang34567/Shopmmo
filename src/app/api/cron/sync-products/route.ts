import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getProductProvider } from "@/integrations/provider";
import { AppError, errorResponse } from "@/lib/errors";

function verifyCronSecret(request: Request): void {
  const expected = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!expected || !auth?.startsWith("Bearer ")) {
    throw new AppError("UNAUTHORIZED", "Thiếu xác thực cron.", 401);
  }
  const provided = auth.slice(7);
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new AppError("UNAUTHORIZED", "Mã xác thực cron không hợp lệ.", 401);
  }
}

export async function GET(request: Request) {
  try {
    verifyCronSecret(request);

    const provider = getProductProvider();
    if (!provider.isConfigured()) {
      return NextResponse.json({ ok: false, status: "PROVIDER_NOT_CONFIGURED" });
    }
    // TODO(API_DOC): Khi đủ tài liệu schema API, chạy đồng bộ phân lô và ghi SyncRun.
    return NextResponse.json({ ok: false, status: "PROVIDER_DOC_INCOMPLETE" });
  } catch (err) {
    return errorResponse(err);
  }
}
