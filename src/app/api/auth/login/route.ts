import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyCsrfOrigin } from "@/lib/csrf";
import { enforceRateLimit } from "@/lib/rate-limit";
import { verifyDummyPassword, verifyPassword } from "@/lib/password";
import { createSession } from "@/lib/session";
import { verifyTotpCode } from "@/lib/totp";
import { isStaffRole } from "@/lib/rbac";
import { AppError, errorResponse } from "@/lib/errors";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
  totpCode: z.string().optional()
});

export async function POST(request: Request) {
  try {
    verifyCsrfOrigin(request);
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const body = LoginSchema.parse(await request.json());
    const emailNormalized = body.email.trim().toLowerCase();

    await enforceRateLimit(`login:ip:${ip}`, 20, 300);
    await enforceRateLimit(`login:acct:${emailNormalized}`, 10, 300);

    const user = await prisma.user.findUnique({
      where: { emailNormalized },
      include: { adminTotp: true }
    });

    if (!user) {
      await verifyDummyPassword(body.password);
      throw new AppError("INVALID_CREDENTIALS", "Email hoặc mật khẩu không đúng.", 401);
    }

    if (user.status !== "ACTIVE") {
      await verifyDummyPassword(body.password);
      throw new AppError("INVALID_CREDENTIALS", "Email hoặc mật khẩu không đúng.", 401);
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new AppError("TEMP_LOCKED", "Tài khoản đang tạm khóa do nhập sai nhiều lần. Vui lòng thử lại sau.", 429);
    }

    const ok = await verifyPassword(user.passwordHash, body.password);
    if (!ok) {
      const nextCount = user.failedLoginCnt + 1;
      const lockMinutes = nextCount >= 5 ? Math.min(60, nextCount * 3) : 0;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCnt: nextCount,
          lockedUntil: lockMinutes > 0 ? new Date(Date.now() + lockMinutes * 60_000) : null
        }
      });
      throw new AppError("INVALID_CREDENTIALS", "Email hoặc mật khẩu không đúng.", 401);
    }

    // Bắt buộc kiểm tra TOTP nếu là tài khoản quản trị đã bật 2FA
    if (isStaffRole(user.role) && user.adminTotp?.enabledAt) {
      if (!body.totpCode || !verifyTotpCode(user.adminTotp.secretEnc, body.totpCode)) {
        throw new AppError("TOTP_REQUIRED", "Yêu cầu mã xác thực 2FA (TOTP) hợp lệ.", 401);
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCnt: 0, lockedUntil: null }
    });

    const ua = request.headers.get("user-agent") ?? undefined;
    await createSession(user.id, user.role, ip, ua);

    return NextResponse.json({
      user: { id: user.id, username: user.username, role: user.role }
    });
  } catch (err) {
    return errorResponse(err);
  }
}
