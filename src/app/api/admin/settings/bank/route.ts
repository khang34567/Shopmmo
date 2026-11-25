import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyCsrfOrigin } from "@/lib/csrf";
import { requireRecentStepUp, requireSession } from "@/lib/session";
import { requirePermission } from "@/lib/rbac";
import { maskBankAccount } from "@/lib/logger";
import { appendAuditLog } from "@/services/audit-service";
import { errorResponse } from "@/lib/errors";

const BankSettingsSchema = z.object({
  bankName: z.string().min(2).max(120),
  bankAccountNo: z.string().min(4).max(40),
  bankAccountOwner: z.string().min(2).max(120),
  bankBranch: z.string().max(120).optional().default(""),
  reason: z.string().min(5).max(500)
});

export async function PUT(request: Request) {
  try {
    verifyCsrfOrigin(request);
    const session = await requireSession();
    requirePermission(session.user.role, "settings:bank_write");
    await requireRecentStepUp(session.id);

    const body = BankSettingsSchema.parse(await request.json());
    const prev = await prisma.storeSettings.findUnique({ where: { id: "singleton" } });

    const updated = await prisma.storeSettings.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        bankName: body.bankName,
        bankAccountNo: body.bankAccountNo,
        bankAccountOwner: body.bankAccountOwner,
        bankBranch: body.bankBranch
      },
      update: {
        bankName: body.bankName,
        bankAccountNo: body.bankAccountNo,
        bankAccountOwner: body.bankAccountOwner,
        bankBranch: body.bankBranch
      }
    });

    await appendAuditLog({
      actorId: session.userId,
      action: "BANK_SETTINGS_UPDATED",
      target: "settings:bank",
      reason: body.reason,
      metadata: {
        oldAccountMasked: prev?.bankAccountNo ? maskBankAccount(prev.bankAccountNo) : null,
        newAccountMasked: maskBankAccount(updated.bankAccountNo),
        bankName: updated.bankName
      }
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
