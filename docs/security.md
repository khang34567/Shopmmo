# Bảo mật hệ thống

- **Bí mật:** Chỉ nằm trong biến môi trường phía server. Script `npm run scan:secrets` chạy trong CI chặn rò rỉ secret.
- **Xác thực:** Argon2id (`@node-rs/argon2`), session hash lưu DB, cookie `HttpOnly` + `Secure` + `SameSite`, chống timing attack, rate limit IP + tài khoản.
- **Quản trị:** RBAC deny-by-default (`OWNER`, `ADMIN`, `SUPPORT`, `BUYER`), 2FA TOTP, step-up re-auth cho thao tác nhạy cảm, AuditLog nối chuỗi SHA-256.
