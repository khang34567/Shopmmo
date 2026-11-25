import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyCsrfOrigin } from "@/lib/csrf";
import { enforceRateLimit } from "@/lib/rate-limit";
import { hashPassword, validatePasswordPolicy } from "@/lib/password";
import { generateSecureToken, hashToken } from "@/lib/session";
import { AppError, errorResponse } from "@/lib/errors";
import { isEmailConfigured } from "@/lib/env";
import { sendTransactionalEmail } from "@/integrations/email";

const RegisterSchema = z.object({
  email: z.string().email("Email không hợp lệ").max(160),
  username: z
    .string()
    .min(3, "Tên tài khoản tối thiểu 3 ký tự")
    .max(32, "Tên tài khoản tối đa 32 ký tự")
    .regex(/^[a-zA-Z0-9_]+$/, "Tên tài khoản chỉ gồm chữ, số và dấu gạch dưới"),
  password: z.string().min(10, "Mật khẩu tối thiểu 10 ký tự").max(128)
});

export async function POST(request: Request) {
  try {
    verifyCsrfOrigin(request);
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    await enforceRateLimit(`register:ip:${ip}`, 10, 600);

    const body = RegisterSchema.parse(await request.json());
    validatePasswordPolicy(body.password);

    const emailNormalized = body.email.trim().toLowerCase();
    const usernameNorm = body.username.trim().toLowerCase();

    // Tên tài khoản công khai: được phép báo trùng theo mục 3.2
    const existingUsername = await prisma.user.findUnique({ where: { usernameNorm } });
    if (existingUsername) {
      throw new AppError("USERNAME_TAKEN", "Tên tài khoản đã được sử dụng.", 409);
    }

    const existingEmail = await prisma.user.findUnique({ where: { emailNormalized } });
    const emailReady = isEmailConfigured();

    if (existingEmail) {
      // Chống dò email: không báo lỗi trùng email, gửi thông báo nếu đã cấu hình email
      if (emailReady) {
        await sendTransactionalEmail({
          to: existingEmail.email,
          subject: "Thông báo đăng ký tài khoản",
          text: "Có yêu cầu đăng ký mới bằng địa chỉ email này. Nếu không phải bạn, hãy bỏ qua."
        });
      }
      return NextResponse.json({
        message: emailReady
          ? "Nếu email hợp lệ, chúng tôi đã gửi hướng dẫn xác minh."
          : "Tài khoản đã được tiếp nhận. Lưu ý: Dịch vụ email chưa cấu hình nên chưa gửi được thư xác minh.",
        emailSent: emailReady
      });
    }

    const passwordHash = await hashPassword(body.password);
    const user = await prisma.user.create({
      data: {
        email: body.email.trim(),
        emailNormalized,
        username: body.username.trim(),
        usernameNorm,
        passwordHash,
        role: "BUYER",
        wallet: { create: { balance: 0n, held: 0n } }
      }
    });

    const rawToken = generateSecureToken(32);
    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });

    let sent = false;
    if (emailReady) {
      const appUrl = process.env.APP_URL ?? "http://localhost:3000";
      const res = await sendTransactionalEmail({
        to: user.email,
        subject: "Xác minh địa chỉ email",
        text: `Nhấp vào liên kết sau để xác minh tài khoản: ${appUrl}/verify-email?token=${rawToken}`
      });
      sent = res.sent;
    }

    return NextResponse.json(
      {
        message: sent
          ? "Nếu email hợp lệ, chúng tôi đã gửi hướng dẫn xác minh."
          : "Đăng ký hoàn tất. Dịch vụ email chưa được cấu hình nên chưa gửi thư xác minh.",
        emailSent: sent
      },
      { status: 201 }
    );
  } catch (err) {
    return errorResponse(err);
  }
}
