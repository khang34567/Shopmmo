import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyCsrfOrigin } from "@/lib/csrf";
import { requireSession } from "@/lib/session";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createDepositRequest } from "@/services/deposit-service";
import { errorResponse } from "@/lib/errors";

const CreateDepositSchema = z.object({
  amountVnd: z.number().int().positive()
});

export async function GET() {
  try {
    const session = await requireSession();
    const list = await prisma.depositRequest.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 50
    });
    return NextResponse.json({
      deposits: list.map((d) => ({
        id: d.id,
        referenceCode: d.referenceCode,
        requestedAmount: d.requestedAmount.toString(),
        actualAmount: d.actualAmount?.toString() ?? null,
        status: d.status,
        expiresAt: d.expiresAt.toISOString(),
        createdAt: d.createdAt.toISOString()
      }))
    });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    verifyCsrfOrigin(request);
    const session = await requireSession();
    await enforceRateLimit(`deposit:create:${session.userId}`, 10, 600);

    const body = CreateDepositSchema.parse(await request.json());
    const deposit = await createDepositRequest({
      userId: session.userId,
      requestedAmountVnd: BigInt(body.amountVnd)
    });

    return NextResponse.json(
      {
        id: deposit.id,
        referenceCode: deposit.referenceCode,
        requestedAmount: deposit.requestedAmount.toString(),
        status: deposit.status,
        expiresAt: deposit.expiresAt.toISOString()
      },
      { status: 201 }
    );
  } catch (err) {
    return errorResponse(err);
  }
}
