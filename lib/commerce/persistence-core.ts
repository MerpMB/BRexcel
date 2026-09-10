import type postgres from "postgres";
import { commerceTestOffer, hashGuestPurchaseCapability, type CreateCommerceAttemptRequest, type PersistedCommerceAttempt, validateCommerceAttemptRequest } from "./contract";

type OrderRow = { id: string };
type AttemptRow = { id: string; order_id: string; provider_session_reference: string | null };
type EntitlementRow = { id: string };

/**
 * Persists only the fixed internal test offer. It accepts a transaction-capable SQL
 * handle so the server-only entry point owns connection creation while integration
 * tests can exercise the same atomic SQL against a disposable local database.
 */
export async function persistTrustedCommerceAttempt(sql: postgres.Sql, request: CreateCommerceAttemptRequest): Promise<PersistedCommerceAttempt> {
  validateCommerceAttemptRequest(request);
  return sql.begin((transaction) => persistTrustedCommerceAttemptInTransaction(transaction, request));
}

export async function persistTrustedCommerceAttemptInTransaction(transaction: postgres.TransactionSql, request: CreateCommerceAttemptRequest): Promise<PersistedCommerceAttempt> {
  validateCommerceAttemptRequest(request);
  const capabilityDigest = request.guestCapability ? hashGuestPurchaseCapability(request.guestCapability) : null;
  const insertedOrder = await transaction<OrderRow[]>`
      insert into commerce.orders (
        creation_identity, offer_id, product_id, title, amount_minor, currency,
        quantity, environment, offer_state, guest_capability_digest
      ) values (
        ${request.creationIdentity}::uuid, ${commerceTestOffer.offerId}, ${commerceTestOffer.productId},
        ${commerceTestOffer.title}, ${commerceTestOffer.amountMinor}, ${commerceTestOffer.currency},
        ${commerceTestOffer.quantity}, ${commerceTestOffer.environment}, ${commerceTestOffer.offerState}, ${capabilityDigest}
      )
      on conflict (creation_identity) do nothing
      returning id
  `;
  const order = insertedOrder[0] ?? (await transaction<OrderRow[]>`
      select id from commerce.orders where creation_identity = ${request.creationIdentity}::uuid for update
  `)[0];
  if (!order) throw new Error("order could not be created or recovered");

  const insertedAttempt = await transaction<AttemptRow[]>`
      insert into commerce.payment_attempts (
        order_id, provider, environment, idempotency_key, provider_session_reference, attempt_state
      ) values (
        ${order.id}::uuid, 'stripe', ${commerceTestOffer.environment}, ${request.idempotencyKey}::uuid,
        ${request.providerSessionReference ?? null}, 'created'
      )
      on conflict (provider, environment, idempotency_key) do nothing
      returning id, order_id, provider_session_reference
  `;
  const attempt = insertedAttempt[0] ?? (await transaction<AttemptRow[]>`
      select id, order_id, provider_session_reference from commerce.payment_attempts
      where provider = 'stripe' and environment = ${commerceTestOffer.environment}
        and idempotency_key = ${request.idempotencyKey}::uuid
      for update
  `)[0];
  if (!attempt) throw new Error("payment attempt could not be created or recovered");
  if (attempt.order_id !== order.id) throw new Error("idempotency key belongs to another order");

  let entitlementId: string | undefined;
  if (request.grantEntitlement) {
    const entitlement = await transaction<EntitlementRow[]>`
        insert into commerce.entitlements (order_id, product_id, grant_state)
        values (${order.id}::uuid, ${commerceTestOffer.productId}, 'active')
        on conflict (order_id, product_id) do update set grant_state = commerce.entitlements.grant_state
        returning id
    `;
    entitlementId = entitlement[0]?.id;
  }

  return { orderId: order.id, attemptId: attempt.id, providerSessionReference: attempt.provider_session_reference ?? undefined, entitlementId, reused: insertedAttempt.length === 0 };
}

export async function bindProviderSessionReferenceInTransaction(transaction: postgres.TransactionSql, attemptId: string, providerSessionReference: string) {
  if (!/^cs_test_[A-Za-z0-9_-]{8,}$/i.test(providerSessionReference)) throw new Error("provider session reference must be a Stripe test session");
  const attempt = (await transaction<AttemptRow[]>`
    select id, order_id, provider_session_reference from commerce.payment_attempts where id = ${attemptId}::uuid for update
  `)[0];
  if (!attempt) throw new Error("Payment attempt not found");
  if (attempt.provider_session_reference === providerSessionReference) return { providerSessionReference, reused: true };
  if (attempt.provider_session_reference !== null) throw new Error("Payment attempt is already bound to another provider session");
  const bound = (await transaction<AttemptRow[]>`
    update commerce.payment_attempts set provider_session_reference = ${providerSessionReference}
    where id = ${attemptId}::uuid and provider_session_reference is null
    returning id, order_id, provider_session_reference
  `)[0];
  if (!bound) throw new Error("Provider session binding was not applied");
  return { providerSessionReference: bound.provider_session_reference!, reused: false };
}
