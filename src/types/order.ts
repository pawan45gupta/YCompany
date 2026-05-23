import { getTranslations } from "@/i18n/server";

export type OrderStatus = "processing" | "shipped" | "delivered" | "cancelled";

export type OrderLine = {
  productId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
};

export type Order = {
  id: string;
  userId: string;
  customerEmail: string;
  stripeSessionId?: string;
  status: OrderStatus;
  lines: OrderLine[];
  subtotalCents: number;
  shippingCents: number;
  discountCents: number;
  totalCents: number;
  currency: string;
  placedAt: string;
  cancelledAt?: string;
};

export function canCancelOrder(order: Order): boolean {
  return order.status === "processing";
}

export function orderStatusLabel(status: OrderStatus): string {
  const { t } = getTranslations();
  return t(`account.status.${status}`);
}
