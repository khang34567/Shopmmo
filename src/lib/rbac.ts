import type { Role } from "@prisma/client";
import { AppError } from "@/lib/errors";

export type Permission =
  | "orders:read_all"
  | "orders:resolve_review"
  | "users:read_all"
  | "users:lock"
  | "tickets:reply_staff"
  | "deposits:review"
  | "wallet:adjust"
  | "settings:bank_write"
  | "admins:manage"
  | "audit:read_full"
  | "audit:read_partial"
  | "export:csv";

const ROLE_PERMISSIONS: Record<Role, ReadonlySet<Permission>> = {
  OWNER: new Set<Permission>([
    "orders:read_all",
    "orders:resolve_review",
    "users:read_all",
    "users:lock",
    "tickets:reply_staff",
    "deposits:review",
    "wallet:adjust",
    "settings:bank_write",
    "admins:manage",
    "audit:read_full",
    "audit:read_partial",
    "export:csv"
  ]),
  ADMIN: new Set<Permission>([
    "orders:read_all",
    "orders:resolve_review",
    "users:read_all",
    "users:lock",
    "tickets:reply_staff",
    "deposits:review",
    "audit:read_partial",
    "export:csv"
  ]),
  SUPPORT: new Set<Permission>([
    "orders:read_all",
    "users:read_all",
    "tickets:reply_staff"
  ]),
  BUYER: new Set<Permission>([])
};

export function hasPermission(role: Role | null | undefined, perm: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.has(perm) ?? false;
}

export function requirePermission(role: Role | null | undefined, perm: Permission): void {
  if (!hasPermission(role, perm)) {
    throw new AppError("FORBIDDEN", "Bạn không có quyền thực hiện thao tác này.", 403);
  }
}

export function isStaffRole(role: Role | null | undefined): boolean {
  return role === "OWNER" || role === "ADMIN" || role === "SUPPORT";
}
