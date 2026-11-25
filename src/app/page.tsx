import Link from "next/link";
import { isProviderConfigured } from "@/lib/env";

export default function HomePage() {
  const providerReady = isProviderConfigured();

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-10 shadow-sm">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Hệ thống Thương mại Điện tử (VND)
        </h1>
        <p className="mt-3 text-slate-600 max-w-2xl">
          Thanh toán bằng chuyển khoản ngân hàng qua ví nội bộ, ghi nhận sổ cái bất biến và kiểm soát minh bạch từng đơn hàng.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/products"
            className="px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
          >
            Xem danh mục sản phẩm
          </Link>
          <Link
            href="/register"
            className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-800 text-sm font-medium hover:bg-slate-100"
          >
            Tạo tài khoản
          </Link>
        </div>
      </section>

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        <h2 className="font-semibold">Trạng thái kết nối nhà cung cấp</h2>
        <p className="mt-1">
          {providerReady
            ? "Biến môi trường API đã cấu hình. Đang chờ hoàn tất đặc tả schema phản hồi từ tài liệu Swagger (xem docs/provider-api.md) để đồng bộ sản phẩm thật."
            : "Nhà cung cấp chưa được cấu hình. Hệ thống không hiển thị sản phẩm hay giá giả."}
        </p>
      </section>
    </div>
  );
}
