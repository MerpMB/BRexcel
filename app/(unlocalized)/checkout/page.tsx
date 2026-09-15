import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isGuestPurchaseCapability } from "@/lib/commerce/contract";
import { approvedCheckoutOffer, guestCheckoutCookieName } from "@/lib/commerce/checkout-contract";

export default async function CheckoutPage() {
  const cookieStore = await cookies();
  const capability = cookieStore.get(guestCheckoutCookieName)?.value;
  if (!capability || !isGuestPurchaseCapability(capability)) redirect("/checkout/prepare");
  return <main><h1>Internal test checkout</h1><p>This test offer is not the public Freelancer Cashflow Planner product.</p><form action="/checkout/start" method="post"><input type="hidden" name="checkoutOfferId" value={approvedCheckoutOffer.checkoutOfferId} /><input type="hidden" name="revision" value={approvedCheckoutOffer.revision} /><button type="submit">Continue to test checkout</button></form></main>;
}
