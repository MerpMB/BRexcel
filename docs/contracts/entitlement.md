# Entitlement and download contract

**LOCKED:** payment evidence, access grant and file delivery remain independently identifiable. No `user.paid` flag. Authentication does not imply ownership.

| Record | Meaning |
| --- | --- |
| Entitlement | Stable ID, product + purchased version, source order item, optional verified owner ID, unverified recovery destination, state (`active`, `suspended`, `revoked`), timestamps/reason. Unique purchase source prevents duplicate grants. |
| Customer identity | Stable internal identity linked to verified Auth subject. Email is a recovery attribute, not the primary key; never trust user-editable metadata. |
| Download event | Request/correlation ID, entitlement + version, credential kind/subject reference, time, authorized/denied/issuance-failed outcome and safe reason. Link issuance is not proof of completed transfer. Never log signed URLs/tokens or full email/IP by default. |

MVP access covers the purchased immutable version only, unlimited reasonable re-downloads while active. Retirement does not revoke it. Bundles, complimentary sources and upgrade grants are deferred; separate IDs allow adding them later without changing payment truth.

## Two access credentials

- **Immediate guest access:** generate at least 256 bits of random capability at checkout initiation; retain only its hash server-side, bound to exactly that order. Cookie is HttpOnly, Secure, SameSite=Lax, expires after 24 hours and is never placed in URLs/local storage/logs. Check origin on mutations. Possession grants status visibility; download additionally requires its active entitlement and verified paid state. It cannot list or claim any other purchase, even with the same email. Expired/lost cookie falls back to recovery. Return URL alone fails closed.
- **Recovery:** verified passwordless email session is checked server-side. Transactionally associate unclaimed entitlements matching the provider-recorded recovery email with the internal customer ID. Use one documented canonicalization (trim and case-fold; no provider-specific dot/plus rewriting). Never reassign an already claimed entitlement or infer verification from the checkout email. Subsequent authorization uses owner ID; email changes do not transfer ownership. Conflicts/typos go to audited operator support. Do not offer automatic account merging.

Recovery responses must not reveal whether an email has purchases. Rate-limit send/verify and access endpoints, allowlist redirect destinations and expire/reject replayed recovery credentials through the auth provider. Shared mailbox access and compromised email remain residual risks. [Supabase passwordless documentation](https://supabase.com/docs/guides/auth/auth-email-passwordless) is the implementation reference; no custom authentication protocol.

## Download authorization

Server resolves requested entitlement/version, verifies credential scope and active state, then resolves its private object reference. Never accept a browser-supplied bucket/path. Return a server-issued signed URL with **60-second TTL**, private/no-store response and no-referrer policy; keep it out of analytics and cached pages. Storage has no public read/list/write access. Rate-limit issuance without turning entitlement into a download counter.

Missing/foreign/revoked access returns a generic denial with no file location. Storage or audit-write failure fails issuance with retryable feedback. Record outcome; an issued link can be reused/shared until expiry. Revocation blocks new links immediately but cannot invalidate already issued links or retrieve downloaded bytes. This limitation is explicit in [Supabase storage documentation](https://supabase.com/docs/guides/storage/serving/downloads).

Full verified refund revokes the order item's grant; dispute suspends it, reinstatement needs verified resolution and an audited operator action. Partial refunds require operator decision. Record reason/actor/evidence, preserve payment history, and do not allow an old success event to restore access. MVP operations use dashboards/runbooks, not a new admin UI.
