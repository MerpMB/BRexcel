import { NextRequest, NextResponse } from "next/server";
import { checkoutSecurityHeaders, startWithPreparedGuestCheckoutCapability } from "@/lib/commerce/checkout-capability";
import { assertExactOrigin, guestCheckoutCookieName, parseCheckoutStartInput, resolveApprovedCheckoutOffer } from "@/lib/commerce/checkout-contract";
import { startGuestHostedCheckout } from "@/lib/commerce/checkout";

function configuredOrigin() {
  const origin = process.env.APP_ORIGIN;
  if (!origin) throw new Error("Checkout is not configured");
  return origin;
}

function badRequest(message: string) {
  return new NextResponse(message, { status: 400, headers: checkoutSecurityHeaders });
}

function preparationRequired() {
  return new NextResponse("Prepare checkout at /checkout/prepare and try again.", { status: 409, headers: checkoutSecurityHeaders });
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

    const result = await startWithPreparedGuestCheckoutCapability(
      request.cookies.get(guestCheckoutCookieName)?.value,
      startGuestHostedCheckout,
    );
    if (result.kind === "preparation-required") return preparationRequired();
    const response = NextResponse.redirect(result.started.checkoutUrl, 303);
    for (const [name, value] of Object.entries(checkoutSecurityHeaders)) response.headers.set(name, value);
    return response;
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Unable to start checkout");
  }
}
