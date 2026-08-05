import type { Order } from "@/types/order";
import type { Product } from "@/types/product";

export type OrdersResponse = {
  orders: Order[];
};

export type SearchSource = "elasticsearch" | "memory";

export type SearchResponse = {
  products: Product[];
  total: number;
  tookMs: number;
  source: SearchSource;
  queryString: string;
};

export type CancelOrderResponse = {
  order?: Order;
};

export type CheckoutResponse = {
  url?: string;
};

export type CheckoutPayload = {
  items: { productId: string; quantity: number }[];
  couponCode?: string;
  customerEmail?: string;
};

export type SyncOrderPayload = {
  sessionId: string;
};
