import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCsrfOrigin } from "@/lib/csrf";
import { clearSessionCookie, getCurrentSession } from "@/lib/session";
import { errorResponse } from "@/lib/errors";

export async function POST(request: Request) {
  try {
    verifyCsrfOrigin(request);
    const session = await getCurrentSession();
    if (session) {
      await prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() }
      });
    }
    await clearSessionCookie();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
