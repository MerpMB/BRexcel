# Checkout contract

**LOCKED invariants:** browser input expresses intent only; verified provider state establishes payment evidence; entitlement is a separate domain effect. **CURRENT:** Stripe hosted one-time Checkout with THB/card/PromptPay.

| Record | Meaning |
| --- | --- |
| Order | Internal ID, immutable one-item product/version/price/terms snapshot, recovery email, creation time and fulfillment status (`pending`, `fulfilled`, `attention`). Commercial history, not identity proof. |
| Payment attempt | Order link, unique provider session/payment references, environment, expected/observed amount and currency, provider status, timestamps. Multiple attempts may belong to an order; one attempt cannot fund another order. |
| Provider event | Unique provider + environment + event ID, related attempt, processing outcome/time and sanitized error; duplicates are acknowledged only after completed processing. |

## Initiation and confirmation

1. Server validates a published, sale-enabled offer from product ID; quantity is fixed at one. Client displayed-price/version may be checked for staleness but cannot override it. Unknown/inactive/stale requests fail explicitly.
2. Persist order and attempt intent before calling Stripe. Bind the guest credential in [entitlement](entitlement.md); use a server-generated provider idempotency key stable for this attempt. A retry after a timeout recovers the same session, not another charge. A deliberately new attempt gets a new key.
3. Server creates hosted Checkout using its own price mapping, order reference and fixed return destinations. Persist unique returned session reference before returning redirect. API/DB failure leaves retryable attempt state. Collect and retain provider-returned checkout email as unverified recovery destination.
4. Return page checks only server status under an authorized order credential. URL session/order IDs are locators, never credentials. Show pending, paid-but-preparing, ready, failed or expired as applicable; poll with bounded backoff. Closing the browser must not prevent fulfillment.

## Webhook processor

Verify the signature against the raw body with configured secret and timestamp tolerance before using payload fields. Reject wrong environment/account, invalid signature and malformed events. For relevant events, retrieve current provider payment/session state as needed; validate order association, amount, currency and purchased offer. Never grant merely because an event is named `checkout.session.completed`; require verified paid state. Handle delayed success/failure and expiration; later stale failure/expiry must not erase a verified successful payment.

Within a database transaction lock the attempt/order, record verified payment state, invoke a distinct idempotent entitlement-grant operation, and mark event processed plus order fulfilled only when the grant commits. Conceptual separation does not require a queue. Unique event IDs stop replay; a unique purchase grant per order item stops different events for the same payment producing duplicate ownership. Concurrent calls must converge. A second successful attempt on the same order is flagged for operator resolution, never silently discarded or granted twice.

On transient provider/database failure return a retryable failure; do not mark the event processed. Mismatched commercial evidence grants nothing and records an operator-visible anomaly. Unrelated valid event types may be acknowledged without effects. Reconciliation retrieves provider truth and invokes this same transaction; never edits ownership based on a screenshot. Keep card/bank data and full webhook payloads out of application logs.

Refund/dispute events use the access policy; a delayed original success cannot reactivate a revoked/suspended grant. T12 verifies lifecycle ordering and recovery before release.

Provider feasibility must be checked against the actual merchant account. Stripe documents THB and Thai-business availability for standard PromptPay acceptance; this is a deployment gate, not assumed eligibility. Sources: [PromptPay](https://docs.stripe.com/payments/promptpay), [Checkout fulfillment](https://docs.stripe.com/checkout/fulfillment). Revalidate integration details at implementation time.
