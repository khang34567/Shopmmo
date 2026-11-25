import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { requirePermission } from "@/lib/rbac";
import { buildSafeCsv } from "@/lib/csv";
import { appendAuditLog } from "@/services/audit-service";
import { errorResponse } from "@/lib/errors";

export async function GET() {
  try {
    const session = await requireSession();
    requirePermission(session.user.role, "export:csv");

    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 1000,
      select: {
        orderCode: true,
        status: true,
        totalAmount: true,
        createdAt: true
      }
    });

    await appendAuditLog({
      actorId: session.userId,
      action: "EXPORT_ORDERS_CSV",
      target: "orders",
      metadata: { rowCount: orders.length }
    });

    const csv = buildSafeCsv(
      ["Mã đơn", "Trạng thái", "Tổng tiền (VND)", "Thời gian (UTC)"],
      orders.map((o) => [o.orderCode, o.status, o.totalAmount.toString(), o.createdAt.toISOString()])
    );

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="orders-export.csv"'
      }
    });
  } catch (err) {
    return errorResponse(err);
  }
}
