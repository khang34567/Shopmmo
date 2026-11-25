const viVndFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0
});

export function assertIntegerVnd(amount: bigint | number, field = "amount"): bigint {
  if (typeof amount === "bigint") return amount;
  if (!Number.isSafeInteger(amount)) {
    throw new Error(`${field} phải là số nguyên VND hợp lệ.`);
  }
  return BigInt(amount);
}

export function addVnd(a: bigint, b: bigint): bigint {
  return a + b;
}

export function subVnd(a: bigint, b: bigint): bigint {
  return a - b;
}

export function mulVnd(unitPrice: bigint, quantity: number): bigint {
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new Error("Số lượng phải là số nguyên không âm.");
  }
  return unitPrice * BigInt(quantity);
}

export function calculateSalePrice(
  sourcePrice: bigint,
  markupType: "NONE" | "PERCENT" | "FIXED",
  markupValue: bigint,
  roundingStep: bigint = 1000n
): bigint {
  if (sourcePrice < 0n) throw new Error("Giá nguồn không được âm.");
  if (roundingStep !== 1n && roundingStep !== 1000n) {
    throw new Error("Bước làm tròn chỉ hỗ trợ 1đ hoặc 1.000đ.");
  }

  let raw = sourcePrice;
  if (markupType === "PERCENT") {
    raw = sourcePrice + (sourcePrice * markupValue) / 100n;
  } else if (markupType === "FIXED") {
    raw = sourcePrice + markupValue;
  }

  if (roundingStep === 1n) return raw;
  const rem = raw % roundingStep;
  return rem === 0n ? raw : raw + (roundingStep - rem);
}

export function formatVnd(amount: bigint | number): string {
  const num = typeof amount === "bigint" ? Number(amount) : amount;
  return viVndFormatter.format(num);
}

export function formatVnDateTime(date: Date): string {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    dateStyle: "short",
    timeStyle: "medium"
  }).format(date);
}
