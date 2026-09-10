# 0004 — Commerce, ownership and identity

**LOCKED — 2026-09-10:** Payment, Order, Entitlement and Download are distinct concepts. Provider-verified payment can cause a separate ownership grant; neither the return page nor a client-provided price can do so.

**CURRENT:** guest Checkout; immediate access uses a short-lived credential bound to the initiating checkout browser and the paid order. Later recovery verifies the checkout email through Supabase passwordless authentication. Verified email claims attach eligible unclaimed purchases transactionally. Detailed rules live in [checkout](../contracts/checkout.md) and [entitlement](../contracts/entitlement.md).

Requiring registration before payment reduces recovery ambiguity but adds a conversion step. Requiring email verification before every first download is simpler but blocks delivery on email latency. The chosen flow accepts a small guest-capability mechanism to preserve immediate access. It must never expose other purchases sharing the checkout email. A lost cookie requires verification; typed email and Stripe customer IDs are not login credentials.

The purchaser must confirm their checkout email. Typo correction and identity reassignment require operator review; never auto-merge accounts. Mailbox ownership controls recovery, so shared mailboxes and email loss remain support risks. Traditional passwords add no necessary MVP capability.

**CURRENT:** a purchase grants its exact version only, with repeated downloads. Full refunds revoke the related grant; disputes suspend access pending operator resolution. Partial refunds are operator-reviewed. No generalized licensing/upgrade system.
