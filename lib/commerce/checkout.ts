import "server-only";

import { approvedCheckoutOffer } from "./checkout-contract";
import { deriveStableCommerceIdentity, type PersistedCommerceAttempt } from "./contract";
import { bindProviderSessionReference, persistCommercialAttempt } from "./persist";
import { createHostedCheckoutSession, retrieveUsableHostedCheckoutSession } from "./stripe";

export async function startGuestHostedCheckout(capability: string): Promise<{ checkoutUrl: string; attempt: PersistedCommerceAttempt }> {
  const attempt = await persistCommercialAttempt({
    creationIdentity: deriveStableCommerceIdentity(capability, "BRexcel/order/v1"),
    idempotencyKey: deriveStableCommerceIdentity(capability, "BRexcel/attempt/v1"),
    guestCapability: capability,
    grantEntitlement: false,
  });

  if (attempt.providerSessionReference) {
    const existing = await retrieveUsableHostedCheckoutSession(attempt.providerSessionReference);
    return { checkoutUrl: existing.url!, attempt };
  }

  const session = await createHostedCheckoutSession(attempt.orderId, attempt.attemptId);
  if (!session.id.startsWith("cs_test_") || !session.url) throw new Error("Stripe did not return a test Checkout Session URL");
  await bindProviderSessionReference(attempt.attemptId, session.id);
  return { checkoutUrl: session.url, attempt };
}

/** Keeps this fixture mapping private to server-side initiation code. */
export const trustedCheckoutOffer = approvedCheckoutOffer;
