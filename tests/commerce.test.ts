import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { commerceTestOffer, createGuestPurchaseCapability, hashGuestPurchaseCapability, validateCommerceAttemptRequest } from "../lib/commerce/contract";
import type postgres from "postgres";
import { resolveCommerceDatabaseRuntime, withRequestOwnedCommerceDatabase } from "../lib/commerce/database-runtime";

test("internal commerce fixture is fixed to one test-only THB offer", () => {
  assert.deepEqual({ amountMinor: commerceTestOffer.amountMinor, currency: commerceTestOffer.currency, quantity: commerceTestOffer.quantity, environment: commerceTestOffer.environment, offerState: commerceTestOffer.offerState }, { amountMinor: 4900, currency: "THB", quantity: 1, environment: "test", offerState: "test_only" });
});

test("commercial attempt contract accepts stable UUID identities and test references", () => {
  assert.doesNotThrow(() => validateCommerceAttemptRequest({ creationIdentity: "11111111-1111-4111-8111-111111111111", idempotencyKey: "22222222-2222-4222-8222-222222222222", providerSessionReference: "cs_test_12345678" }));
  assert.throws(() => validateCommerceAttemptRequest({ creationIdentity: "not-a-uuid", idempotencyKey: "22222222-2222-4222-8222-222222222222" }));
  assert.throws(() => validateCommerceAttemptRequest({ creationIdentity: "11111111-1111-4111-8111-111111111111", idempotencyKey: "22222222-2222-4222-8222-222222222222", providerSessionReference: "live-session" }));
});

test("guest purchase capabilities are never persisted raw", () => {
  const capability = createGuestPurchaseCapability();
  const digest = hashGuestPurchaseCapability(capability);
  assert.equal(digest.includes(Buffer.from(capability)), false);
  assert.equal(digest.length, 32);
  assert.throws(() => hashGuestPurchaseCapability("short"));
});

test("commerce is server-only and absent from the local Data API", () => {
  assert.match(readFileSync("lib/commerce/database.ts", "utf8"), /import "server-only"/);
  assert.match(readFileSync("lib/commerce/persist.ts", "utf8"), /import "server-only"/);
  const config = readFileSync("supabase/config.toml", "utf8");
  assert.match(config, /\[api\][\s\S]*?enabled = false/);
  assert.match(config, /\[auth\][\s\S]*?enabled = false/);
  assert.match(config, /\[storage\][\s\S]*?enabled = false/);
  assert.match(config, /\[realtime\][\s\S]*?enabled = false/);
  assert.equal(config.includes('"commerce"'), false);
});

test("Worker commerce configuration requires COMMERCE_DB and never falls back to a raw database URL", () => {
  assert.throws(
    () => resolveCommerceDatabaseRuntime({ env: {} }, "postgres://node-only.example/commerce"),
    /COMMERCE_DB Hyperdrive binding is required/,
  );

  assert.deepEqual(
    resolveCommerceDatabaseRuntime(
      { env: { COMMERCE_DB: { connectionString: "postgres://hyperdrive.example/commerce" } } },
      "postgres://node-only.example/commerce",
    ),
    { kind: "worker", connectionString: "postgres://hyperdrive.example/commerce" },
  );
});

test("Node commerce configuration accepts COMMERCE_DATABASE_URL", () => {
  assert.deepEqual(
    resolveCommerceDatabaseRuntime(undefined, "postgres://node-only.example/commerce"),
    { kind: "node", connectionString: "postgres://node-only.example/commerce" },
  );
});

test("request-owned Worker clients are not retained and cleanup preserves operation errors", async () => {
  let created = 0;
  let ended = 0;
  const createClient = () => {
    created += 1;
    return { end: async () => { ended += 1; } } as unknown as postgres.Sql;
  };

  await withRequestOwnedCommerceDatabase("postgres://hyperdrive.example/commerce", async () => "first", createClient);
  await withRequestOwnedCommerceDatabase("postgres://hyperdrive.example/commerce", async () => "second", createClient);
  assert.equal(created, 2);
  assert.equal(ended, 2);

  const operationError = new Error("transaction failed");
  const cleanupFailureClient = { end: async () => { throw new Error("cleanup failed"); } } as unknown as postgres.Sql;
  await assert.rejects(
    withRequestOwnedCommerceDatabase("postgres://hyperdrive.example/commerce", async () => { throw operationError; }, () => cleanupFailureClient),
    operationError,
  );
});

test("migration declares immutable snapshots, role grants, RLS, and fixed test constraints", () => {
  const migration = readFileSync("supabase/migrations/20260910142359_create_commerce_persistence.sql", "utf8");
  for (const fragment of ["create schema if not exists commerce", "create role commerce_runtime", "enable row level security", "orders_snapshot_immutable", "unique (provider, environment, idempotency_key)", "offer_state = 'test_only'", "currency = 'THB'"]) assert.equal(migration.includes(fragment), true, `missing migration control: ${fragment}`);
});
