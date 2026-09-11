import { approvedCheckoutOffer } from "./checkout-contract";
import { deriveStableCommerceIdentity, type CreateCommerceAttemptRequest, type PersistedCommerceAttempt } from "./contract";

type HostedCheckoutSession = { id: string; url?: string | null; status?: string | null };

export type GuestHostedCheckoutDependencies = {
  persistCommercialAttempt: (request: CreateCommerceAttemptRequest) => Promise<PersistedCommerceAttempt>;
  createHostedCheckoutSession: (orderId: string, attemptId: string) => Promise<HostedCheckoutSession>;
  retrieveUsableHostedCheckoutSession: (providerSessionReference: string) => Promise<HostedCheckoutSession>;
  bindProviderSessionReference: (attemptId: string, providerSessionReference: string) => Promise<unknown>;
};

export async function startGuestHostedCheckoutWithDependencies(capability: string, dependencies: GuestHostedCheckoutDependencies): Promise<{ checkoutUrl: string; attempt: PersistedCommerceAttempt }> {
  const attempt = await dependencies.persistCommercialAttempt({
    creationIdentity: deriveStableCommerceIdentity(capability, "BRexcel/order/v1"),
    idempotencyKey: deriveStableCommerceIdentity(capability, "BRexcel/attempt/v1"),
    guestCapability: capability,
  });

  if (attempt.providerSessionReference) {
    const existing = await dependencies.retrieveUsableHostedCheckoutSession(attempt.providerSessionReference);
    if (!existing.url) throw new Error("The existing checkout session is no longer usable; start a new checkout explicitly");
    return { checkoutUrl: existing.url, attempt };
  }

  const session = await dependencies.createHostedCheckoutSession(attempt.orderId, attempt.attemptId);
  if (!session.id.startsWith("cs_test_") || !session.url) throw new Error("Stripe did not return a test Checkout Session URL");
  await dependencies.bindProviderSessionReference(attempt.attemptId, session.id);
  return { checkoutUrl: session.url, attempt };
}

/** Keeps this fixture mapping private to server-side initiation code. */
export const trustedCheckoutOffer = approvedCheckoutOffer;
