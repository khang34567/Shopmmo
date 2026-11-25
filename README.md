# VNShop — Website Thương mại Điện tử (VND) trên Vercel

## 1. Cảnh báo bảo mật đầu tiên
- **KHÔNG** đưa bất kỳ API key/secret nào vào mã nguồn hoặc Git.
- Nếu API key nhà cung cấp từng bị dán vào kênh chat, hãy **thu hồi và tạo khóa mới** trước khi đưa lên Vercel.

## 2. Cài đặt & Chạy Local
```bash
cp .env.example .env.local
npm install
npm run db:generate
npm run db:migrate:dev
npm run admin:create
npm run dev
```

## 3. Triển khai lên Vercel
1. Đẩy mã nguồn lên GitHub và Import vào Vercel.
2. Tạo PostgreSQL serverless (Neon hoặc Supabase) và cấu hình `DATABASE_URL` (pooled) + `DIRECT_URL` (direct).
3. Khai báo đầy đủ biến môi trường từ `.env.example` trong **Vercel Project Settings → Environment Variables**.
4. Chạy migration production (TUYỆT ĐỐI không dùng `db push`):
   ```bash
   npx prisma migrate deploy
   ```
5. Tạo tài khoản `OWNER` đầu tiên:
   ```bash
   npm run admin:create
   ```
6. Vercel Cron trong `vercel.json` sẽ tự động kích hoạt các job định kỳ (xác thực qua `CRON_SECRET`).

## 4. Kiểm thử & Kiểm tra bảo mật
```bash
npm run scan:secrets
npm run lint
npm run type-check
npm test
npm run build
```

## 5. Việc người triển khai phải cung cấp thêm
1. **Tài liệu OpenAPI/Swagger đầy đủ** (JSON/YAML hoặc mở rộng schema từng endpoint của `canboso.com`) để gỡ các điểm `TODO(API_DOC)` trong `src/integrations/provider/buyer-api-provider.ts`.
2. **Thông tin tài khoản ngân hàng nhận tiền** (nhập qua trang quản trị với tài khoản `OWNER`).
3. **Dịch vụ email** (`RESEND_API_KEY`, `EMAIL_FROM`).
4. **Tư vấn pháp lý:** Rà soát điều khoản, thông báo/đăng ký website TMĐT với Bộ Công Thương, quy định về ví nội bộ/thu hộ, thuế/hóa đơn điện tử và Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.
