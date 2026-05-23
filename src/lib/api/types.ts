import type { Order } from "@/types/order";

export type OrdersResponse = {
  orders: Order[];
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
