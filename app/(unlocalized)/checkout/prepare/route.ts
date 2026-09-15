import { NextRequest, NextResponse } from "next/server";
import { checkoutSecurityHeaders, prepareGuestCheckoutCapability } from "@/lib/commerce/checkout-capability";
import { guestCheckoutCookieName, guestCheckoutCookieOptions } from "@/lib/commerce/checkout-contract";

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/checkout", request.url), 303);
  const prepared = prepareGuestCheckoutCapability(request.cookies.get(guestCheckoutCookieName)?.value);
  if (prepared.shouldSetCookie) response.cookies.set(guestCheckoutCookieName, prepared.capability, guestCheckoutCookieOptions);
  for (const [name, value] of Object.entries(checkoutSecurityHeaders)) response.headers.set(name, value);
  return response;
}
