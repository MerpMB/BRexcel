import { randomUUID } from "node:crypto";
import Stripe from "stripe";
import { approvedCheckoutOffer } from "../lib/commerce/checkout-contract";
import { createHostedCheckoutSessionWithClient } from "../lib/commerce/stripe-core";

function requiredTestSecret() {
  const value = process.env.STRIPE_TEST_SECRET_KEY;
  if (!value) throw new Error("Stripe provider test requires STRIPE_TEST_SECRET_KEY");
  if (value.startsWith("sk_live_")) throw new Error("Stripe provider test rejects live-mode keys");
  if (!value.startsWith("sk_test_")) throw new Error("Stripe provider test requires a test-mode key");
  return value;
}

function requiredOrigin() {
  const value = process.env.APP_ORIGIN;
  if (!value || new URL(value).origin !== value) throw new Error("Stripe provider test requires canonical APP_ORIGIN");
  return value;
}

async function main() {
  const stripe = new Stripe(requiredTestSecret());
  const attemptId = randomUUID();
  const orderId = randomUUID();
  const origin = requiredOrigin();
  const first = await createHostedCheckoutSessionWithClient(stripe, origin, orderId, attemptId);
  const retry = await createHostedCheckoutSessionWithClient(stripe, origin, orderId, attemptId);
  if (first.id !== retry.id || first.amount_total !== approvedCheckoutOffer.amountMinor || first.currency !== approvedCheckoutOffer.currency.toLowerCase()) throw new Error("Stripe Checkout did not preserve the trusted test offer or idempotency");
  if (first.status === "open") await stripe.checkout.sessions.expire(first.id);
  console.log("Stripe test Checkout provider evidence passed without logging a secret or Checkout URL.");
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Stripe provider test failed");
  process.exitCode = 1;
});
