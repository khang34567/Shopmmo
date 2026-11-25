import crypto from "node:crypto";
import { isProviderConfigured } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { SimpleCircuitBreaker } from "@/integrations/provider/circuit-breaker";
import type {
  CreateProviderOrderInput,
  ProductProvider,
  ProviderOrderResult,
  ProviderProduct
} from "@/integrations/provider/types";

/**
 * Adapter cho Buyer API (https://canboso.com/api/swagger/ - OAS 3.0 v2.2.0).
 *
 * QUY TẮC THIẾU TÀI LIỆU:
 * Các ảnh chụp Swagger chỉ hiển thị:
 *  - Base URL: https://canboso.com
 *  - Endpoints:
 *      GET  /api/v2/telegram-buyer/products
 *      GET  /api/v2/telegram-buyer/orders
 *      GET  /api/v2/telegram-buyer/balance
 *      POST /api/v2/telegram-buyer/purchase
 *  - Rate limit (60s window) & header 429: Retry-After, X-RateLimit-Scope, X-RateLimit-Penalty-Level.
 *
 * CHƯA CÓ TRONG TÀI LIỆU:
 *  - Định dạng header xác thực chính xác (Authorization Bearer / X-API-Key / ...)
 *  - Schema JSON đầu vào/đầu ra của từng endpoint
 *  - Hỗ trợ Idempotency-Key và Webhook signature
 *
 * Không đoán schema hay tạo API giả. Mọi chỗ thiếu đều đánh dấu TODO(API_DOC).
 */
export class BuyerApiProvider implements ProductProvider {
  public readonly name = "canboso_buyer_api";
  private readonly breaker = new SimpleCircuitBreaker(5, 60_000);

  isConfigured(): boolean {
    return isProviderConfigured();
  }

  private assertReady(): void {
    if (!this.isConfigured()) {
      throw new AppError("PROVIDER_NOT_CONFIGURED", "Nhà cung cấp chưa được cấu hình.", 503);
    }
    if (!this.breaker.canExecute()) {
      throw new AppError(
        "PROVIDER_CIRCUIT_OPEN",
        "Dịch vụ nhà cung cấp tạm thời không khả dụng. Vui lòng thử lại sau.",
        503
      );
    }
  }

  async listProducts(): Promise<ProviderProduct[]> {
    this.assertReady();
    // TODO(API_DOC): Xác nhận header xác thực và response schema của GET /api/v2/telegram-buyer/products
    throw new AppError(
      "PROVIDER_DOC_INCOMPLETE",
      "Chưa đủ tài liệu schema cho GET /api/v2/telegram-buyer/products (xem docs/provider-api.md).",
      501
    );
  }

  async getProduct(_externalId: string): Promise<ProviderProduct | null> {
    this.assertReady();
    // TODO(API_DOC): Xác nhận endpoint/tham số lấy chi tiết 1 sản phẩm
    throw new AppError(
      "PROVIDER_DOC_INCOMPLETE",
      "Chưa đủ tài liệu schema cho chi tiết sản phẩm (xem docs/provider-api.md).",
      501
    );
  }

  async createOrder(_input: CreateProviderOrderInput): Promise<ProviderOrderResult> {
    this.assertReady();
    // TODO(API_DOC): Xác nhận body schema, idempotency key và response của POST /api/v2/telegram-buyer/purchase
    return {
      status: "AMBIGUOUS",
      safeError: "TODO(API_DOC): Chưa cấu hình schema tạo đơn cho POST /api/v2/telegram-buyer/purchase"
    };
  }

  async getOrderStatus(_externalOrderId: string): Promise<ProviderOrderResult> {
    this.assertReady();
    // TODO(API_DOC): Xác nhận tham số lọc và response của GET /api/v2/telegram-buyer/orders
    return {
      status: "AMBIGUOUS",
      safeError: "TODO(API_DOC): Chưa cấu hình schema đối soát cho GET /api/v2/telegram-buyer/orders"
    };
  }

  verifyWebhook(rawBody: string, signature: string | null, timestamp: string | null): boolean {
    // TODO(API_DOC): Kiểm tra nhà cung cấp có hỗ trợ webhook hay không
    const secret = process.env.WEBHOOK_SECRET;
    if (!secret || !signature || !timestamp) return false;
    const ts = Number(timestamp);
    if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300) return false;
    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${timestamp}.${rawBody}`)
      .digest("hex");
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }
}
