import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { apiMessage } from "@/i18n/api";
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
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ order: result.order });
}
