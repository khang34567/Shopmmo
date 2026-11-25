import Link from "next/link";

export default function NotFound() {
  return (
    <div className="text-center py-16 space-y-3">
      <h1 className="text-3xl font-bold">404 — Không tìm thấy trang</h1>
      <p className="text-slate-600 text-sm">Đường dẫn bạn truy cập không tồn tại hoặc đã bị di chuyển.</p>
      <Link href="/" className="inline-block mt-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm">
        Về trang chủ
      </Link>
    </div>
  );
}
