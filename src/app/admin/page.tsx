import { prisma } from "@/lib/db";
import { isEmailConfigured, isProviderConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [userCount, pendingDeposits, needsReviewOrders] = await Promise.all([
    prisma.user.count(),
    prisma.depositRequest.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "NEEDS_REVIEW" } })
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Bảng điều khiển quản trị</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl bg-white border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Tổng người dùng</p>
          <p className="mt-1 text-2xl font-bold">{userCount}</p>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Yêu cầu nạp chờ duyệt</p>
          <p className="mt-1 text-2xl font-bold">{pendingDeposits}</p>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Đơn hàng cần đối soát (NEEDS_REVIEW)</p>
          <p className="mt-1 text-2xl font-bold">{needsReviewOrders}</p>
        </div>
      </div>

      <section className="rounded-xl bg-white border border-slate-200 p-5 space-y-2 text-sm">
        <h2 className="font-semibold text-base">Trạng thái cấu hình bí mật (chỉ hiển thị trạng thái)</h2>
        <p>API Nhà cung cấp: <strong>{isProviderConfigured() ? "Đã cấu hình" : "Chưa cấu hình"}</strong></p>
        <p>Dịch vụ Email: <strong>{isEmailConfigured() ? "Đã cấu hình" : "Chưa cấu hình"}</strong></p>
      </section>
    </div>
  );
}
