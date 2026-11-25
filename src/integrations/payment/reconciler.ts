export interface BankTransactionMatch {
  referenceCode: string;
  amountVnd: bigint;
  bankTxId: string;
  occurredAt: Date;
}

/**
 * Interface mở rộng cho đối soát ngân hàng tự động/webhook trong tương lai.
 * Phiên bản hiện tại chỉ dùng xác nhận thủ công bởi Admin (không giả lập).
 */
export interface PaymentReconciler {
  readonly mode: "manual_only" | "automated";
  pollTransactions?(since: Date): Promise<BankTransactionMatch[]>;
}

export class ManualPaymentReconciler implements PaymentReconciler {
  public readonly mode = "manual_only" as const;
}
