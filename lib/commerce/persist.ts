import "server-only";

import type { CreateCommerceAttemptRequest } from "./contract";
import { withCommerceDatabase } from "./database";
import { bindProviderSessionReferenceInTransaction, persistTrustedCommerceAttemptInTransaction } from "./persistence-core";

/** The sole application entry point for commercial-attempt persistence. */
export function persistCommercialAttempt(request: CreateCommerceAttemptRequest) {
  return withCommerceDatabase((database) => database.begin(async (transaction) => {
    await transaction`set local role commerce_runtime`;
    return persistTrustedCommerceAttemptInTransaction(transaction, request);
  }));
}

export function bindProviderSessionReference(attemptId: string, providerSessionReference: string) {
  return withCommerceDatabase((database) => database.begin(async (transaction) => {
    await transaction`set local role commerce_runtime`;
    return bindProviderSessionReferenceInTransaction(transaction, attemptId, providerSessionReference);
  }));
}
