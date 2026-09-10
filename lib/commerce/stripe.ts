import "server-only";

import Stripe from "stripe";
import { createHostedCheckoutSessionWithClient } from "./stripe-core";

function applicationOrigin() {
  const value = process.env.APP_ORIGIN;
  if (!value) throw new Error("APP_ORIGIN is required to start checkout");
  const parsed = new URL(value);
  if (parsed.origin !== value || (parsed.protocol !== "https:" && parsed.protocol !== "http:")) throw new Error("APP_ORIGIN must be a canonical HTTP(S) origin");
  return parsed.origin;
}

export function getStripeClient() {
  const secret = process.env.STRIPE_TEST_SECRET_KEY;
  if (!secret) throw new Error("STRIPE_TEST_SECRET_KEY is required for Stripe checkout");
  if (secret.startsWith("sk_live_")) throw new Error("Live Stripe keys are not permitted in T06");
  if (!secret.startsWith("sk_test_")) throw new Error("T06 requires a Stripe test secret key");
  return new Stripe(secret);
}

export async function createHostedCheckoutSession(orderId: string, attemptId: string) {
  const stripe = getStripeClient();
  const origin = applicationOrigin();
  return createHostedCheckoutSessionWithClient(stripe, origin, orderId, attemptId);
}

export async function retrieveUsableHostedCheckoutSession(providerSessionReference: string) {
  const session = await getStripeClient().checkout.sessions.retrieve(providerSessionReference);
  if (session.status !== "open" || !session.url) throw new Error("The existing checkout session is no longer usable; start a new checkout explicitly");
  return session;
}
