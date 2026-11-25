import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cửa hàng trực tuyến — Thương mại điện tử VND",
  description: "Hệ thống thương mại điện tử tiếng Việt, thanh toán minh bạch bằng VND."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-screen flex flex-col">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
            <Link href="/" className="font-bold text-lg text-slate-900">
              VNShop
            </Link>
            <nav aria-label="Điều hướng chính" className="flex items-center gap-4 text-sm font-medium">
              <Link href="/products" className="hover:text-blue-700">Sản phẩm</Link>
              <Link href="/account" className="hover:text-blue-700">Tài khoản</Link>
              <Link href="/login" className="px-3 py-1.5 rounded-md bg-slate-900 text-white hover:bg-slate-800">
                Đăng nhập
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">{children}</main>

        <footer className="bg-white border-t border-slate-200 mt-12">
          <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-slate-600 flex flex-wrap gap-4 justify-between">
            <span>© {new Date().getFullYear()} Cửa hàng trực tuyến</span>
            <div className="flex gap-4">
              <Link href="/terms" className="hover:underline">Điều khoản</Link>
              <Link href="/privacy" className="hover:underline">Bảo mật dữ liệu</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
