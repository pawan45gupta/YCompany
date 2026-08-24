import { sendEmail } from "@/lib/email/send";
import {
  buildOrderCancellationEmail,
  buildOrderConfirmationEmail,
  buildWelcomeEmail,
} from "@/lib/email/templates";
import type { Order } from "@/types/order";

async function deliver(
  label: string,
  payload: { to: string; subject: string; text: string; html: string },
): Promise<void> {
  const result = await sendEmail(payload);
  if (!result.ok) {
    console.error(`[email] ${label} failed for ${payload.to}: ${result.error}`);
  }
}

export async function sendWelcomeEmail(input: {
  email: string;
  name?: string | null;
}): Promise<void> {
  await deliver("welcome", buildWelcomeEmail(input));
}

export async function sendOrderConfirmationEmail(order: Order): Promise<void> {
  await deliver("order confirmation", buildOrderConfirmationEmail(order));
}

export async function sendOrderCancellationEmail(order: Order): Promise<void> {
  await deliver("order cancellation", buildOrderCancellationEmail(order));
}
