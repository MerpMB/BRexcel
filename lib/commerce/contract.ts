import { createHash, randomBytes } from "node:crypto";

export const commerceTestOffer = {
  offerId: "offer_test_freelancer_cashflow_v1",
  productId: "prd_test_freelancer_cashflow_v1",
  title: "Freelancer Cashflow Planner — internal commerce test offer",
  amountMinor: 4900,
  currency: "THB",
  quantity: 1,
  environment: "test",
  offerState: "test_only",
} as const;

export type CreateCommerceAttemptRequest = {
  creationIdentity: string;
  idempotencyKey: string;
  providerSessionReference?: string;
  grantEntitlement?: boolean;
  guestCapability?: string;
};

export type PersistedCommerceAttempt = {
  orderId: string;
  attemptId: string;
  providerSessionReference?: string;
  entitlementId?: string;
  reused: boolean;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function requireUuid(value: string, label: string) {
  if (!uuidPattern.test(value)) throw new Error(`${label} must be a UUID`);
  return value;
}

export function createGuestPurchaseCapability() {
  return randomBytes(32).toString("base64url");
}

export function hashGuestPurchaseCapability(capability: string) {
  if (!isGuestPurchaseCapability(capability)) throw new Error("guest capability must be exactly 32 random bytes");
  return createHash("sha256").update(capability).digest();
}

export function isGuestPurchaseCapability(capability: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(capability)) return false;
  return Buffer.from(capability, "base64url").length === 32;
}

export function deriveStableCommerceIdentity(capability: string, domain: "BRexcel/order/v1" | "BRexcel/attempt/v1") {
  if (!isGuestPurchaseCapability(capability)) throw new Error("guest capability must be exactly 32 random bytes");
  const bytes = createHash("sha256").update(domain).update("\0").update(capability).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function validateCommerceAttemptRequest(request: CreateCommerceAttemptRequest) {
  requireUuid(request.creationIdentity, "creation identity");
  requireUuid(request.idempotencyKey, "idempotency key");
  if (request.providerSessionReference !== undefined && !/^cs_test_[A-Za-z0-9_-]{8,}$/i.test(request.providerSessionReference)) {
    throw new Error("provider session reference must be a test reference");
  }
  return request;
}
