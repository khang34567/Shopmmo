# Kiến trúc hệ thống

- **Phân lớp:** `UI (src/app)` → `API Route Handlers (src/app/api)` → `Services (src/services)` → `DB/Prisma (src/lib/db.ts)` & `Integrations (src/integrations)`.
- **Mô hình thanh toán:** Mô hình B (Nạp ví chuyển khoản thủ công → Admin duyệt ghi bút toán `LedgerEntry` → Mua hàng dùng cơ chế `HOLD` → `Outbox ProviderRequest` → `CAPTURE` / `RELEASE` / `NEEDS_REVIEW`).
- **Tính bất biến:** Trigger PostgreSQL (`prisma/migrations/0001_immutability_and_checks/migration.sql`) chặn `UPDATE`/`DELETE` trên `LedgerEntry` và `AuditLog`; ràng buộc `CHECK ("balance" >= 0 AND "held" >= 0)` trên `Wallet`.
