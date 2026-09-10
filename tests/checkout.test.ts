import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createGuestPurchaseCapability, deriveStableCommerceIdentity, hashGuestPurchaseCapability, isGuestPurchaseCapability } from "../lib/commerce/contract";
import { approvedCheckoutOffer, assertExactOrigin, guestCheckoutCookieName, guestCheckoutCookieOptions, parseCheckoutStartInput, resolveApprovedCheckoutOffer, stripeCheckoutIdempotencyKey } from "../lib/commerce/checkout-contract";

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

test("Stripe idempotency is stable and checkout stays server-only without fulfillment", () => {
  const attemptId = "11111111-1111-4111-8111-111111111111";
  assert.equal(stripeCheckoutIdempotencyKey(attemptId), stripeCheckoutIdempotencyKey(attemptId));
  assert.match(readFileSync("lib/commerce/stripe.ts", "utf8"), /import "server-only"/);
  assert.match(readFileSync("lib/commerce/checkout.ts", "utf8"), /import "server-only"/);
  assert.match(readFileSync("lib/commerce/checkout.ts", "utf8"), /grantEntitlement: false/);
  assert.equal(readFileSync("app/checkout/success/page.tsx", "utf8").includes("ownership granted"), false);
});
