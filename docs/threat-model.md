# MVP threat model

Scope: public visitors, purchasers attempting cross-customer access, forged/replayed provider input and operator mistakes. Trust boundaries: browser→server, provider→server, server→private data, source/build→public deployment. Mitigations below are required future controls, not claims about the current shell.

| Threat | Boundary | MVP mitigation and acceptance evidence | Deferred / residual |
| --- | --- | --- | --- |
| Commercial bytes leaked in page/build | Private asset→public app | Keep workbooks outside repo/build; inspect built assets/network responses with a known synthetic canary; no protected file import. | Authorized buyers can copy downloads; no DRM. |
| Predictable/static download URL | Browser→storage | Private bucket; server authorization before 60-second signed link; test anonymous object access and expired link rejection. | Issued bearer links transferable until expiry. |
| Foreign version/order download (IDOR) | Browser→access | Credential scope + active entitlement + version association on every request; test anonymous, other customer and altered version. | Advanced abuse scoring later. |
| Forged success / price manipulation | Browser→commerce | Server offer mapping and verified payment state; test changed amount/currency/product and return URL with no credential. | No client trust exceptions. |
| Forged/replayed webhook | Provider→server | Raw-body signature/timestamp validation and unique event record; invalid/old signatures rejected, valid retries idempotent. | Secret rotation runbook at release. |
| Duplicate/concurrent grants | Provider→DB | Unique purchase source + transactional lock; parallel same-event and distinct-event delivery creates one grant. | Queue only if throughput warrants it. |
| Lost grant / out-of-order lifecycle | Provider→DB | Atomic grant processing, retry on failure, reconciliation; inject DB failure and replay success after refund. | Multi-region processing deferred. |
| Protected files committed, including renamed archives | Workstation→Git/build | `.gitignore` is insufficient: staged-file/CI signature and secret checks, explicit public demo review, inspect artifact additions. Use synthetic fixtures only. | Scanners miss transformed content; human provenance review remains necessary. |
| Secret in frontend/logs | Server→browser/logs | Server-only modules, no privileged `NEXT_PUBLIC_` values, sanitized logs; inspect compiled client assets with fake canary secret. | Automated rotation later; exposed credentials require immediate revocation. |
| Protected content masquerading as demo | Authoring→public showcase | Manifest provenance/disclosure review; no workbook extraction or private references; test rejected URLs/code and inspect fixture sources. | Semantic leakage needs operator review, not regex alone. |
| Email impersonation / guest token theft | Browser→identity | Checkout email unverified; scoped hashed cookie, verified recovery claim, no automatic reassignment; test guessed IDs, foreign cookie and expired recovery. | Mailbox compromise and legitimate sharing remain possible. |
| RLS or privileged-client bypass | Browser/server→DB | No browser commerce writes; least grants/RLS where exposed; test anon and two-user access plus server authorization. | Privileged operator compromise requires account controls. |
| XSS / CSRF / open redirect | Public input→browser/server | Escaped demo text, no eval/HTML, fixed return URLs, origin checks for mutations; test malicious labels/redirects and cross-origin requests. | CSP hardening when deployed integrations are known. |
| Abuse, PII exposure and cache leak | Public endpoints→services | Rate limits, generic recovery response, no-store personal responses, safe identifiers in logs; test two sessions and throttling. | Dedicated fraud platform deferred; retention policy is a launch gate. |

T02/T03 cover public artifacts, T05–T09 enforce commerce/delivery boundaries, T11 covers recovery, T12/T13 exercise incident and deployed paths. Security control changes use [lead escalation](delivery.md#lead-escalation).
