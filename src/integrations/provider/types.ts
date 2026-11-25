export interface ProviderProduct {
  externalId: string;
  name: string;
  description: string;
  category: string;
  sourcePriceVnd: bigint;
  available: boolean;
  imageUrl?: string;
  rawHash: string;
}

export interface CreateProviderOrderInput {
  productExternalId: string;
  quantity: number;
  idempotencyKey: string;
}

export interface ProviderOrderResult {
  status: "SUCCEEDED" | "FAILED" | "AMBIGUOUS";
  externalOrderId?: string;
  deliveredPayload?: string;
  safeError?: string;
}

export interface ProductProvider {
  readonly name: string;
  isConfigured(): boolean;
  listProducts(): Promise<ProviderProduct[]>;
  getProduct(externalId: string): Promise<ProviderProduct | null>;
  createOrder(input: CreateProviderOrderInput): Promise<ProviderOrderResult>;
  getOrderStatus(externalOrderId: string): Promise<ProviderOrderResult>;
  verifyWebhook(rawBody: string, signature: string | null, timestamp: string | null): boolean;
}
