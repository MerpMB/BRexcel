import Stripe from "stripe";

export function createStripeTestClient(secret = process.env.STRIPE_TEST_SECRET_KEY) {
  if (!secret) throw new Error("STRIPE_TEST_SECRET_KEY is required for Stripe checkout");
  if (secret.startsWith("sk_live_")) throw new Error("Live Stripe keys are not permitted in T06");
  if (!secret.startsWith("sk_test_")) throw new Error("T06 requires a Stripe test secret key");
  return new Stripe(secret, { httpClient: Stripe.createFetchHttpClient() });
}
