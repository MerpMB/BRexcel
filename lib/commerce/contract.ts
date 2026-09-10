import { createHash, randomUUID } from "node:crypto";

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
  entitlementId?: string;
  reused: boolean;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function requireUuid(value: string, label: string) {
  if (!uuidPattern.test(value)) throw new Error(`${label} must be a UUID`);
  return value;
}

export function createGuestPurchaseCapability() {
  return randomUUID() + randomUUID();
}

export function hashGuestPurchaseCapability(capability: string) {
  if (capability.length < 32) throw new Error("guest capability must be sufficiently random");
  return createHash("sha256").update(capability).digest();
}

export function validateCommerceAttemptRequest(request: CreateCommerceAttemptRequest) {
  requireUuid(request.creationIdentity, "creation identity");
  requireUuid(request.idempotencyKey, "idempotency key");
  if (request.providerSessionReference !== undefined && !/^cs_test_[A-Za-z0-9_-]{8,}$/i.test(request.providerSessionReference)) {
    throw new Error("provider session reference must be a test reference");
  }
  return request;
}
