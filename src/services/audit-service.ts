import crypto from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function appendAuditLog(
  input: {
    actorId?: string | null;
    action: string;
    target: string;
    reason?: string;
    metadata?: Prisma.InputJsonValue;
  },
  tx?: Prisma.TransactionClient
) {
  const db = tx ?? prisma;
  const last = await db.auditLog.findFirst({
    orderBy: { createdAt: "desc" },
    select: { hash: true }
  });

  const prevHash = last?.hash ?? "GENESIS";
  const payload = JSON.stringify({
    prevHash,
    actorId: input.actorId ?? null,
    action: input.action,
    target: input.target,
    reason: input.reason ?? null,
    metadata: input.metadata ?? null
  });
  const hash = crypto.createHash("sha256").update(payload).digest("hex");

  return db.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      action: input.action,
      target: input.target,
      reason: input.reason,
      metadata: input.metadata,
      prevHash,
      hash
    }
  });
}
