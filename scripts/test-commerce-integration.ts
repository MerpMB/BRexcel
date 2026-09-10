import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { createGuestPurchaseCapability } from "../lib/commerce/contract";
import { persistTrustedCommerceAttemptInTransaction } from "../lib/commerce/persistence-core";

function connectionString() {
  const value = process.env.COMMERCE_DATABASE_URL ?? process.env.DB_URL;
  if (!value) throw new Error("Commerce integration requires COMMERCE_DATABASE_URL or Supabase CLI DB_URL; start local Supabase first.");
  return value;
}

async function expectReject(operation: () => Promise<unknown>, message: string) {
  await assert.rejects(operation, message);
}

function persistAsCommerceRuntime(sql: postgres.Sql, request: Parameters<typeof persistTrustedCommerceAttemptInTransaction>[1]) {
  return sql.begin(async (transaction) => {
    await transaction`set local role commerce_runtime`;
    return persistTrustedCommerceAttemptInTransaction(transaction, request);
  });
}

async function main() {
  const sql = postgres(connectionString(), { max: 8, prepare: true });
  try {
    const creationIdentity = randomUUID();
    const idempotencyKey = randomUUID();
    const first = await persistAsCommerceRuntime(sql, { creationIdentity, idempotencyKey, providerSessionReference: "cs_test_" + randomUUID().replaceAll("-", ""), grantEntitlement: true, guestCapability: createGuestPurchaseCapability() });
    assert.equal(first.reused, false);
    assert.ok(first.entitlementId);

    const retry = await persistAsCommerceRuntime(sql, { creationIdentity, idempotencyKey, grantEntitlement: true });
    assert.equal(retry.reused, true);
    assert.equal(retry.orderId, first.orderId);
    assert.equal(retry.attemptId, first.attemptId);
    assert.equal(retry.entitlementId, first.entitlementId);

    await expectReject(() => persistAsCommerceRuntime(sql, { creationIdentity: randomUUID(), idempotencyKey, grantEntitlement: false }), "idempotency collisions across orders reject");
    await expectReject(() => sql`update commerce.orders set title = 'changed' where id = ${first.orderId}::uuid`, "order snapshots are immutable");

    const duplicatedReference = "cs_test_" + randomUUID().replaceAll("-", "");
    await persistAsCommerceRuntime(sql, { creationIdentity: randomUUID(), idempotencyKey: randomUUID(), providerSessionReference: duplicatedReference });
    const collisionIdentity = randomUUID();
    await expectReject(() => persistAsCommerceRuntime(sql, { creationIdentity: collisionIdentity, idempotencyKey: randomUUID(), providerSessionReference: duplicatedReference }), "provider references must be unique");
    const [collisionRollback] = await sql<{ count: string }[]>`select count(*)::text as count from commerce.orders where creation_identity = ${collisionIdentity}::uuid`;
    assert.equal(collisionRollback.count, "0", "a failed provider attempt rolls back its new order");

    const concurrentIdentity = randomUUID();
    const parallel = await Promise.all([
      persistAsCommerceRuntime(sql, { creationIdentity: concurrentIdentity, idempotencyKey: randomUUID() }),
      persistAsCommerceRuntime(sql, { creationIdentity: concurrentIdentity, idempotencyKey: randomUUID() }),
    ]);
    assert.equal(parallel[0].orderId, parallel[1].orderId);

    const [orders] = await sql<{ count: string }[]>`select count(*)::text as count from commerce.orders where creation_identity = ${concurrentIdentity}::uuid`;
    assert.equal(orders.count, "1");

    const rollbackIdentity = randomUUID();
    await expectReject(() => sql.begin(async (transaction) => {
      await transaction`insert into commerce.orders (creation_identity, offer_id, product_id, title, amount_minor, currency, quantity, environment, offer_state) values (${rollbackIdentity}::uuid, 'offer_test_freelancer_cashflow_v1', 'prd_test_freelancer_cashflow_v1', 'Freelancer Cashflow Planner — internal commerce test offer', 4900, 'THB', 1, 'test', 'test_only')`;
      throw new Error("rollback sentinel");
    }), "transactions roll back");
    const [rolledBack] = await sql<{ count: string }[]>`select count(*)::text as count from commerce.orders where creation_identity = ${rollbackIdentity}::uuid`;
    assert.equal(rolledBack.count, "0");

    await expectReject(() => sql`insert into commerce.orders (creation_identity, offer_id, product_id, title, amount_minor, currency, quantity, environment, offer_state) values (${randomUUID()}::uuid, 'offer_test_freelancer_cashflow_v1', 'prd_test_freelancer_cashflow_v1', 'Freelancer Cashflow Planner — internal commerce test offer', 1, 'THB', 1, 'test', 'test_only')`, "invalid price is rejected");
    await expectReject(() => sql`insert into commerce.orders (creation_identity, offer_id, product_id, title, amount_minor, currency, quantity, environment, offer_state) values (${randomUUID()}::uuid, 'offer_test_freelancer_cashflow_v1', 'prd_test_freelancer_cashflow_v1', 'Freelancer Cashflow Planner — internal commerce test offer', 4900, 'THB', 1, 'live', 'test_only')`, "non-test environments are rejected");

    const [role] = await sql<{ allowed: boolean }[]>`select has_table_privilege('commerce_runtime', 'commerce.orders', 'select') as allowed`;
    assert.equal(role.allowed, true);
    const [publicRole] = await sql<{ allowed: boolean }[]>`select has_table_privilege('public', 'commerce.orders', 'select') as allowed`;
    assert.equal(publicRole.allowed, false);
    await expectReject(() => sql.begin(async (transaction) => {
      await transaction`set local role anon`;
      await transaction`select * from commerce.orders limit 1`;
    }), "anon role is denied");
    await expectReject(() => sql.begin(async (transaction) => {
      await transaction`set local role authenticated`;
      await transaction`select * from commerce.orders limit 1`;
    }), "authenticated role is denied");
    await sql.begin(async (transaction) => {
      await transaction`set local role commerce_runtime`;
      const runtimeOrder = await transaction<{ id: string }[]>`insert into commerce.orders (creation_identity, offer_id, product_id, title, amount_minor, currency, quantity, environment, offer_state) values (${randomUUID()}::uuid, 'offer_test_freelancer_cashflow_v1', 'prd_test_freelancer_cashflow_v1', 'Freelancer Cashflow Planner — internal commerce test offer', 4900, 'THB', 1, 'test', 'test_only') returning id`;
      assert.ok(runtimeOrder[0]?.id);
    });

    let dataApiDenied = false;
    try {
      const response = await fetch("http://127.0.0.1:54321/rest/v1/orders");
      dataApiDenied = !response.ok;
    } catch {
      dataApiDenied = true;
    }
    assert.equal(dataApiDenied, true, "Data API must be unavailable or deny commerce access");

    console.log("Commerce integration passed: migration constraints, atomic retries, rollback, role/RLS isolation, and runtime role access.");
  } finally {
    await sql.end({ timeout: 5 });
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Commerce integration failed");
  process.exitCode = 1;
});
