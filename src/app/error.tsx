"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="text-center py-16 space-y-3">
      <h2 className="text-2xl font-bold">Đã xảy ra lỗi ngoài ý muốn</h2>
      <p className="text-sm text-slate-600">Vui lòng thử lại sau ít phút.</p>
      <button onClick={() => reset()} className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm">
        Thử lại
      </button>
    </div>
  );
}
