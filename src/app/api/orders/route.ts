import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { apiMessage } from "@/i18n/api";
import { listOrdersForUser } from "@/lib/orders/service";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email || !session.user.id) {
    return NextResponse.json({ error: apiMessage("unauthorized") }, { status: 401 });
  }

  const orders = listOrdersForUser(session.user.email, session.user.id);
  return NextResponse.json({ orders });
}
