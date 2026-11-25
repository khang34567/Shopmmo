import { describe, expect, it } from "vitest";
import { verifyCsrfOrigin } from "@/lib/csrf";
import { sanitizeReturnUrl } from "@/lib/redirect";
import { sanitizeCsvCell } from "@/lib/csv";
import { detectFileMagicMime } from "@/lib/upload";
import { generateTotpCode, generateTotpSecret, verifyTotpCode } from "@/lib/totp";
import { redactSensitiveText } from "@/lib/logger";

describe("security controls", () => {
  it("blocks cross-origin POST (CSRF)", () => {
    const req = new Request("https://shop.vn/api/orders", {
      method: "POST",
      headers: { origin: "https://evil.example", host: "shop.vn" }
    });
    expect(() => verifyCsrfOrigin(req)).toThrow();
  });

  it("prevents open redirects", () => {
    expect(sanitizeReturnUrl("https://evil.com")).toBe("/account");
    expect(sanitizeReturnUrl("//evil.com")).toBe("/account");
    expect(sanitizeReturnUrl("/account/orders?page=2")).toBe("/account/orders?page=2");
  });

  it("neutralizes CSV injection", () => {
    expect(sanitizeCsvCell("=CMD|' /C calc'!A0")).toBe(`"'=CMD|' /C calc'!A0"`);
  });

  it("detects valid PDF/PNG magic bytes and rejects fake text", () => {
    expect(detectFileMagicMime(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0, 0, 0, 0, 0, 0, 0]))).toBe("application/pdf");
    expect(detectFileMagicMime(new Uint8Array([0x3c, 0x73, 0x63, 0x72, 0x69, 0x70, 0x74, 0, 0, 0, 0, 0]))).toBeNull();
  });

  it("verifies RFC 6238 TOTP codes", () => {
    const secret = generateTotpSecret();
    const now = Date.now();
    const code = generateTotpCode(secret, now);
    expect(verifyTotpCode(secret, code, 1, now)).toBe(true);
    expect(verifyTotpCode(secret, "000000", 1, now)).toBe(false);
  });

  it("redacts API keys from log strings", () => {
    const out = redactSensitiveText(`Error calling with ${"tgb_" + "a".repeat(24)}`);
    expect(out).toContain("[REDACTED_API_KEY]");
  });
});
