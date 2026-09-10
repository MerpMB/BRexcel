import { requireUuid } from "./contract";

export const guestCheckoutCookieName = "brx_guest_checkout";
export const guestCheckoutCookieOptions = { httpOnly: true, secure: true, sameSite: "lax" as const, maxAge: 60 * 60 * 24, path: "/checkout" };

export const approvedCheckoutOffer = {
  checkoutOfferId: "checkout_test_freelancer_cashflow_v1",
  revision: "checkout-test-v1",
  active: true,
  internalOfferId: "offer_test_freelancer_cashflow_v1",
  productId: "prd_test_freelancer_cashflow_v1",
  versionId: "freelancer-cashflow-v1",
  title: "Freelancer Cashflow Planner — internal commerce test offer",
  amountMinor: 4900,
  currency: "THB",
  quantity: 1,
} as const;

export type CheckoutStartInput = { checkoutOfferId: string; revision: string };
type CheckoutOffer = {
  checkoutOfferId: string;
  revision: string;
  active: boolean;
  internalOfferId: string;
  productId: string;
  versionId: string;
  title: string;
  amountMinor: number;
  currency: string;
  quantity: number;
};
const prohibitedFields = new Set(["price", "amount", "currency", "quantity", "productId", "product_id", "versionId", "version_id", "providerSessionReference", "provider_session_reference"]);

export function parseCheckoutStartInput(values: Record<string, string | undefined>) {
  const allowedFields = new Set(["checkoutOfferId", "revision"]);
  for (const field of Object.keys(values)) {
    if (prohibitedFields.has(field) || !allowedFields.has(field)) throw new Error(`Browser may not submit ${field}`);
  }
  if (!values.checkoutOfferId || !values.revision) throw new Error("Checkout offer and revision are required");
  return { checkoutOfferId: values.checkoutOfferId, revision: values.revision };
}

export function resolveApprovedCheckoutOffer(input: CheckoutStartInput, offers: readonly CheckoutOffer[] = [approvedCheckoutOffer]) {
  const offer = offers.find((candidate) => candidate.checkoutOfferId === input.checkoutOfferId);
  if (!offer) throw new Error("Unknown checkout offer");
  if (!offer.active) throw new Error("Inactive checkout offer");
  if (offer.revision !== input.revision) throw new Error("Stale checkout offer");
  return offer;
}

export function assertExactOrigin(origin: string | null, applicationOrigin: string) {
  if (!origin) throw new Error("Missing Origin");
  const expected = new URL(applicationOrigin);
  const actual = new URL(origin);
  if ((expected.protocol !== "https:" && expected.protocol !== "http:") || expected.origin !== applicationOrigin || actual.origin !== expected.origin) throw new Error("Cross-origin checkout initiation is not allowed");
}

export function stripeCheckoutIdempotencyKey(attemptId: string) {
  requireUuid(attemptId, "payment attempt ID");
  return `brx-checkout:${attemptId}`;
}
