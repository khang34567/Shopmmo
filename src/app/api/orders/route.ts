import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyCsrfOrigin } from "@/lib/csrf";
import { requireSession } from "@/lib/session";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createOrderFromWallet } from "@/services/order-service";
import { AppError, errorResponse } from "@/lib/errors";

const CreateOrderSchema = z.object({
  items: z.array(z.object({ productId: z.string().min(1), quantity: z.number().int().min(1).max(100) })).min(1)
});

export async function GET() {
  try {
    const session = await requireSession();
    const orders = await prisma.order.findMany({
      where: { userId: session.userId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 50
    });
    return NextResponse.json({
      orders: orders.map((o) => ({
        id: o.id,
        orderCode: o.orderCode,
        status: o.status,
        totalAmount: o.totalAmount.toString(),
        createdAt: o.createdAt.toISOString(),
        items: o.items.map((i) => ({
          productName: i.productName,
          unitPrice: i.unitPrice.toString(),
          quantity: i.quantity,
          subtotal: i.subtotal.toString()
        }))
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
    await enforceRateLimit(`order:create:${session.userId}`, 15, 300);

    const idempotencyKey = request.headers.get("idempotency-key");
    if (!idempotencyKey) {
      throw new AppError("IDEMPOTENCY_KEY_REQUIRED", "Thiếu header Idempotency-Key.", 400);
    }

    const body = CreateOrderSchema.parse(await request.json());
    const order = await createOrderFromWallet({
      userId: session.userId,
      items: body.items,
      idempotencyKey
    });

    return NextResponse.json(
      {
        id: order.id,
        orderCode: order.orderCode,
        status: order.status,
        totalAmount: order.totalAmount.toString()
      },
      { status: 201 }
    );
  } catch (err) {
    return errorResponse(err);
  }
}
