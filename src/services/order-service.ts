import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { mulVnd } from "@/lib/money";
import { getProductProvider } from "@/integrations/provider";
import { assertOrderTransition } from "@/services/state-machine";
import { appendAuditLog } from "@/services/audit-service";

const ORDER_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function generateOrderCode(): string {
  const bytes = crypto.randomBytes(8);
  let suffix = "";
  for (let i = 0; i < 8; i++) suffix += ORDER_ALPHABET[bytes[i]! % ORDER_ALPHABET.length];
  return `DH-${suffix}`;
}

export async function createOrderFromWallet(params: {
  userId: string;
  items: Array<{ productId: string; quantity: number }>;
  idempotencyKey: string;
}) {
  if (!params.idempotencyKey.trim()) {
    throw new AppError("IDEMPOTENCY_KEY_REQUIRED", "Thiếu mã chống trùng lặp (Idempotency-Key).", 400);
  }
  if (params.items.length === 0) {
    throw new AppError("EMPTY_CART", "Giỏ hàng đang trống.", 400);
  }

  // Kiểm tra đơn trùng theo idempotencyKey
  const existing = await prisma.order.findUnique({
    where: { idempotencyKey: params.idempotencyKey },
    include: { items: true }
  });
  if (existing) {
    if (existing.userId !== params.userId) {
      throw new AppError("FORBIDDEN", "Idempotency-Key không thuộc tài khoản này.", 403);
    }
    return existing;
  }

  // Bước 1 & 2: Trong transaction DB -> tính lại giá từ DB, hold tiền, tạo Order + ProviderRequest (outbox)
  const { order, providerRequest } = await prisma.$transaction(async (tx) => {
    const productIds = params.items.map((i) => i.productId);
    const products = await tx.product.findMany({
      where: { id: { in: productIds }, status: "AVAILABLE" }
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    let totalAmount = 0n;
    const snapshots = params.items.map((item) => {
      const p = productMap.get(item.productId);
      if (!p) {
        throw new AppError("PRODUCT_UNAVAILABLE", "Một hoặc nhiều sản phẩm hiện không khả dụng.", 400);
      }
      if (!Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity > 100) {
        throw new AppError("INVALID_QUANTITY", "Số lượng sản phẩm không hợp lệ.", 400);
      }
      const subtotal = mulVnd(p.salePrice, item.quantity);
      totalAmount += subtotal;
      return {
        productId: p.id,
        productName: p.name,
        unitPrice: p.salePrice,
        quantity: item.quantity,
        subtotal,
        externalId: p.externalId
      };
    });

    // Khóa hàng Wallet kiểm tra số dư khả dụng
    const walletRows = await tx.$queryRaw<Array<{ id: string; balance: bigint; held: bigint }>>`
      SELECT "id", "balance", "held" FROM "Wallet" WHERE "userId" = ${params.userId} FOR UPDATE
    `;
    const wallet = walletRows[0];
    if (!wallet || wallet.balance < totalAmount) {
      throw new AppError("INSUFFICIENT_BALANCE", "Số dư ví không đủ để thanh toán đơn hàng.", 400);
    }

    const newBalance = wallet.balance - totalAmount;
    const newHeld = wallet.held + totalAmount;

    const createdOrder = await tx.order.create({
      data: {
        orderCode: generateOrderCode(),
        userId: params.userId,
        status: "PROCESSING",
        totalAmount,
        idempotencyKey: params.idempotencyKey,
        items: {
          create: snapshots.map((s) => ({
            productId: s.productId,
            productName: s.productName,
            unitPrice: s.unitPrice,
            quantity: s.quantity,
            subtotal: s.subtotal
          }))
        },
        statusHistory: {
          create: {
            fromStatus: "AWAITING_PAYMENT",
            toStatus: "PROCESSING",
            actorId: params.userId,
            reason: "Tạo đơn và tạm giữ số dư ví"
          }
        }
      },
      include: { items: true }
    });

    await tx.ledgerEntry.create({
      data: {
        walletId: wallet.id,
        type: "HOLD",
        amount: -totalAmount,
        balanceAfter: newBalance,
        refType: "ORDER",
        refId: createdOrder.id,
        idempotencyKey: `order:${createdOrder.id}:hold`,
        reason: `Tạm giữ tiền cho đơn ${createdOrder.orderCode}`,
        actorId: params.userId
      }
    });

    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: newBalance, held: newHeld }
    });

    const outbox = await tx.providerRequest.create({
      data: {
        orderId: createdOrder.id,
        provider: getProductProvider().name,
        idempotencyKey: `prov:${createdOrder.id}`,
        status: "PENDING"
      }
    });

    return { order: createdOrder, providerRequest: outbox };
  });

  // Bước 3: Gọi nhà cung cấp bên ngoài transaction DB
  const provider = getProductProvider();
  const firstItem = order.items[0]!;
  const result = await provider.createOrder({
    productExternalId: firstItem.productId,
    quantity: firstItem.quantity,
    idempotencyKey: providerRequest.idempotencyKey
  });

  // Bước 4: Cập nhật kết quả (Capture / Release / Needs Review)
  return prisma.$transaction(async (tx) => {
    const walletRows = await tx.$queryRaw<Array<{ id: string; balance: bigint; held: bigint }>>`
      SELECT "id", "balance", "held" FROM "Wallet" WHERE "userId" = ${order.userId} FOR UPDATE
    `;
    const wallet = walletRows[0]!;

    if (result.status === "SUCCEEDED") {
      assertOrderTransition("PROCESSING", "COMPLETED");
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { held: wallet.held - order.totalAmount }
      });
      await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          type: "CAPTURE",
          amount: 0n,
          balanceAfter: wallet.balance,
          refType: "ORDER",
          refId: order.id,
          idempotencyKey: `order:${order.id}:capture`,
          reason: `Chốt thanh toán đơn ${order.orderCode}`
        }
      });
      await tx.providerRequest.update({
        where: { id: providerRequest.id },
        data: { status: "SUCCEEDED", externalOrderId: result.externalOrderId, attempts: 1 }
      });
      return tx.order.update({
        where: { id: order.id },
        data: {
          status: "COMPLETED",
          deliveredData: result.deliveredPayload,
          statusHistory: {
            create: { fromStatus: "PROCESSING", toStatus: "COMPLETED", reason: "Nhà cung cấp xác nhận thành công" }
          }
        },
        include: { items: true }
      });
    }

    if (result.status === "FAILED") {
      assertOrderTransition("PROCESSING", "FAILED");
      const refundedBalance = wallet.balance + order.totalAmount;
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: refundedBalance, held: wallet.held - order.totalAmount }
      });
      await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          type: "RELEASE",
          amount: order.totalAmount,
          balanceAfter: refundedBalance,
          refType: "ORDER",
          refId: order.id,
          idempotencyKey: `order:${order.id}:release`,
          reason: `Hoàn tiền tạm giữ do đơn ${order.orderCode} thất bại`
        }
      });
      await tx.providerRequest.update({
        where: { id: providerRequest.id },
        data: { status: "FAILED", lastErrorSafe: result.safeError, attempts: 1 }
      });
      return tx.order.update({
        where: { id: order.id },
        data: {
          status: "FAILED",
          statusHistory: {
            create: { fromStatus: "PROCESSING", toStatus: "FAILED", reason: result.safeError ?? "Thất bại từ nhà cung cấp" }
          }
        },
        include: { items: true }
      });
    }

    // AMBIGUOUS (timeout / chưa rõ) -> giữ nguyên HOLD, chuyển NEEDS_REVIEW
    assertOrderTransition("PROCESSING", "NEEDS_REVIEW");
    await tx.providerRequest.update({
      where: { id: providerRequest.id },
      data: { status: "AMBIGUOUS", lastErrorSafe: result.safeError, attempts: 1 }
    });
    await appendAuditLog(
      {
        action: "ORDER_NEEDS_REVIEW",
        target: `order:${order.id}`,
        reason: result.safeError ?? "Kết quả từ nhà cung cấp không rõ ràng"
      },
      tx
    );
    return tx.order.update({
      where: { id: order.id },
      data: {
        status: "NEEDS_REVIEW",
        statusHistory: {
          create: {
            fromStatus: "PROCESSING",
            toStatus: "NEEDS_REVIEW",
            reason: result.safeError ?? "Cần đối soát trạng thái nhà cung cấp"
          }
        }
      },
      include: { items: true }
    });
  });
}
