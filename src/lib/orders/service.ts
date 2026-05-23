import { products } from "@/data/products";
import { getSeedOrders } from "@/lib/orders/seed";
import { loadOrders, saveOrders } from "@/lib/orders/store";
import { apiMessage } from "@/i18n/api";
import type { Order, OrderLine } from "@/types/order";
import { canCancelOrder } from "@/types/order";

function ensureSeeded(email: string, userId: string): Order[] {
  let orders = loadOrders();
  const normalized = email.toLowerCase();
  const hasAny = orders.some((o) => o.customerEmail.toLowerCase() === normalized);
  if (!hasAny) {
    const demoEmail = process.env.AUTH_DEMO_EMAIL ?? "demo@ycompany.com";
    if (normalized === demoEmail.toLowerCase()) {
      orders = [...orders, ...getSeedOrders(demoEmail, userId)];
      saveOrders(orders);
    }
  }
  return orders;
}

export function listOrdersForUser(email: string, userId: string): Order[] {
  const orders = ensureSeeded(email, userId);
  return orders
    .filter(
      (o) =>
        o.customerEmail.toLowerCase() === email.toLowerCase() || o.userId === userId,
    )
    .sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());
}

export function getOrderForUser(
  orderId: string,
  email: string,
  userId: string,
): Order | undefined {
  return listOrdersForUser(email, userId).find((o) => o.id === orderId);
}

export function cancelOrder(
  orderId: string,
  email: string,
  userId: string,
): { ok: true; order: Order } | { ok: false; error: string } {
  const orders = loadOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx === -1) return { ok: false, error: apiMessage("orderNotFound") };

  const order = orders[idx];
  const owns =
    order.customerEmail.toLowerCase() === email.toLowerCase() ||
    order.userId === userId;
  if (!owns) return { ok: false, error: apiMessage("orderNotFound") };
  if (!canCancelOrder(order)) {
    return { ok: false, error: apiMessage("cannotCancel") };
  }

  const updated: Order = {
    ...order,
    status: "cancelled",
    cancelledAt: new Date().toISOString(),
  };
  orders[idx] = updated;
  saveOrders(orders);
  return { ok: true, order: updated };
}

export function createOrderFromCheckout(input: {
  userId: string;
  customerEmail: string;
  stripeSessionId: string;
  lines: OrderLine[];
  subtotalCents: number;
  shippingCents: number;
  discountCents: number;
  totalCents: number;
  currency: string;
}): Order {
  const orders = loadOrders();
  if (orders.some((o) => o.stripeSessionId === input.stripeSessionId)) {
    return orders.find((o) => o.stripeSessionId === input.stripeSessionId)!;
  }

  const order: Order = {
    id: `ord_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId: input.userId,
    customerEmail: input.customerEmail.toLowerCase(),
    stripeSessionId: input.stripeSessionId,
    status: "processing",
    lines: input.lines,
    subtotalCents: input.subtotalCents,
    shippingCents: input.shippingCents,
    discountCents: input.discountCents,
    totalCents: input.totalCents,
    currency: input.currency,
    placedAt: new Date().toISOString(),
  };
  orders.push(order);
  saveOrders(orders);
  return order;
}

export function buildLinesFromMetadata(
  itemsJson: string | undefined,
): OrderLine[] | null {
  if (!itemsJson) return null;
  try {
    const items = JSON.parse(itemsJson) as { productId: string; quantity: number }[];
    const byId = new Map(products.map((p) => [p.id, p]));
    const lines: OrderLine[] = [];
    for (const item of items) {
      const p = byId.get(item.productId);
      if (!p) continue;
      lines.push({
        productId: p.id,
        name: p.name,
        quantity: item.quantity,
        unitPriceCents: p.priceCents,
      });
    }
    return lines.length ? lines : null;
  } catch {
    return null;
  }
}
