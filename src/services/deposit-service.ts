import crypto from "node:crypto";
import type { DepositStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { assertIntegerVnd } from "@/lib/money";
import { assertDepositTransition } from "@/services/state-machine";
import { appendAuditLog } from "@/services/audit-service";

// Bảng ký tự không gây nhầm lẫn 0/O/1/I
const SAFE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function generateDepositReferenceCode(prefix = "NAP"): string {
  const bytes = crypto.randomBytes(10);
  let code = "";
  for (let i = 0; i < 10; i++) {
    code += SAFE_ALPHABET[bytes[i]! % SAFE_ALPHABET.length];
  }
  return `${prefix}-${code}`;
}

export async function createDepositRequest(params: {
  userId: string;
  requestedAmountVnd: bigint;
}) {
  const amount = assertIntegerVnd(params.requestedAmountVnd, "requestedAmountVnd");
  const minVnd = BigInt(process.env.MIN_DEPOSIT_VND ?? "10000");
  const maxVnd = BigInt(process.env.MAX_DEPOSIT_VND ?? "50000000");
  const maxPending = Number(process.env.MAX_PENDING_DEPOSITS_PER_USER ?? "3");
  const ttlHours = Number(process.env.PENDING_DEPOSIT_TTL_HOURS ?? "24");

  if (amount < minVnd || amount > maxVnd) {
    throw new AppError(
      "INVALID_AMOUNT",
      `Số tiền nạp phải nằm trong khoảng ${minVnd.toString()}đ đến ${maxVnd.toString()}đ.`,
      400
    );
  }

  const pendingCount = await prisma.depositRequest.count({
    where: { userId: params.userId, status: "PENDING" }
  });
  if (pendingCount >= maxPending) {
    throw new AppError(
      "TOO_MANY_PENDING_DEPOSITS",
      `Bạn chỉ được có tối đa ${maxPending} yêu cầu nạp tiền đang chờ xử lý.`,
      429
    );
  }

  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
  return prisma.depositRequest.create({
    data: {
      userId: params.userId,
      referenceCode: generateDepositReferenceCode(),
      requestedAmount: amount,
      expiresAt
    }
  });
}

export async function confirmDepositByAdmin(params: {
  depositId: string;
  adminUserId: string;
  actualReceivedVnd: bigint;
  reason: string;
  allowLate?: boolean;
}) {
  const actualAmount = assertIntegerVnd(params.actualReceivedVnd, "actualReceivedVnd");
  if (actualAmount <= 0n) {
    throw new AppError("INVALID_AMOUNT", "Số tiền thực nhận phải lớn hơn 0đ.", 400);
  }
  if (!params.reason.trim()) {
    throw new AppError("REASON_REQUIRED", "Bắt buộc nhập lý do xác nhận giao dịch.", 400);
  }

  return prisma.$transaction(async (tx) => {
    // Khóa hàng DepositRequest chống race condition khi gọi đồng thời
    const lockedRows = await tx.$queryRaw<Array<{ id: string; userId: string; status: DepositStatus }>>`
      SELECT "id", "userId", "status" FROM "DepositRequest" WHERE "id" = ${params.depositId} FOR UPDATE
    `;
    const dep = lockedRows[0];
    if (!dep) {
      throw new AppError("NOT_FOUND", "Không tìm thấy yêu cầu nạp tiền.", 404);
    }

    // Idempotent: nếu đã xác nhận trước đó, trả về không cộng tiền lần 2
    if (dep.status === "CONFIRMED" || dep.status === "CONFIRMED_LATE") {
      return { idempotentReplay: true, status: dep.status };
    }

    const targetStatus: DepositStatus =
      dep.status === "EXPIRED" && params.allowLate ? "CONFIRMED_LATE" : "CONFIRMED";
    assertDepositTransition(dep.status, targetStatus);

    // Khóa hàng Wallet
    const walletRows = await tx.$queryRaw<Array<{ id: string; balance: bigint }>>`
      SELECT "id", "balance" FROM "Wallet" WHERE "userId" = ${dep.userId} FOR UPDATE
    `;
    let wallet = walletRows[0];
    if (!wallet) {
      const created = await tx.wallet.create({ data: { userId: dep.userId, balance: 0n, held: 0n } });
      wallet = { id: created.id, balance: created.balance };
    }

    const newBalance = wallet.balance + actualAmount;
    const idempotencyKey = `deposit:${dep.id}:confirm`;

    await tx.ledgerEntry.create({
      data: {
        walletId: wallet.id,
        type: "DEPOSIT",
        amount: actualAmount,
        balanceAfter: newBalance,
        refType: "DEPOSIT_REQUEST",
        refId: dep.id,
        idempotencyKey,
        reason: params.reason.trim(),
        actorId: params.adminUserId
      }
    });

    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: newBalance }
    });

    await tx.depositRequest.update({
      where: { id: dep.id },
      data: {
        status: targetStatus,
        actualAmount,
        reviewedById: params.adminUserId,
        reviewedAt: new Date(),
        reviewNote: params.reason.trim()
      }
    });

    await tx.paymentStatusHistory.create({
      data: {
        depositId: dep.id,
        fromStatus: dep.status,
        toStatus: targetStatus,
        actorId: params.adminUserId,
        reason: params.reason.trim()
      }
    });

    await appendAuditLog(
      {
        actorId: params.adminUserId,
        action: targetStatus === "CONFIRMED_LATE" ? "DEPOSIT_CONFIRM_LATE" : "DEPOSIT_CONFIRM",
        target: `deposit:${dep.id}`,
        reason: params.reason.trim(),
        metadata: { actualAmountVnd: actualAmount.toString() }
      },
      tx
    );

    return { idempotentReplay: false, status: targetStatus, newBalance };
  });
}
