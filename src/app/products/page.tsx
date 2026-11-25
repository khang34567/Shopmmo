import { prisma } from "@/lib/db";
import { formatVnd } from "@/lib/money";
import { isProviderConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  let products: Array<{ id: string; name: string; category: string; salePrice: bigint }> = [];
  let dbError = false;

  try {
    products = await prisma.product.findMany({
      where: { status: "AVAILABLE" },
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: { id: true, name: true, category: true, salePrice: true }
    });
  } catch {
    dbError = true;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Danh mục sản phẩm</h1>

      {dbError ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Chưa kết nối cơ sở dữ liệu. Vui lòng cấu hình <code>DATABASE_URL</code> và chạy migration.
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">
          <p className="font-medium text-slate-800">Chưa có sản phẩm khả dụng</p>
          <p className="mt-1 text-sm">
            {isProviderConfigured()
              ? "Đang chờ đồng bộ từ nhà cung cấp (cần hoàn thiện schema trong docs/provider-api.md)."
              : "Nhà cung cấp chưa được cấu hình. Không hiển thị dữ liệu mẫu."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <article key={p.id} className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500">{p.category}</span>
                <h2 className="mt-1 font-semibold text-slate-900">{p.name}</h2>
              </div>
              <p className="mt-4 text-lg font-bold text-slate-900">{formatVnd(p.salePrice)}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
