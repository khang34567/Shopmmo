import { describe, expect, it } from "vitest";
import { calculateSalePrice, formatVnd, mulVnd } from "@/lib/money";

describe("money module (VND integer)", () => {
  it("calculates percentage markup and rounds up to 1,000 VND", () => {
    expect(calculateSalePrice(10500n, "PERCENT", 10n, 1000n)).toBe(12000n);
  });

  it("calculates fixed markup with 1 VND step", () => {
    expect(calculateSalePrice(15250n, "FIXED", 500n, 1n)).toBe(15750n);
  });

  it("multiplies quantity safely and rejects negative quantity", () => {
    expect(mulVnd(25000n, 3)).toBe(75000n);
    expect(() => mulVnd(25000n, -1)).toThrow();
  });

  it("formats VND in vi-VN locale", () => {
    expect(formatVnd(1234567n)).toContain("1.234.567");
  });
});
