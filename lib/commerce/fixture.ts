import "server-only";

import { commerceTestOffer } from "./contract";

/** Internal-only fixture. It is intentionally separate from every public product fixture. */
export const internalCommerceTestFixture = {
  ...commerceTestOffer,
  source: "T05 internal test commerce fixture",
  synthetic: true,
} as const;
