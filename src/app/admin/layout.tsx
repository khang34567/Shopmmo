import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import { isStaffRole } from "@/lib/rbac";

export const metadata: Metadata = {
  title: "Quản trị hệ thống",
  robots: { index: false, follow: false }
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  if (!session || !isStaffRole(session.user.role)) {
    redirect("/login");
  }
  return <div className="space-y-6">{children}</div>;
}
