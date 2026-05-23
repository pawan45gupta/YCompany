import Stripe from "stripe";
import { requireStripeSecret } from "@/lib/env";

export function getStripe(): Stripe {
  return new Stripe(requireStripeSecret(), {
    apiVersion: Stripe.API_VERSION,
    typescript: true,
  });
}
