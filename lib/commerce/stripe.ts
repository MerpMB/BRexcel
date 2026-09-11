import "server-only";

import { createHostedCheckoutSessionWithClient } from "./stripe-core";
import { createStripeTestClient } from "./stripe-client";

function applicationOrigin() {
  const value = process.env.APP_ORIGIN;
  if (!value) throw new Error("APP_ORIGIN is required to start checkout");
  const parsed = new URL(value);
  if (parsed.origin !== value || (parsed.protocol !== "https:" && parsed.protocol !== "http:")) throw new Error("APP_ORIGIN must be a canonical HTTP(S) origin");
  return parsed.origin;
}

export function getStripeClient() {
  return createStripeTestClient();
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
