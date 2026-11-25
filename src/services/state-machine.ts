import type { DepositStatus, OrderStatus } from "@prisma/client";
import { AppError } from "@/lib/errors";

const DEPOSIT_TRANSITIONS: Record<DepositStatus, readonly DepositStatus[]> = {
  PENDING: ["CONFIRMED", "REJECTED", "EXPIRED"],
  EXPIRED: ["CONFIRMED_LATE"],
  CONFIRMED: [],
  CONFIRMED_LATE: [],
  REJECTED: []
};

const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  AWAITING_PAYMENT: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["COMPLETED", "FAILED", "NEEDS_REVIEW"],
  NEEDS_REVIEW: ["COMPLETED", "REFUNDED", "FAILED"],
  COMPLETED: ["REFUNDED"],
  FAILED: [],
  CANCELLED: [],
  REFUNDED: []
};

export function canTransitionDeposit(from: DepositStatus, to: DepositStatus): boolean {
  return DEPOSIT_TRANSITIONS[from].includes(to);
}

export function assertDepositTransition(from: DepositStatus, to: DepositStatus): void {
  if (!canTransitionDeposit(from, to)) {
    throw new AppError(
      "INVALID_DEPOSIT_TRANSITION",
      `Không thể chuyển trạng thái nạp tiền từ ${from} sang ${to}.`,
      409
    );
  }
}

export function canTransitionOrder(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}

export function assertOrderTransition(from: OrderStatus, to: OrderStatus): void {
  if (!canTransitionOrder(from, to)) {
    throw new AppError(
      "INVALID_ORDER_TRANSITION",
      `Không thể chuyển trạng thái đơn hàng từ ${from} sang ${to}.`,
      409
    );
  }
}
