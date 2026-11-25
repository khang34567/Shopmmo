import { BuyerApiProvider } from "@/integrations/provider/buyer-api-provider";
import type { ProductProvider } from "@/integrations/provider/types";

let providerInstance: ProductProvider | null = null;

export function getProductProvider(): ProductProvider {
  if (!providerInstance) {
    providerInstance = new BuyerApiProvider();
  }
  return providerInstance;
}
