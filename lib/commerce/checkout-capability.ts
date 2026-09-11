import { createGuestPurchaseCapability, isGuestPurchaseCapability } from "./contract";

export const checkoutSecurityHeaders = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" };

export function prepareGuestCheckoutCapability(existingCapability: string | undefined, issueCapability = createGuestPurchaseCapability) {
  if (existingCapability && isGuestPurchaseCapability(existingCapability)) {
    return { capability: existingCapability, shouldSetCookie: false };
  }
  return { capability: issueCapability(), shouldSetCookie: true };
}

export function requirePreparedGuestCheckoutCapability(existingCapability: string | undefined) {
  return existingCapability && isGuestPurchaseCapability(existingCapability) ? existingCapability : undefined;
}

export async function startWithPreparedGuestCheckoutCapability<T>(existingCapability: string | undefined, startCommerce: (capability: string) => Promise<T>) {
  const capability = requirePreparedGuestCheckoutCapability(existingCapability);
  if (!capability) return { kind: "preparation-required" as const };
  return { kind: "started" as const, capability, started: await startCommerce(capability) };
}
