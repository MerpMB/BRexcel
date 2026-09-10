import { NextRequest, NextResponse } from "next/server";
import { createGuestPurchaseCapability, isGuestPurchaseCapability } from "@/lib/commerce/contract";
import { assertExactOrigin, guestCheckoutCookieName, guestCheckoutCookieOptions, parseCheckoutStartInput, resolveApprovedCheckoutOffer } from "@/lib/commerce/checkout-contract";
import { startGuestHostedCheckout } from "@/lib/commerce/checkout";

function configuredOrigin() {
  const origin = process.env.APP_ORIGIN;
  if (!origin) throw new Error("Checkout is not configured");
  return origin;
}

function badRequest(message: string) {
  return new NextResponse(message, { status: 400, headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
}

export async function POST(request: NextRequest) {
  try {
    assertExactOrigin(request.headers.get("origin"), configuredOrigin());
    const form = await request.formData();
    const values: Record<string, string | undefined> = {};
    for (const [key, value] of form.entries()) {
      if (typeof value !== "string" || values[key] !== undefined) throw new Error("Invalid checkout form");
      values[key] = value;
    }
    resolveApprovedCheckoutOffer(parseCheckoutStartInput(values));

    const existingCapability = request.cookies.get(guestCheckoutCookieName)?.value;
    const capability = existingCapability && isGuestPurchaseCapability(existingCapability) ? existingCapability : createGuestPurchaseCapability();
    const setCapability = capability !== existingCapability;
    const started = await startGuestHostedCheckout(capability);
    const response = NextResponse.redirect(started.checkoutUrl, 303);
    if (setCapability) response.cookies.set(guestCheckoutCookieName, capability, guestCheckoutCookieOptions);
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Unable to start checkout");
  }
}
