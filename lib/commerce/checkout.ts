import "server-only";

import { startGuestHostedCheckoutWithDependencies, trustedCheckoutOffer } from "./checkout-start-core";
import type { PersistedCommerceAttempt } from "./contract";
import { bindProviderSessionReference, persistCommercialAttempt } from "./persist";
import { createHostedCheckoutSession, retrieveUsableHostedCheckoutSession } from "./stripe";

export async function startGuestHostedCheckout(capability: string): Promise<{ checkoutUrl: string; attempt: PersistedCommerceAttempt }> {
  return startGuestHostedCheckoutWithDependencies(capability, {
    persistCommercialAttempt,
    createHostedCheckoutSession,
    retrieveUsableHostedCheckoutSession,
    bindProviderSessionReference,
  });
}

export { trustedCheckoutOffer };
