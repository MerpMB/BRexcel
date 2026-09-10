import { NextRequest, NextResponse } from "next/server";
import { createGuestPurchaseCapability, isGuestPurchaseCapability } from "@/lib/commerce/contract";
import { guestCheckoutCookieName, guestCheckoutCookieOptions } from "@/lib/commerce/checkout-contract";

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/checkout", request.url), 303);
  const capability = request.cookies.get(guestCheckoutCookieName)?.value;
  if (!capability || !isGuestPurchaseCapability(capability)) response.cookies.set(guestCheckoutCookieName, createGuestPurchaseCapability(), guestCheckoutCookieOptions);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
