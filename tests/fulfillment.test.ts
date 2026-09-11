import assert from "node:assert/strict";
import test from "node:test";
import Stripe from "stripe";
import { readFileSync } from "node:fs";
import { createStripeTestClient } from "../lib/commerce/stripe-client";
import { supportedStripeEventTypes } from "../lib/commerce/fulfillment-core";
import { WebhookEnvelopeError, verifyStripeWebhookEnvelope } from "../lib/commerce/stripe-webhook";

const webhookSecret = "whsec_t07_deterministic_test_secret";
const sdk = createStripeTestClient("sk_test_t07_deterministic_1234567890");
const payload = JSON.stringify({
  id: "evt_t07_deterministic",
  object: "event",
  api_version: "2025-01-27.acacia",
  created: 1_789_120_000,
  data: { object: { id: "cs_test_t07_deterministic", object: "checkout.session" } },
  livemode: false,
  type: "checkout.session.completed",
});

async function signedHeader(timestamp = Math.floor(Date.now() / 1000), secret = webhookSecret) {
  return Stripe.webhooks.generateTestHeaderStringAsync({ payload, secret, timestamp, cryptoProvider: Stripe.createSubtleCryptoProvider() });
}

test("Stripe webhook verification accepts the exact signed raw body", async () => {
  const event = await verifyStripeWebhookEnvelope(payload, await signedHeader(), sdk, webhookSecret);
  assert.equal(event.id, "evt_t07_deterministic");
  assert.equal(event.type, "checkout.session.completed");
});

test("Stripe webhook verification rejects mutation, wrong secrets, and expired timestamps", async () => {
  await assert.rejects(verifyStripeWebhookEnvelope(`${payload} `, await signedHeader(), sdk, webhookSecret), WebhookEnvelopeError);
  await assert.rejects(verifyStripeWebhookEnvelope(payload, await signedHeader(), sdk, "whsec_wrong_secret"), WebhookEnvelopeError);
  await assert.rejects(verifyStripeWebhookEnvelope(payload, await signedHeader(Math.floor(Date.now() / 1000) - 301), sdk, webhookSecret), WebhookEnvelopeError);
  await assert.rejects(verifyStripeWebhookEnvelope("not-json", "t=1,v1=bad", sdk, webhookSecret), WebhookEnvelopeError);
});

test("T07 supports only the four approved Stripe event types", () => {
  assert.deepEqual([...supportedStripeEventTypes].sort(), [
    "checkout.session.async_payment_failed",
    "checkout.session.async_payment_succeeded",
    "checkout.session.completed",
    "checkout.session.expired",
  ]);
});

test("webhook route keeps raw-body verification and avoids browser credentials", () => {
  const source = readFileSync("app/api/stripe/webhook/route.ts", "utf8");
  assert.match(source, /request\.text\(\)/);
  assert.equal(source.includes("request.json"), false);
  assert.equal(source.includes("cookies"), false);
  assert.equal(source.includes("assertExactOrigin"), false);
  assert.equal(source.includes("stripe-signature"), true);
});

test("T07 migration keeps provider evidence private and removes generic entitlement grants", () => {
  const migration = readFileSync("supabase/migrations/20260911111516_t07_verified_payment_fulfillment.sql", "utf8");
  for (const fragment of ["create table commerce.provider_events", "enable row level security", "revoke all on table commerce.provider_events from public, anon, authenticated, service_role", "provider_payment_reference", "verified_at", "source_payment_attempt_id", "entitlements_one_per_order", "legacy authorized payment attempts require lead disposition"]) assert.equal(migration.includes(fragment), true, `missing T07 control: ${fragment}`);
  assert.equal(readFileSync("lib/commerce/contract.ts", "utf8").includes("grantEntitlement"), false);
  assert.match(readFileSync("lib/commerce/fulfillment-core.ts", "utf8"), /grantVerifiedPurchaseInTransaction/);
});
