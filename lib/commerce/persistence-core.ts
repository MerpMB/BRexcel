import type postgres from "postgres";
import { commerceTestOffer, hashGuestPurchaseCapability, type CreateCommerceAttemptRequest, type PersistedCommerceAttempt, validateCommerceAttemptRequest } from "./contract";

type OrderRow = { id: string };
type AttemptRow = { id: string; order_id: string };
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
      returning id, order_id
  `;
  const attempt = insertedAttempt[0] ?? (await transaction<AttemptRow[]>`
      select id, order_id from commerce.payment_attempts
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

  return { orderId: order.id, attemptId: attempt.id, entitlementId, reused: insertedAttempt.length === 0 };
}
