import type postgres from "postgres";
import { commerceTestOffer } from "./contract";

export const supportedStripeEventTypes = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "checkout.session.expired",
]);

export type ProviderOutcome = "fulfilled" | "already_fulfilled" | "observed_unpaid" | "observed_failed" | "observed_expired" | "attention";
export type AnomalyCode = "unknown_session" | "metadata_mismatch" | "amount_mismatch" | "currency_mismatch" | "item_mismatch" | "environment_mismatch" | "account_mismatch" | "payment_status_mismatch" | "second_paid_attempt" | "conflicting_entitlement_source";

export type VerifiedStripeEvidence = {
  eventId: string;
  eventType: string;
  eventSessionId: string;
  eventLivemode: boolean;
  accountId: string;
  session: {
    id: string;
    livemode: boolean;
    mode: string | null;
    paymentStatus: string | null;
    paymentIntentId: string | null;
    amountTotal: number | null;
    currency: string | null;
    metadataOrderId: string | null;
    metadataAttemptId: string | null;
    recoveryEmail: string | null;
    shippingAmount: number | null;
  };
  lineItems: Array<{
    quantity: number | null;
    unitAmount: number | null;
    amountTotal: number | null;
    currency: string | null;
    amountDiscount: number | null;
    amountTax: number | null;
  }>;
  lineItemsComplete: boolean;
};

type LockedAttempt = {
  id: string;
  order_id: string;
  provider_session_reference: string | null;
  provider_payment_reference: string | null;
  attempt_state: string;
};
type LockedOrder = {
  id: string;
  offer_id: string;
  product_id: string;
  version_id: string;
  amount_minor: number;
  currency: string;
  quantity: number;
  environment: string;
  fulfillment_status: string;
  fulfilled_at: string | null;
  recovery_email: string | null;
};
type Entitlement = { id: string; source_payment_attempt_id: string };

function observationOutcome(eventType: string): ProviderOutcome {
  if (eventType === "checkout.session.async_payment_failed") return "observed_failed";
  if (eventType === "checkout.session.expired") return "observed_expired";
  return "observed_unpaid";
}

function anomalyForEvidence(evidence: VerifiedStripeEvidence, order: LockedOrder, attempt: LockedAttempt): AnomalyCode | undefined {
  if (evidence.eventLivemode || evidence.session.livemode || evidence.session.mode !== "payment") return "environment_mismatch";
  if (attempt.provider_session_reference !== evidence.session.id || evidence.eventSessionId !== evidence.session.id) return "metadata_mismatch";
  if (evidence.session.metadataOrderId !== order.id || evidence.session.metadataAttemptId !== attempt.id) return "metadata_mismatch";
  if (order.offer_id !== commerceTestOffer.offerId || order.product_id !== commerceTestOffer.productId || order.version_id !== commerceTestOffer.versionId || order.amount_minor !== commerceTestOffer.amountMinor || order.currency !== commerceTestOffer.currency || order.quantity !== commerceTestOffer.quantity || order.environment !== commerceTestOffer.environment) return "environment_mismatch";
  if (evidence.session.amountTotal !== commerceTestOffer.amountMinor) return "amount_mismatch";
  if (evidence.session.currency?.toUpperCase() !== commerceTestOffer.currency) return "currency_mismatch";
  if (!evidence.lineItemsComplete || evidence.lineItems.length !== 1) return "item_mismatch";
  const item = evidence.lineItems[0];
  if (item.quantity !== 1 || item.unitAmount !== commerceTestOffer.amountMinor || item.amountTotal !== commerceTestOffer.amountMinor || item.currency?.toUpperCase() !== commerceTestOffer.currency || item.amountDiscount !== 0 || item.amountTax !== 0 || evidence.session.shippingAmount !== 0) return "item_mismatch";
  return undefined;
}

async function insertProviderEvent(transaction: postgres.TransactionSql, evidence: VerifiedStripeEvidence, paymentAttemptId: string | null, outcome: ProviderOutcome, anomalyCode?: AnomalyCode) {
  await transaction`
    insert into commerce.provider_events (
      provider, environment, provider_event_id, event_type, provider_object_reference,
      provider_account_id, envelope_livemode, payment_attempt_id, outcome, anomaly_code
    ) values (
      'stripe', ${commerceTestOffer.environment}, ${evidence.eventId}, ${evidence.eventType}, ${evidence.session.id},
      ${evidence.accountId}, ${evidence.eventLivemode}, ${paymentAttemptId}::uuid, ${outcome}, ${anomalyCode ?? null}
    )
  `;
}

export async function isTerminalProviderEvent(transaction: postgres.TransactionSql, eventId: string) {
  const rows = await transaction<{ provider_event_id: string }[]>`
    select provider_event_id from commerce.provider_events
    where provider = 'stripe' and environment = ${commerceTestOffer.environment} and provider_event_id = ${eventId}
  `;
  return rows.length === 1;
}

export async function grantVerifiedPurchaseInTransaction(transaction: postgres.TransactionSql, orderId: string, paymentAttemptId: string) {
  const order = (await transaction<LockedOrder[]>`
    select id, offer_id, product_id, version_id, amount_minor, currency, quantity, environment,
           fulfillment_status, fulfilled_at, recovery_email
    from commerce.orders where id = ${orderId}::uuid for update
  `)[0];
  const attempt = (await transaction<LockedAttempt[]>`
    select id, order_id, provider_session_reference, provider_payment_reference, attempt_state
    from commerce.payment_attempts where id = ${paymentAttemptId}::uuid for update
  `)[0];
  if (!attempt || !order || attempt.order_id !== order.id || attempt.attempt_state !== "paid") throw new Error("verified payment evidence is required for entitlement grant");
  const existing = (await transaction<Entitlement[]>`
    select id, source_payment_attempt_id from commerce.entitlements where order_id = ${order.id}::uuid for update
  `)[0];
  if (existing) {
    if (existing.source_payment_attempt_id !== attempt.id) throw new Error("conflicting entitlement source");
    return { entitlementId: existing.id, reused: true };
  }
  const inserted = (await transaction<{ id: string }[]>`
    insert into commerce.entitlements (order_id, product_id, version_id, source_payment_attempt_id, grant_state)
    values (${order.id}::uuid, ${order.product_id}, ${order.version_id}, ${attempt.id}::uuid, 'active')
    returning id
  `)[0];
  if (!inserted) throw new Error("verified entitlement was not created");
  return { entitlementId: inserted.id, reused: false };
}

export async function processVerifiedStripeEventInTransaction(transaction: postgres.TransactionSql, evidence: VerifiedStripeEvidence, attemptId: string | null): Promise<ProviderOutcome> {
  if (await isTerminalProviderEvent(transaction, evidence.eventId)) return "already_fulfilled";
  if (!attemptId) {
    await insertProviderEvent(transaction, evidence, null, "attention", "unknown_session");
    return "attention";
  }

  const attempted = (await transaction<LockedAttempt[]>`
    select id, order_id, provider_session_reference, provider_payment_reference, attempt_state
    from commerce.payment_attempts where id = ${attemptId}::uuid
  `)[0];
  if (!attempted) {
    await insertProviderEvent(transaction, evidence, null, "attention", "unknown_session");
    return "attention";
  }
  const order = (await transaction<LockedOrder[]>`
    select id, offer_id, product_id, version_id, amount_minor, currency, quantity, environment,
           fulfillment_status, fulfilled_at, recovery_email
    from commerce.orders where id = ${attempted.order_id}::uuid for update
  `)[0];
  const attempt = (await transaction<LockedAttempt[]>`
    select id, order_id, provider_session_reference, provider_payment_reference, attempt_state
    from commerce.payment_attempts where id = ${attempted.id}::uuid for update
  `)[0];
  if (!order || !attempt) throw new Error("payment attempt disappeared during fulfillment");
  // A concurrent delivery can have inserted its terminal marker while this
  // delivery waited for the canonical order/attempt lock pair.
  if (await isTerminalProviderEvent(transaction, evidence.eventId)) return "already_fulfilled";

  const anomaly = anomalyForEvidence(evidence, order, attempt);
  if (anomaly) {
    await transaction`update commerce.orders set fulfillment_status = 'attention' where id = ${order.id}::uuid`;
    await insertProviderEvent(transaction, evidence, attempt.id, "attention", anomaly);
    return "attention";
  }

  if (evidence.session.paymentStatus !== "paid") {
    if (attempt.attempt_state === "paid") {
      await insertProviderEvent(transaction, evidence, attempt.id, "already_fulfilled");
      return "already_fulfilled";
    }
    const outcome = observationOutcome(evidence.eventType);
    const state = outcome === "observed_failed" ? "failed" : outcome === "observed_expired" ? "expired" : "pending";
    await transaction`
      update commerce.payment_attempts
      set attempt_state = ${state}, provider_payment_status = ${evidence.session.paymentStatus}
      where id = ${attempt.id}::uuid
    `;
    await insertProviderEvent(transaction, evidence, attempt.id, outcome);
    return outcome;
  }

  if (!evidence.session.paymentIntentId) {
    await transaction`update commerce.orders set fulfillment_status = 'attention' where id = ${order.id}::uuid`;
    await insertProviderEvent(transaction, evidence, attempt.id, "attention", "payment_status_mismatch");
    return "attention";
  }
  if (attempt.provider_payment_reference && attempt.provider_payment_reference !== evidence.session.paymentIntentId) {
    await transaction`update commerce.orders set fulfillment_status = 'attention' where id = ${order.id}::uuid`;
    await insertProviderEvent(transaction, evidence, attempt.id, "attention", "metadata_mismatch");
    return "attention";
  }

  await transaction`
    update commerce.payment_attempts
    set attempt_state = 'paid', provider_payment_reference = ${evidence.session.paymentIntentId},
        observed_amount_minor = ${evidence.session.amountTotal}, observed_currency = ${commerceTestOffer.currency},
        provider_payment_status = 'paid', verified_at = coalesce(verified_at, now())
    where id = ${attempt.id}::uuid
  `;
  const existing = (await transaction<Entitlement[]>`
    select id, source_payment_attempt_id from commerce.entitlements where order_id = ${order.id}::uuid for update
  `)[0];
  if (existing && existing.source_payment_attempt_id !== attempt.id) {
    await transaction`update commerce.orders set fulfillment_status = 'attention' where id = ${order.id}::uuid`;
    await insertProviderEvent(transaction, evidence, attempt.id, "attention", "second_paid_attempt");
    return "attention";
  }
  await grantVerifiedPurchaseInTransaction(transaction, order.id, attempt.id);
  const recoveryEmail = evidence.session.recoveryEmail?.trim() || null;
  await transaction`
    update commerce.orders
    set fulfillment_status = case when fulfillment_status = 'attention' then 'attention' else 'fulfilled' end,
        fulfilled_at = coalesce(fulfilled_at, now()),
        recovery_email = coalesce(recovery_email, ${recoveryEmail})
    where id = ${order.id}::uuid
  `;
  await insertProviderEvent(transaction, evidence, attempt.id, existing ? "already_fulfilled" : "fulfilled");
  return existing ? "already_fulfilled" : "fulfilled";
}
