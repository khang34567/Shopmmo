# Đặc tả trích xuất API Nhà cung cấp (Buyer API)

Nguồn: 2 ảnh chụp trang Swagger (`https://canboso.com/api/swagger/`, Buyer API 2.2.0 OAS 3.0).

## 1. Thông tin đã xác nhận từ ảnh chụp
- **Base URL:** `https://canboso.com`
- **Danh sách Endpoint:**
  1. `GET /api/v2/telegram-buyer/products` — List products for the buyer key
  2. `GET /api/v2/telegram-buyer/orders` — Get buyer order history
  3. `GET /api/v2/telegram-buyer/balance` — Get current wallet balance for the buyer key
  4. `POST /api/v2/telegram-buyer/purchase` — Purchase product by `product_id` using buyer key
- **Giới hạn tốc độ (cửa sổ 60 giây):**
  - API key toàn bộ endpoint: 60 requests
  - Source IP toàn bộ endpoint: 120 requests
  - `products`: 30 requests | `balance`: 30 requests | `orders`: 30 requests | `purchase`: 60 requests
  - Invalid auth per key: 5 requests | per IP: 15 requests
- **Cơ chế phạt vượt giới hạn (429):**
  - Mức khóa tăng dần trong 24h: 1 phút, 5 phút, 15 phút, 1 giờ, 6 giờ.
  - Header trả về: `Retry-After`, `X-RateLimit-Scope`, `X-RateLimit-Penalty-Level`.

## 2. Mục KHÔNG CÓ TRONG TÀI LIỆU (Cần bổ sung để gỡ `TODO(API_DOC)`)
- **Cơ chế xác thực (Authorize):** KHÔNG CÓ TRONG TÀI LIỆU (chưa rõ tên header `Authorization: Bearer` hay `X-API-Key`...).
- **Request/Response JSON Schema:** KHÔNG CÓ TRONG TÀI LIỆU cho cả 4 endpoint.
- **Mã lỗi chi tiết (4xx/5xx):** KHÔNG CÓ TRONG TÀI LIỆU.
- **Idempotency key khi gọi `/purchase`:** KHÔNG CÓ TRONG TÀI LIỆU.
- **Webhook:** KHÔNG CÓ TRONG TÀI LIỆU.
