import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyCsrfOrigin } from "@/lib/csrf";
import { requireSession } from "@/lib/session";
import { verifyPassword } from "@/lib/password";
import { AppError, errorResponse } from "@/lib/errors";

const StepUpSchema = z.object({
  password: z.string().min(1).max(128)
});

export async function POST(request: Request) {
  try {
    verifyCsrfOrigin(request);
    const session = await requireSession();
    const { password } = StepUpSchema.parse(await request.json());

    const ok = await verifyPassword(session.user.passwordHash, password);
    if (!ok) {
      throw new AppError("STEP_UP_FAILED", "Mật khẩu xác thực lại không đúng.", 401);
    }

    await prisma.session.update({
      where: { id: session.id },
      data: { stepUpAt: new Date() }
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
