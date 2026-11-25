import { describe, expect, it } from "vitest";
import { hasPermission } from "@/lib/rbac";

describe("RBAC matrix (deny by default)", () => {
  it("denies BUYER all admin permissions", () => {
    expect(hasPermission("BUYER", "deposits:review")).toBe(false);
    expect(hasPermission("BUYER", "settings:bank_write")).toBe(false);
    expect(hasPermission("BUYER", "orders:read_all")).toBe(false);
  });

  it("restricts bank settings and balance adjustments to OWNER", () => {
    expect(hasPermission("OWNER", "settings:bank_write")).toBe(true);
    expect(hasPermission("ADMIN", "settings:bank_write")).toBe(false);
    expect(hasPermission("OWNER", "wallet:adjust")).toBe(true);
    expect(hasPermission("ADMIN", "wallet:adjust")).toBe(false);
  });

  it("allows SUPPORT to reply tickets but not confirm deposits", () => {
    expect(hasPermission("SUPPORT", "tickets:reply_staff")).toBe(true);
    expect(hasPermission("SUPPORT", "deposits:review")).toBe(false);
  });
});
