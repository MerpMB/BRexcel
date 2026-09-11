import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createGuestPurchaseCapability, deriveStableCommerceIdentity, hashGuestPurchaseCapability, isGuestPurchaseCapability } from "../lib/commerce/contract";
import { checkoutSecurityHeaders, prepareGuestCheckoutCapability, startWithPreparedGuestCheckoutCapability } from "../lib/commerce/checkout-capability";
import { approvedCheckoutOffer, assertExactOrigin, guestCheckoutCookieName, guestCheckoutCookieOptions, parseCheckoutStartInput, resolveApprovedCheckoutOffer, stripeCheckoutIdempotencyKey } from "../lib/commerce/checkout-contract";
import { startGuestHostedCheckoutWithDependencies } from "../lib/commerce/checkout-start-core";

test("approved checkout offer is private test commerce, not the public synthetic product", () => {
  const offer = resolveApprovedCheckoutOffer({ checkoutOfferId: approvedCheckoutOffer.checkoutOfferId, revision: approvedCheckoutOffer.revision });
  assert.equal(offer.internalOfferId, "offer_test_freelancer_cashflow_v1");
  assert.equal(offer.productId, "prd_test_freelancer_cashflow_v1");
  assert.equal(readFileSync("content/products/freelancer-cashflow-planner.ts", "utf8").includes("saleEnabled: false"), true);
  assert.throws(() => resolveApprovedCheckoutOffer({ checkoutOfferId: "unknown", revision: approvedCheckoutOffer.revision }));
  assert.throws(() => resolveApprovedCheckoutOffer({ checkoutOfferId: approvedCheckoutOffer.checkoutOfferId, revision: "stale" }));
  assert.throws(() => resolveApprovedCheckoutOffer({ checkoutOfferId: approvedCheckoutOffer.checkoutOfferId, revision: approvedCheckoutOffer.revision }, [{ ...approvedCheckoutOffer, active: false }]));
});

test("checkout rejects browser commercial claims", () => {
  assert.deepEqual(parseCheckoutStartInput({ checkoutOfferId: approvedCheckoutOffer.checkoutOfferId, revision: approvedCheckoutOffer.revision }), { checkoutOfferId: approvedCheckoutOffer.checkoutOfferId, revision: approvedCheckoutOffer.revision });
  for (const field of ["price", "currency", "quantity", "productId", "versionId", "providerSessionReference", "unexpected"]) assert.throws(() => parseCheckoutStartInput({ checkoutOfferId: approvedCheckoutOffer.checkoutOfferId, revision: approvedCheckoutOffer.revision, [field]: "browser-value" }));
});

test("guest capability is exactly 256 bits, digest-only, and deterministically separated", () => {
  const capability = createGuestPurchaseCapability();
  assert.equal(isGuestPurchaseCapability(capability), true);
  assert.equal(Buffer.from(capability, "base64url").length, 32);
  assert.equal(hashGuestPurchaseCapability(capability).includes(Buffer.from(capability)), false);
  const order = deriveStableCommerceIdentity(capability, "BRexcel/order/v1");
  const attempt = deriveStableCommerceIdentity(capability, "BRexcel/attempt/v1");
  assert.equal(order, deriveStableCommerceIdentity(capability, "BRexcel/order/v1"));
  assert.notEqual(order, attempt);
});

test("checkout capability cookie and origin boundary are exact", () => {
  assert.equal(guestCheckoutCookieName, "brx_guest_checkout");
  assert.deepEqual(guestCheckoutCookieOptions, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 86400, path: "/checkout" });
  assert.doesNotThrow(() => assertExactOrigin("https://checkout.example.test", "https://checkout.example.test"));
  assert.throws(() => assertExactOrigin(null, "https://checkout.example.test"));
  assert.throws(() => assertExactOrigin("https://attacker.example", "https://checkout.example.test"));
  assert.throws(() => assertExactOrigin("not-a-url", "https://checkout.example.test"));
});

test("checkout preparation issues only when needed and never starts commerce", () => {
  const issued = createGuestPurchaseCapability();
  let issuances = 0;
  const issue = () => {
    issuances += 1;
    return issued;
  };

  const absent = prepareGuestCheckoutCapability(undefined, issue);
  assert.deepEqual(absent, { capability: issued, shouldSetCookie: true });
  assert.equal(issuances, 1);
  const valid = prepareGuestCheckoutCapability(issued, issue);
  assert.deepEqual(valid, { capability: issued, shouldSetCookie: false });
  assert.equal(issuances, 1);
  const malformed = prepareGuestCheckoutCapability("malformed", issue);
  assert.deepEqual(malformed, { capability: issued, shouldSetCookie: true });
  assert.equal(issuances, 2);
  assert.deepEqual(guestCheckoutCookieOptions, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 86400, path: "/checkout" });
  assert.deepEqual(checkoutSecurityHeaders, { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" });
  const source = readFileSync("app/checkout/prepare/route.ts", "utf8");
  assert.match(source, /NextResponse\.redirect\(new URL\("\/checkout", request\.url\), 303\)/);
  assert.equal(source.includes("startGuestHostedCheckout"), false);
  assert.equal(source.includes("persistCommercialAttempt"), false);
  assert.equal(source.includes("createHostedCheckoutSession"), false);
});

test("checkout start requires a pre-issued capability before commerce or Stripe", async () => {
  for (const incomingCapability of [undefined, "malformed"]) {
    let persistenceOperations = 0;
    let stripeOperations = 0;
    const result = await startWithPreparedGuestCheckoutCapability(incomingCapability, async () => {
      persistenceOperations += 1;
      stripeOperations += 1;
      return "unreachable";
    });
    assert.deepEqual(result, { kind: "preparation-required" });
    assert.equal(persistenceOperations, 0);
    assert.equal(stripeOperations, 0);
  }

  const capability = createGuestPurchaseCapability();
  const started = await startWithPreparedGuestCheckoutCapability(capability, async (receivedCapability) => {
    assert.equal(receivedCapability, capability);
    return "normal checkout";
  });
  assert.deepEqual(started, { kind: "started", capability, started: "normal checkout" });

  const source = readFileSync("app/checkout/start/route.ts", "utf8");
  assert.equal(source.includes("createGuestPurchaseCapability"), false);
  assert.equal(source.includes("response.cookies.set"), false);
  assert.match(source, /status: 409/);
  assert.match(source, /\/checkout\/prepare/);
});

function memoryCheckoutDependencies(options: { failBeforeProvider?: boolean; failBindingOnce?: boolean } = {}) {
  const attempts = new Map<string, { orderId: string; attemptId: string; providerSessionReference?: string }>();
  const providerOperations = new Map<string, { id: string; url: string }>();
  let persistenceCalls = 0;
  let providerCalls = 0;
  let bindingCalls = 0;
  let failBeforeProvider = options.failBeforeProvider ?? false;
  let failBindingOnce = options.failBindingOnce ?? false;

  return {
    attempts,
    providerOperations,
    counts: () => ({ persistenceCalls, providerCalls, bindingCalls }),
    dependencies: {
      persistCommercialAttempt: async (request: { creationIdentity: string; idempotencyKey: string }) => {
        persistenceCalls += 1;
        const existing = attempts.get(request.idempotencyKey);
        if (existing) return { ...existing, reused: true };
        const created = { orderId: request.creationIdentity, attemptId: request.idempotencyKey };
        attempts.set(request.idempotencyKey, created);
        return { ...created, reused: false };
      },
      createHostedCheckoutSession: async (_orderId: string, attemptId: string) => {
        providerCalls += 1;
        if (failBeforeProvider) {
          failBeforeProvider = false;
          throw new Error("response interrupted after durable persistence");
        }
        const idempotencyKey = stripeCheckoutIdempotencyKey(attemptId);
        const existing = providerOperations.get(idempotencyKey);
        if (existing) return existing;
        const created = { id: `cs_test_${attemptId.replaceAll("-", "")}`, url: "https://checkout.stripe.test/session" };
        providerOperations.set(idempotencyKey, created);
        return created;
      },
      retrieveUsableHostedCheckoutSession: async (providerSessionReference: string) => ({ id: providerSessionReference, url: "https://checkout.stripe.test/session", status: "open" }),
      bindProviderSessionReference: async (attemptId: string, providerSessionReference: string) => {
        bindingCalls += 1;
        if (failBindingOnce) {
          failBindingOnce = false;
          throw new Error("binding interrupted");
        }
        const attempt = attempts.get(attemptId);
        if (!attempt) throw new Error("missing durable attempt");
        if (attempt.providerSessionReference && attempt.providerSessionReference !== providerSessionReference) throw new Error("attempt was rebound");
        attempt.providerSessionReference = providerSessionReference;
      },
    },
  };
}

test("retry after durable persistence preserves one commercial identity", async () => {
  const capability = createGuestPurchaseCapability();
  const memory = memoryCheckoutDependencies({ failBeforeProvider: true });
  await assert.rejects(startGuestHostedCheckoutWithDependencies(capability, memory.dependencies), /response interrupted/);
  const retried = await startGuestHostedCheckoutWithDependencies(capability, memory.dependencies);
  assert.equal(memory.attempts.size, 1);
  assert.equal(memory.providerOperations.size, 1);
  assert.equal(retried.attempt.orderId, deriveStableCommerceIdentity(capability, "BRexcel/order/v1"));
  assert.equal(retried.attempt.attemptId, deriveStableCommerceIdentity(capability, "BRexcel/attempt/v1"));
  assert.deepEqual(memory.counts(), { persistenceCalls: 2, providerCalls: 2, bindingCalls: 1 });
});

test("retry after provider creation recovers the same idempotent Stripe operation before binding", async () => {
  const capability = createGuestPurchaseCapability();
  const memory = memoryCheckoutDependencies({ failBindingOnce: true });
  await assert.rejects(startGuestHostedCheckoutWithDependencies(capability, memory.dependencies), /binding interrupted/);
  const retried = await startGuestHostedCheckoutWithDependencies(capability, memory.dependencies);
  const idempotencyKey = stripeCheckoutIdempotencyKey(retried.attempt.attemptId);
  assert.equal(memory.attempts.size, 1);
  assert.equal(memory.providerOperations.size, 1);
  assert.equal(memory.providerOperations.has(idempotencyKey), true);
  assert.equal(retried.attempt.providerSessionReference, undefined);
  assert.equal(memory.attempts.get(retried.attempt.attemptId)?.providerSessionReference?.startsWith("cs_test_"), true);
  assert.deepEqual(memory.counts(), { persistenceCalls: 2, providerCalls: 2, bindingCalls: 2 });
});

test("Stripe idempotency is stable and checkout stays server-only without fulfillment", () => {
  const attemptId = "11111111-1111-4111-8111-111111111111";
  assert.equal(stripeCheckoutIdempotencyKey(attemptId), stripeCheckoutIdempotencyKey(attemptId));
  assert.match(readFileSync("lib/commerce/stripe.ts", "utf8"), /import "server-only"/);
  assert.match(readFileSync("lib/commerce/checkout.ts", "utf8"), /import "server-only"/);
  assert.match(readFileSync("lib/commerce/checkout-start-core.ts", "utf8"), /grantEntitlement: false/);
  assert.equal(readFileSync("app/checkout/success/page.tsx", "utf8").includes("ownership granted"), false);
});
