import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyCsrfOrigin } from "@/lib/csrf";
import { requireRecentStepUp, requireSession } from "@/lib/session";
import { requirePermission } from "@/lib/rbac";
import { confirmDepositByAdmin } from "@/services/deposit-service";
import { errorResponse } from "@/lib/errors";

const ConfirmDepositSchema = z.object({
  actualReceivedVnd: z.number().int().positive(),
  reason: z.string().min(3, "Lý do tối thiểu 3 ký tự").max(500),
  allowLate: z.boolean().optional()
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    verifyCsrfOrigin(request);
    const session = await requireSession();
    requirePermission(session.user.role, "deposits:review");
    await requireRecentStepUp(session.id);

    const { id } = await context.params;
    const body = ConfirmDepositSchema.parse(await request.json());

    const result = await confirmDepositByAdmin({
      depositId: id,
      adminUserId: session.userId,
      actualReceivedVnd: BigInt(body.actualReceivedVnd),
      reason: body.reason,
      allowLate: body.allowLate
    });

    return NextResponse.json({
      idempotentReplay: result.idempotentReplay,
      status: result.status
    });
  } catch (err) {
    return errorResponse(err);
  }
}
