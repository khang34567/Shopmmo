import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { formatVnd } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const wallet = await prisma.wallet.findUnique({ where: { userId: session.userId } });
  const balance = wallet?.balance ?? 0n;
  const held = wallet?.held ?? 0n;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tài khoản của tôi</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl bg-white border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Số dư khả dụng</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{formatVnd(balance)}</p>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Đang tạm giữ (Hold)</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{formatVnd(held)}</p>
        </div>
      </div>
    </div>
  );
}
