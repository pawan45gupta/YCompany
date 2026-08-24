import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sendOrderCancellationEmail } from "@/lib/email/notifications";
import { apiMessage } from "@/i18n/api";
import { nrRecordEvent } from "@/lib/observability/newrelic-server";
import { cancelOrder } from "@/lib/orders/service";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email || !session.user.id) {
    return NextResponse.json({ error: apiMessage("unauthorized") }, { status: 401 });
  }

  const { id } = await params;
  const result = cancelOrder(id, session.user.email, session.user.id);
  if (!result.ok) {
    void nrRecordEvent("OrderCancelRejected", {
      order_id: id,
      user_id: session.user.id,
      reason: result.error,
    });
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  void nrRecordEvent("OrderCancelled", {
    order_id: id,
    user_id: session.user.id,
    total_cents: result.order.totalCents,
    currency: result.order.currency,
  });
  void sendOrderCancellationEmail(result.order);
  return NextResponse.json({ order: result.order });
}
