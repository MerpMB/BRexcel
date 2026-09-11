import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { bindProviderSessionReferenceInTransaction, persistTrustedCommerceAttemptInTransaction } from "../lib/commerce/persistence-core";
import { type VerifiedStripeEvidence, grantVerifiedPurchaseInTransaction, processVerifiedStripeEventInTransaction } from "../lib/commerce/fulfillment-core";

function connectionString() {
  const value = process.env.COMMERCE_DATABASE_URL ?? process.env.DB_URL;
  if (!value) throw new Error("Fulfillment integration requires COMMERCE_DATABASE_URL or DB_URL for an already-migrated real PostgreSQL database.");
  return value;
}

function sessionReference() {
  return `cs_test_${randomUUID().replaceAll("-", "")}`;
}

function paymentReference() {
  return `pi_test_${randomUUID().replaceAll("-", "")}`;
}

async function asRuntime<T>(sql: postgres.Sql, operation: (transaction: postgres.TransactionSql) => Promise<T>) {
  return sql.begin(async (transaction) => {
    await transaction`set local role commerce_runtime`;
    return operation(transaction);
  });
}

async function createBoundAttempt(sql: postgres.Sql) {
  return asRuntime(sql, async (transaction) => {
    const persisted = await persistTrustedCommerceAttemptInTransaction(transaction, {
      creationIdentity: randomUUID(),
      idempotencyKey: randomUUID(),
    });
    const sessionId = sessionReference();
    await bindProviderSessionReferenceInTransaction(transaction, persisted.attemptId, sessionId);
    return { ...persisted, sessionId };
  });
}

function paidEvidence(eventId: string, orderId: string, attemptId: string, sessionId: string): VerifiedStripeEvidence {
  return {
    eventId,
    eventType: "checkout.session.completed",
    eventSessionId: sessionId,
    eventLivemode: false,
    accountId: "acct_t07_integration",
    session: {
      id: sessionId,
      livemode: false,
      mode: "payment",
      paymentStatus: "paid",
      paymentIntentId: paymentReference(),
      amountTotal: 4900,
      currency: "thb",
      metadataOrderId: orderId,
      metadataAttemptId: attemptId,
      recoveryEmail: "  recovery@example.test  ",
      shippingAmount: 0,
    },
    lineItems: [{ quantity: 1, unitAmount: 4900, amountTotal: 4900, currency: "thb", amountDiscount: 0, amountTax: 0 }],
    lineItemsComplete: true,
  };
}

async function count(sql: postgres.Sql, table: "entitlements" | "provider_events", orderId?: string) {
  const rows = orderId
    ? await sql<{ count: string }[]>`select count(*)::text as count from commerce.${sql(table)} where order_id = ${orderId}::uuid`
    : await sql<{ count: string }[]>`select count(*)::text as count from commerce.${sql(table)}`;
  return Number(rows[0]?.count ?? 0);
}

async function countProviderEvents(sql: postgres.Sql, eventIds: string[]) {
  const [row] = await sql<{ count: string }[]>`
    select count(*)::text as count from commerce.provider_events
    where provider = 'stripe' and environment = 'test' and provider_event_id = any(${eventIds})
  `;
  return Number(row?.count ?? 0);
}

async function main() {
  const sql = postgres(connectionString(), { max: 12, prepare: true });
  try {
    const first = await createBoundAttempt(sql);
    const firstEvidence = paidEvidence(`evt_t07_${randomUUID().replaceAll("-", "")}`, first.orderId, first.attemptId, first.sessionId);
    assert.equal(await asRuntime(sql, (transaction) => processVerifiedStripeEventInTransaction(transaction, firstEvidence, first.attemptId)), "fulfilled");
    // Simulates a lost HTTP acknowledgement: the commit happened, then the
    // caller resends the exact provider event identity.
    assert.equal(await asRuntime(sql, (transaction) => processVerifiedStripeEventInTransaction(transaction, firstEvidence, first.attemptId)), "already_fulfilled");
    assert.equal(await count(sql, "entitlements", first.orderId), 1, "same event grants one entitlement");
    assert.equal(await count(sql, "provider_events"), 1, "same event stores one terminal event");

    const [paidAttempt] = await sql<{ attempt_state: string; provider_payment_reference: string; verified_at: string; observed_amount_minor: number; observed_currency: string }[]>`
      select attempt_state, provider_payment_reference, verified_at, observed_amount_minor, observed_currency
      from commerce.payment_attempts where id = ${first.attemptId}::uuid
    `;
    assert.deepEqual({ state: paidAttempt?.attempt_state, amount: paidAttempt?.observed_amount_minor, currency: paidAttempt?.observed_currency, paid: Boolean(paidAttempt?.provider_payment_reference), verified: Boolean(paidAttempt?.verified_at) }, { state: "paid", amount: 4900, currency: "THB", paid: true, verified: true });
    const [firstOrder] = await sql<{ fulfillment_status: string; recovery_email: string }[]>`select fulfillment_status, recovery_email from commerce.orders where id = ${first.orderId}::uuid`;
    assert.deepEqual(firstOrder, { fulfillment_status: "fulfilled", recovery_email: "recovery@example.test" });

    const secondEvent = paidEvidence(`evt_t07_${randomUUID().replaceAll("-", "")}`, first.orderId, first.attemptId, first.sessionId);
    secondEvent.session.paymentIntentId = paidAttempt?.provider_payment_reference ?? null;
    assert.equal(await asRuntime(sql, (transaction) => processVerifiedStripeEventInTransaction(transaction, secondEvent, first.attemptId)), "already_fulfilled");
    assert.equal(await count(sql, "entitlements", first.orderId), 1, "distinct events for one paid Session do not duplicate grants");

    const concurrentDistinctA = paidEvidence(`evt_t07_${randomUUID().replaceAll("-", "")}`, first.orderId, first.attemptId, first.sessionId);
    const concurrentDistinctB = paidEvidence(`evt_t07_${randomUUID().replaceAll("-", "")}`, first.orderId, first.attemptId, first.sessionId);
    concurrentDistinctA.session.paymentIntentId = paidAttempt?.provider_payment_reference ?? null;
    concurrentDistinctB.session.paymentIntentId = paidAttempt?.provider_payment_reference ?? null;
    const distinctResults = await Promise.all([
      asRuntime(sql, (transaction) => processVerifiedStripeEventInTransaction(transaction, concurrentDistinctA, first.attemptId)),
      asRuntime(sql, (transaction) => processVerifiedStripeEventInTransaction(transaction, concurrentDistinctB, first.attemptId)),
    ]);
    assert.deepEqual(distinctResults.sort(), ["already_fulfilled", "already_fulfilled"], "distinct paid event IDs for one Session converge without duplicate grants");
    assert.equal(await countProviderEvents(sql, [concurrentDistinctA.eventId, concurrentDistinctB.eventId]), 2, "each distinct terminal event is retained");
    assert.equal(await count(sql, "entitlements", first.orderId), 1);

    const negative = paidEvidence(`evt_t07_${randomUUID().replaceAll("-", "")}`, first.orderId, first.attemptId, first.sessionId);
    negative.eventType = "checkout.session.expired";
    negative.session.paymentStatus = "unpaid";
    negative.session.paymentIntentId = null;
    assert.equal(await asRuntime(sql, (transaction) => processVerifiedStripeEventInTransaction(transaction, negative, first.attemptId)), "already_fulfilled");
    const [preserved] = await sql<{ attempt_state: string }[]>`select attempt_state from commerce.payment_attempts where id = ${first.attemptId}::uuid`;
    assert.equal(preserved?.attempt_state, "paid", "negative events never regress paid evidence");

    const unpaid = await createBoundAttempt(sql);
    const unpaidEvidence = paidEvidence(`evt_t07_${randomUUID().replaceAll("-", "")}`, unpaid.orderId, unpaid.attemptId, unpaid.sessionId);
    unpaidEvidence.session.paymentStatus = "unpaid";
    unpaidEvidence.session.paymentIntentId = null;
    assert.equal(await asRuntime(sql, (transaction) => processVerifiedStripeEventInTransaction(transaction, unpaidEvidence, unpaid.attemptId)), "observed_unpaid");
    assert.equal(await count(sql, "entitlements", unpaid.orderId), 0, "unpaid observation never grants");
    const laterPaid = paidEvidence(`evt_t07_${randomUUID().replaceAll("-", "")}`, unpaid.orderId, unpaid.attemptId, unpaid.sessionId);
    assert.equal(await asRuntime(sql, (transaction) => processVerifiedStripeEventInTransaction(transaction, laterPaid, unpaid.attemptId)), "fulfilled");
    assert.equal(await count(sql, "entitlements", unpaid.orderId), 1, "fresh paid truth after unpaid grants once");

    const mismatch = await createBoundAttempt(sql);
    const mismatchEvidence = paidEvidence(`evt_t07_${randomUUID().replaceAll("-", "")}`, mismatch.orderId, mismatch.attemptId, mismatch.sessionId);
    mismatchEvidence.session.amountTotal = 1;
    assert.equal(await asRuntime(sql, (transaction) => processVerifiedStripeEventInTransaction(transaction, mismatchEvidence, mismatch.attemptId)), "attention");
    assert.equal(await count(sql, "entitlements", mismatch.orderId), 0, "invalid provider truth never grants");

    const beforeGrant = await createBoundAttempt(sql);
    const beforeGrantEvidence = paidEvidence(`evt_t07_${randomUUID().replaceAll("-", "")}`, beforeGrant.orderId, beforeGrant.attemptId, beforeGrant.sessionId);
    await sql.unsafe(`
      create function commerce.t07_fail_before_entitlement_grant() returns trigger
      language plpgsql as $$ begin raise exception 't07 before grant sentinel'; end $$;
      create trigger aa_t07_fail_before_entitlement_grant
      before insert on commerce.entitlements for each row
      execute function commerce.t07_fail_before_entitlement_grant();
    `);
    await assert.rejects(asRuntime(sql, (transaction) => processVerifiedStripeEventInTransaction(transaction, beforeGrantEvidence, beforeGrant.attemptId)), /before grant sentinel/);
    await sql`drop trigger aa_t07_fail_before_entitlement_grant on commerce.entitlements`;
    await sql`drop function commerce.t07_fail_before_entitlement_grant()`;
    assert.equal(await count(sql, "entitlements", beforeGrant.orderId), 0, "failure before grant leaves no entitlement");
    const [beforeGrantAttempt] = await sql<{ attempt_state: string; verified_at: string | null }[]>`select attempt_state, verified_at from commerce.payment_attempts where id = ${beforeGrant.attemptId}::uuid`;
    assert.deepEqual(beforeGrantAttempt, { attempt_state: "created", verified_at: null }, "failure before grant rolls back paid evidence");
    assert.equal(await countProviderEvents(sql, [beforeGrantEvidence.eventId]), 0, "failure before grant leaves no terminal marker");
    assert.equal(await asRuntime(sql, (transaction) => processVerifiedStripeEventInTransaction(transaction, beforeGrantEvidence, beforeGrant.attemptId)), "fulfilled", "retry after before-grant rollback succeeds once");

    const rollback = await createBoundAttempt(sql);
    const rollbackEvidence = paidEvidence(`evt_t07_${randomUUID().replaceAll("-", "")}`, rollback.orderId, rollback.attemptId, rollback.sessionId);
    await assert.rejects(asRuntime(sql, async (transaction) => {
      await processVerifiedStripeEventInTransaction(transaction, rollbackEvidence, rollback.attemptId);
      const [inserted] = await transaction<{ count: string }[]>`select count(*)::text as count from commerce.entitlements where order_id = ${rollback.orderId}::uuid`;
      assert.equal(inserted?.count, "1", "rollback sentinel executes after entitlement insert");
      throw new Error("rollback sentinel after fulfillment");
    }));
    assert.equal(await count(sql, "entitlements", rollback.orderId), 0, "rollback leaves no entitlement");
    const [rolledBackAttempt] = await sql<{ attempt_state: string; verified_at: string | null }[]>`select attempt_state, verified_at from commerce.payment_attempts where id = ${rollback.attemptId}::uuid`;
    assert.deepEqual(rolledBackAttempt, { attempt_state: "created", verified_at: null }, "after-insert rollback leaves no paid evidence");
    assert.equal(await countProviderEvents(sql, [rollbackEvidence.eventId]), 0, "after-insert rollback leaves no terminal marker");
    assert.equal(await asRuntime(sql, (transaction) => processVerifiedStripeEventInTransaction(transaction, rollbackEvidence, rollback.attemptId)), "fulfilled", "rolled-back event is processable again");

    const concurrent = await createBoundAttempt(sql);
    const concurrentEvidence = paidEvidence(`evt_t07_${randomUUID().replaceAll("-", "")}`, concurrent.orderId, concurrent.attemptId, concurrent.sessionId);
    const concurrentResults = await Promise.all([
      asRuntime(sql, (transaction) => processVerifiedStripeEventInTransaction(transaction, concurrentEvidence, concurrent.attemptId)),
      asRuntime(sql, (transaction) => processVerifiedStripeEventInTransaction(transaction, concurrentEvidence, concurrent.attemptId)),
    ]);
    assert.deepEqual(concurrentResults.sort(), ["already_fulfilled", "fulfilled"], "concurrent duplicate event deliveries converge");
    assert.equal(await count(sql, "entitlements", concurrent.orderId), 1);

    const secondAttempt = await asRuntime(sql, async (transaction) => {
      const id = (await transaction<{ id: string }[]>`
        insert into commerce.payment_attempts (order_id, provider, environment, idempotency_key, provider_session_reference, attempt_state)
        values (${first.orderId}::uuid, 'stripe', 'test', ${randomUUID()}::uuid, ${sessionReference()}, 'created') returning id
      `)[0]?.id;
      if (!id) throw new Error("second payment attempt was not created");
      return id;
    });
    const [secondAttemptSession] = await sql<{ provider_session_reference: string }[]>`select provider_session_reference from commerce.payment_attempts where id = ${secondAttempt}::uuid`;
    const secondPaid = paidEvidence(`evt_t07_${randomUUID().replaceAll("-", "")}`, first.orderId, secondAttempt, secondAttemptSession!.provider_session_reference);
    assert.equal(await asRuntime(sql, (transaction) => processVerifiedStripeEventInTransaction(transaction, secondPaid, secondAttempt)), "attention");
    assert.equal(await count(sql, "entitlements", first.orderId), 1, "a second independently paid attempt never grants twice");
    const [attentionOrder] = await sql<{ fulfillment_status: string }[]>`select fulfillment_status from commerce.orders where id = ${first.orderId}::uuid`;
    assert.equal(attentionOrder?.fulfillment_status, "attention");

    await assert.rejects(sql`update commerce.orders set amount_minor = 1 where id = ${first.orderId}::uuid`, "snapshot facts remain immutable");
    await assert.rejects(sql`update commerce.entitlements set source_payment_attempt_id = ${secondAttempt}::uuid where order_id = ${first.orderId}::uuid`, "entitlement provenance remains immutable");
    await assert.rejects(asRuntime(sql, (transaction) => grantVerifiedPurchaseInTransaction(transaction, first.orderId, secondAttempt)), /conflicting entitlement source/, "conflicting verified provenance is rejected");
    await assert.rejects(sql`update commerce.orders set fulfilled_at = now() where id = ${first.orderId}::uuid`, "fulfilled timestamp cannot be rewritten");
    await assert.rejects(sql`update commerce.orders set recovery_email = 'replacement@example.test' where id = ${first.orderId}::uuid`, "recovery destination cannot be replaced");
    await assert.rejects(sql`update commerce.orders set fulfillment_status = 'pending' where id = ${first.orderId}::uuid`, "attention cannot regress");
    await assert.rejects(sql`update commerce.payment_attempts set attempt_state = 'failed' where id = ${first.attemptId}::uuid`, "paid state cannot regress");
    await assert.rejects(sql`update commerce.payment_attempts set provider_payment_reference = 'pi_test_rewritten' where id = ${first.attemptId}::uuid`, "provider payment reference cannot change");
    const incompletePaid = await createBoundAttempt(sql);
    await assert.rejects(sql`update commerce.payment_attempts set attempt_state = 'paid' where id = ${incompletePaid.attemptId}::uuid`, "incomplete paid evidence is rejected");

    const [providerSecurity] = await sql<{ rls: boolean; public_select: boolean; runtime_select: boolean; runtime_insert: boolean; runtime_update: boolean; runtime_delete: boolean }[]>`
      select c.relrowsecurity as rls,
        has_table_privilege('public', 'commerce.provider_events', 'select') as public_select,
        has_table_privilege('commerce_runtime', 'commerce.provider_events', 'select') as runtime_select,
        has_table_privilege('commerce_runtime', 'commerce.provider_events', 'insert') as runtime_insert,
        has_table_privilege('commerce_runtime', 'commerce.provider_events', 'update') as runtime_update,
        has_table_privilege('commerce_runtime', 'commerce.provider_events', 'delete') as runtime_delete
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'commerce' and c.relname = 'provider_events'
    `;
    assert.deepEqual(providerSecurity, { rls: true, public_select: false, runtime_select: true, runtime_insert: true, runtime_update: false, runtime_delete: false });
    for (const role of ["anon", "authenticated", "service_role"]) {
      const roleExists = (await sql<{ exists: boolean }[]>`select exists(select 1 from pg_roles where rolname = ${role}) as exists`)[0]?.exists;
      if (roleExists) await assert.rejects(sql.begin(async (transaction) => {
        await transaction.unsafe(`set local role ${role}`);
        await transaction`select * from commerce.provider_events limit 1`;
      }), `${role} cannot read provider events`);
    }
    await assert.rejects(asRuntime(sql, async (transaction) => transaction`update commerce.provider_events set outcome = 'attention' where false`), "runtime cannot update provider events");
    console.log("Fulfillment integration passed: real PostgreSQL transactions, rollback seams, duplicate convergence, private provider-event security, monotonic evidence, and one-entitlement invariants.");
  } finally {
    await sql.end({ timeout: 5 });
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Fulfillment integration failed");
  process.exitCode = 1;
});
