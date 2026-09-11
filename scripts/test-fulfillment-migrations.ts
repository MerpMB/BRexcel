import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import postgres from "postgres";

function connectionString() {
  const value = process.env.COMMERCE_DATABASE_URL ?? process.env.DB_URL;
  if (!value) throw new Error("T07 migration integration requires COMMERCE_DATABASE_URL or DB_URL for disposable local PostgreSQL.");
  return value;
}

const t05 = readFileSync("supabase/migrations/20260910142359_create_commerce_persistence.sql", "utf8");
const t07 = readFileSync("supabase/migrations/20260911111516_t07_verified_payment_fulfillment.sql", "utf8");
const t07HardenedEvidence = readFileSync("supabase/migrations/20260911145147_t07_harden_verified_payment_evidence.sql", "utf8");

async function resetToT05(sql: postgres.Sql) {
  await sql`drop schema if exists commerce cascade`;
  await sql.unsafe(t05);
}

async function insertT06Order(sql: postgres.Sql) {
  const [order] = await sql<{ id: string }[]>`
    insert into commerce.orders (
      creation_identity, offer_id, product_id, title, amount_minor, currency, quantity, environment, offer_state
    ) values (
      ${randomUUID()}::uuid, 'offer_test_freelancer_cashflow_v1', 'prd_test_freelancer_cashflow_v1',
      'Freelancer Cashflow Planner — internal commerce test offer', 4900, 'THB', 1, 'test', 'test_only'
    ) returning id
  `;
  if (!order) throw new Error("T06 test order was not created");
  return order.id;
}

async function insertCreatedAttempt(sql: postgres.Sql, orderId: string, suffix: string) {
  const [attempt] = await sql<{ id: string }[]>`
    insert into commerce.payment_attempts (order_id, provider, environment, idempotency_key, provider_session_reference, attempt_state)
    values (${orderId}::uuid, 'stripe', 'test', ${randomUUID()}::uuid, ${`cs_test_harden_${suffix}`}, 'created')
    returning id
  `;
  if (!attempt) throw new Error("hardening test payment attempt was not created");
  return attempt.id;
}

async function main() {
  const sql = postgres(connectionString(), { max: 2, prepare: true });
  try {
    assert.equal(t07.includes("IS NOT DISTINCT FROM"), false, "original applied T07 migration remains unchanged");
    for (const fragment of ["drop constraint if exists payment_attempts_paid_evidence_check", "observed_amount_minor is not distinct from 4900", "observed_currency is not distinct from 'THB'", "provider_payment_status is not distinct from 'paid'", "provider_payment_reference is null", "verified_at is null", "T07 hardening refused"]) assert.equal(t07HardenedEvidence.includes(fragment), true, `missing hardening control: ${fragment}`);
    const [fresh] = await sql<{ provider_events_exists: boolean; version_id_exists: boolean; paid_evidence_constraint_exists: boolean }[]>`
      select
        to_regclass('commerce.provider_events') is not null as provider_events_exists,
        exists(select 1 from information_schema.columns where table_schema = 'commerce' and table_name = 'orders' and column_name = 'version_id') as version_id_exists,
        exists(select 1 from pg_constraint c join pg_class r on r.oid = c.conrelid join pg_namespace n on n.oid = r.relnamespace where n.nspname = 'commerce' and r.relname = 'payment_attempts' and c.conname = 'payment_attempts_paid_evidence_check') as paid_evidence_constraint_exists
    `;
    assert.deepEqual(fresh, { provider_events_exists: true, version_id_exists: true, paid_evidence_constraint_exists: true }, "fresh local reset applies T05, T07, and hardening");

    await resetToT05(sql);
    const upgradeOrderId = await insertT06Order(sql);
    const [upgradeAttempt] = await sql<{ id: string }[]>`
      insert into commerce.payment_attempts (order_id, provider, environment, idempotency_key, provider_session_reference, attempt_state)
      values (${upgradeOrderId}::uuid, 'stripe', 'test', ${randomUUID()}::uuid, 'cs_test_t07upgrade', 'created') returning id
    `;
    await sql.unsafe(t07);
    const [upgraded] = await sql<{ version_id: string; amount_minor: number; currency: string; quantity: number; provider_events_exists: boolean }[]>`
      select o.version_id, o.amount_minor, o.currency, o.quantity,
        to_regclass('commerce.provider_events') is not null as provider_events_exists
      from commerce.orders o where o.id = ${upgradeOrderId}::uuid
    `;
    assert.deepEqual(upgraded, { version_id: "freelancer-cashflow-v1", amount_minor: 4900, currency: "THB", quantity: 1, provider_events_exists: true }, "T06 order survives T07 with only the approved version backfill");
    const [survivedAttempt] = await sql<{ id: string; attempt_state: string }[]>`select id, attempt_state from commerce.payment_attempts where id = ${upgradeAttempt!.id}::uuid`;
    assert.deepEqual(survivedAttempt, { id: upgradeAttempt!.id, attempt_state: "created" }, "T06 attempt survives unchanged");

    await sql`
      update commerce.payment_attempts
      set attempt_state = 'paid', provider_payment_reference = 'pi_test_t07_upgrade',
          observed_amount_minor = 4900, observed_currency = 'THB',
          provider_payment_status = 'paid', verified_at = now()
      where id = ${upgradeAttempt!.id}::uuid
    `;
    await sql.unsafe(t07HardenedEvidence);
    const [hardenedUpgrade] = await sql<{ attempt_state: string; provider_payment_reference: string; observed_amount_minor: number; observed_currency: string; provider_payment_status: string; verified_at: string | null }[]>`
      select attempt_state, provider_payment_reference, observed_amount_minor, observed_currency, provider_payment_status, verified_at
      from commerce.payment_attempts where id = ${upgradeAttempt!.id}::uuid
    `;
    assert.deepEqual({ ...hardenedUpgrade, verified_at: Boolean(hardenedUpgrade?.verified_at) }, { attempt_state: "paid", provider_payment_reference: "pi_test_t07_upgrade", observed_amount_minor: 4900, observed_currency: "THB", provider_payment_status: "paid", verified_at: true }, "forward hardening preserves complete existing paid evidence");
    const invalidPaidUpdates = [
      ["null payment reference", "provider_payment_reference = null, observed_amount_minor = 4900, observed_currency = 'THB', provider_payment_status = 'paid', verified_at = now()"],
      ["null amount", "provider_payment_reference = 'pi_test_null_amount', observed_amount_minor = null, observed_currency = 'THB', provider_payment_status = 'paid', verified_at = now()"],
      ["null currency", "provider_payment_reference = 'pi_test_null_currency', observed_amount_minor = 4900, observed_currency = null, provider_payment_status = 'paid', verified_at = now()"],
      ["null payment status", "provider_payment_reference = 'pi_test_null_status', observed_amount_minor = 4900, observed_currency = 'THB', provider_payment_status = null, verified_at = now()"],
      ["null verification time", "provider_payment_reference = 'pi_test_null_verified', observed_amount_minor = 4900, observed_currency = 'THB', provider_payment_status = 'paid', verified_at = null"],
      ["wrong amount", "provider_payment_reference = 'pi_test_wrong_amount', observed_amount_minor = 1, observed_currency = 'THB', provider_payment_status = 'paid', verified_at = now()"],
      ["wrong currency", "provider_payment_reference = 'pi_test_wrong_currency', observed_amount_minor = 4900, observed_currency = 'USD', provider_payment_status = 'paid', verified_at = now()"],
      ["wrong payment status", "provider_payment_reference = 'pi_test_wrong_status', observed_amount_minor = 4900, observed_currency = 'THB', provider_payment_status = 'unpaid', verified_at = now()"],
    ] as const;
    for (const [label, assignments] of invalidPaidUpdates) {
      const attemptId = await insertCreatedAttempt(sql, upgradeOrderId, label.replaceAll(" ", "_"));
      await assert.rejects(sql.unsafe(`update commerce.payment_attempts set attempt_state = 'paid', ${assignments} where id = '${attemptId}'::uuid`), `hardening rejects ${label} when marking an attempt paid`);
    }
    const completeEvidence = {
      provider_payment_reference: hardenedUpgrade!.provider_payment_reference,
      observed_amount_minor: hardenedUpgrade!.observed_amount_minor,
      observed_currency: hardenedUpgrade!.observed_currency,
      provider_payment_status: hardenedUpgrade!.provider_payment_status,
      verified_at: hardenedUpgrade!.verified_at,
    };
    for (const field of ["provider_payment_reference", "observed_amount_minor", "observed_currency", "provider_payment_status", "verified_at"] as const) {
      await assert.rejects(sql.unsafe(`update commerce.payment_attempts set ${field} = null where id = '${upgradeAttempt!.id}'::uuid`), `hardening rejects clearing ${field} from a paid attempt`);
      const [preserved] = await sql<typeof completeEvidence[]>`
        select provider_payment_reference, observed_amount_minor, observed_currency, provider_payment_status, verified_at
        from commerce.payment_attempts where id = ${upgradeAttempt!.id}::uuid
      `;
      assert.deepEqual(preserved, completeEvidence, `failed ${field} clear preserves complete verified evidence`);
    }

    await resetToT05(sql);
    const authorizedOrderId = await insertT06Order(sql);
    await sql`
      insert into commerce.payment_attempts (order_id, provider, environment, idempotency_key, attempt_state)
      values (${authorizedOrderId}::uuid, 'stripe', 'test', ${randomUUID()}::uuid, 'authorized')
    `;
    await assert.rejects(sql.unsafe(t07), /legacy authorized payment attempts require lead disposition/, "T07 refuses authorized legacy attempts");

    await resetToT05(sql);
    const entitledOrderId = await insertT06Order(sql);
    await sql`
      insert into commerce.entitlements (order_id, product_id, grant_state)
      values (${entitledOrderId}::uuid, 'prd_test_freelancer_cashflow_v1', 'active')
    `;
    await assert.rejects(sql.unsafe(t07), /legacy entitlements lack verified payment provenance/, "T07 refuses primitive legacy entitlements");
    console.log("T07 migration integration passed: fresh hardened replay, T06 forward upgrade, paid-evidence hardening, authorized rejection, and legacy-entitlement rejection.");
  } finally {
    await sql.end({ timeout: 5 });
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "T07 migration integration failed");
  process.exitCode = 1;
});
