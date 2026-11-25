import crypto from "node:crypto";
import { cookies } from "next/headers";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { isStaffRole } from "@/lib/rbac";

const isProd = process.env.NODE_ENV === "production";
export const SESSION_COOKIE_NAME = isProd ? "__Host-vnshop_session" : "vnshop_session";

const BUYER_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const STAFF_TTL_MS = 8 * 60 * 60 * 1000;
const STEP_UP_WINDOW_MS = 10 * 60 * 1000;

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

export async function createSession(userId: string, role: Role, ipAddress?: string, userAgent?: string) {
  const rawToken = generateSecureToken(32);
  const tokenHash = hashToken(rawToken);
  const ttlMs = isStaffRole(role) ? STAFF_TTL_MS : BUYER_TTL_MS;
  const expiresAt = new Date(Date.now() + ttlMs);

  const session = await prisma.session.create({
    data: { userId, tokenHash, ipAddress, userAgent, expiresAt }
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isStaffRole(role) ? "strict" : "lax",
    path: "/",
    expires: expiresAt
  });

  return session;
}

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!rawToken) return null;

  const tokenHash = hashToken(rawToken);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true }
  });

  if (!session || session.revokedAt || session.expiresAt <= new Date()) {
    return null;
  }
  if (session.user.status !== "ACTIVE") {
    return null;
  }

  return session;
}

export async function requireSession() {
  const session = await getCurrentSession();
  if (!session) {
    throw new AppError("UNAUTHORIZED", "Vui lòng đăng nhập để tiếp tục.", 401);
  }
  return session;
}

export async function requireRecentStepUp(sessionId: string) {
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session?.stepUpAt || Date.now() - session.stepUpAt.getTime() > STEP_UP_WINDOW_MS) {
    throw new AppError("STEP_UP_REQUIRED", "Thao tác nhạy cảm yêu cầu xác thực lại mật khẩu gần đây.", 403);
  }
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
