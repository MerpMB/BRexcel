import type Stripe from "stripe";
import { approvedCheckoutOffer, stripeCheckoutIdempotencyKey } from "./checkout-contract";

export async function createHostedCheckoutSessionWithClient(stripe: Stripe, origin: string, orderId: string, attemptId: string) {
  return stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{
      price_data: {
        currency: approvedCheckoutOffer.currency.toLowerCase(),
        product_data: { name: approvedCheckoutOffer.title },
        unit_amount: approvedCheckoutOffer.amountMinor,
      },
      quantity: approvedCheckoutOffer.quantity,
    }],
    success_url: `${origin}/checkout/success`,
    cancel_url: `${origin}/checkout/cancel`,
    metadata: { order_id: orderId, payment_attempt_id: attemptId },
  }, { idempotencyKey: stripeCheckoutIdempotencyKey(attemptId) });
}
