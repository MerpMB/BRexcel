import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { commerceTestOffer, createGuestPurchaseCapability, hashGuestPurchaseCapability, validateCommerceAttemptRequest } from "../lib/commerce/contract";
import { createStripeTestClient } from "../lib/commerce/stripe-client";

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

test("Stripe checkout always uses the fetch HTTP client", () => {
  const stripe = createStripeTestClient("sk_test_transport_1234567890");
  assert.equal((stripe as unknown as { _api: { httpClient: { getClientName(): string } } })._api.httpClient.getClientName(), "fetch");
});

test("Stripe test-key validation fails closed", () => {
  assert.throws(() => createStripeTestClient(undefined), /STRIPE_TEST_SECRET_KEY is required/);
  assert.throws(() => createStripeTestClient("sk_live_not_permitted"), /Live Stripe keys are not permitted/);
  assert.throws(() => createStripeTestClient("not-a-stripe-key"), /T06 requires a Stripe test secret key/);
});

test("migration declares immutable snapshots, role grants, RLS, and fixed test constraints", () => {
  const migration = readFileSync("supabase/migrations/20260910142359_create_commerce_persistence.sql", "utf8");
  for (const fragment of ["create schema if not exists commerce", "create role commerce_runtime", "enable row level security", "orders_snapshot_immutable", "unique (provider, environment, idempotency_key)", "offer_state = 'test_only'", "currency = 'THB'"]) assert.equal(migration.includes(fragment), true, `missing migration control: ${fragment}`);
});
