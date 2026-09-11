import "server-only";

import type { CreateCommerceAttemptRequest } from "./contract";
import { withCommerceDatabase } from "./database";
import { type AnomalyCode, type VerifiedStripeEvidence, isTerminalProviderEvent, processVerifiedStripeEventInTransaction } from "./fulfillment-core";
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

export type PaymentAttemptLookup = { kind: "bound"; attemptId: string } | { kind: "binding-race" } | { kind: "metadata-conflict"; attemptId: string } | { kind: "unknown" };

export function hasTerminalStripeProviderEvent(eventId: string) {
  return withCommerceDatabase((database) => database.begin(async (transaction) => {
    await transaction`set local role commerce_runtime`;
    return isTerminalProviderEvent(transaction, eventId);
  }));
}

export function findPaymentAttemptForStripeSession(sessionId: string, metadataAttemptId: string | null): Promise<PaymentAttemptLookup> {
  return withCommerceDatabase((database) => database.begin(async (transaction) => {
    await transaction`set local role commerce_runtime`;
    const bound = (await transaction<{ id: string }[]>`
      select id from commerce.payment_attempts
      where provider = 'stripe' and environment = 'test' and provider_session_reference = ${sessionId}
    `)[0];
    if (bound) return { kind: "bound", attemptId: bound.id };
    if (metadataAttemptId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(metadataAttemptId)) {
      const metadataAttempt = (await transaction<{ id: string; provider_session_reference: string | null }[]>`
        select id, provider_session_reference from commerce.payment_attempts where id = ${metadataAttemptId}::uuid
      `)[0];
      if (metadataAttempt?.provider_session_reference === null) return { kind: "binding-race" };
      if (metadataAttempt) return { kind: "metadata-conflict", attemptId: metadataAttempt.id };
    }
    return { kind: "unknown" };
  }));
}

export async function processVerifiedStripeEvent(evidence: VerifiedStripeEvidence, attemptId: string | null) {
  try {
    return await withCommerceDatabase((database) => database.begin(async (transaction) => {
      await transaction`set local role commerce_runtime`;
      return processVerifiedStripeEventInTransaction(transaction, evidence, attemptId);
    }));
  } catch (error) {
    if (await hasTerminalStripeProviderEvent(evidence.eventId)) return "already_fulfilled" as const;
    throw error;
  }
}

export function recordStripeWebhookAttention(event: { id: string; type: string; sessionId: string; livemode: boolean; accountId: string | null }, anomalyCode: AnomalyCode) {
  return withCommerceDatabase((database) => database.begin(async (transaction) => {
    await transaction`set local role commerce_runtime`;
    await transaction`
      insert into commerce.provider_events (
        provider, environment, provider_event_id, event_type, provider_object_reference,
        provider_account_id, envelope_livemode, outcome, anomaly_code
      ) values (
        'stripe', 'test', ${event.id}, ${event.type}, ${event.sessionId},
        ${event.accountId}, ${event.livemode}, 'attention', ${anomalyCode}
      )
    `;
    return "attention" as const;
  })).catch(async (error) => {
    if (await hasTerminalStripeProviderEvent(event.id)) return "already_fulfilled" as const;
    throw error;
  });
}
