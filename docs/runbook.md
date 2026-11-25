# Runbook vận hành & xử lý sự cố

1. **Đơn hàng ở trạng thái `NEEDS_REVIEW`:** Kiểm tra lịch sử đơn bên nhà cung cấp (`GET /api/v2/telegram-buyer/orders`). Nếu nhà cung cấp đã trừ tiền/giao hàng → chốt đơn (`COMPLETED`). Nếu không tồn tại → hoàn tiền (`REFUNDED`, tạo bút toán `RELEASE`).
2. **Xoay secret:** Cập nhật `AUTH_SECRET` / `BUYER_API_KEY` / `CRON_SECRET` trên Vercel Environment Variables và Redeploy.
3. **Sao lưu/khôi phục DB:** Sử dụng Point-in-Time Recovery (PITR) của Neon/Supabase trước khi chạy `prisma migrate deploy`.
