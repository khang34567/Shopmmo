export default function PrivacyPage() {
  return (
    <article className="prose max-w-3xl bg-white border border-slate-200 rounded-xl p-6 space-y-4">
      <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm font-semibold text-red-800">
        BẢN MẪU — CHỦ CỬA HÀNG PHẢI RÀ SOÁT THEO NGHỊ ĐỊNH 13/2023/NĐ-CP
      </div>
      <h1 className="text-2xl font-bold">Chính sách bảo vệ dữ liệu cá nhân</h1>
      <p className="text-sm text-slate-700">
        Hệ thống chỉ sử dụng cookie thiết yếu cho phiên đăng nhập và bảo mật CSRF. Người dùng có quyền yêu cầu
        ẩn danh thông tin định danh tài khoản (các bản ghi sổ cái tài chính được lưu giữ theo quy định kế toán/pháp luật).
      </p>
    </article>
  );
}
