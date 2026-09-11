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

async function main() {
  const sql = postgres(connectionString(), { max: 2, prepare: true });
  try {
    const [fresh] = await sql<{ provider_events_exists: boolean; version_id_exists: boolean }[]>`
      select
        to_regclass('commerce.provider_events') is not null as provider_events_exists,
        exists(select 1 from information_schema.columns where table_schema = 'commerce' and table_name = 'orders' and column_name = 'version_id') as version_id_exists
    `;
    assert.deepEqual(fresh, { provider_events_exists: true, version_id_exists: true }, "fresh local reset applies T05 and T07");

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
    console.log("T07 migration integration passed: fresh replay, T06 forward upgrade, authorized rejection, and legacy-entitlement rejection.");
  } finally {
    await sql.end({ timeout: 5 });
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "T07 migration integration failed");
  process.exitCode = 1;
});
