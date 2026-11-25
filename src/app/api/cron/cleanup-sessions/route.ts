import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
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

    const now = new Date();
    const deleted = await prisma.session.deleteMany({
      where: { OR: [{ expiresAt: { lt: now } }, { revokedAt: { not: null } }] }
    });
    return NextResponse.json({ ok: true, deletedSessions: deleted.count });
  } catch (err) {
    return errorResponse(err);
  }
}
