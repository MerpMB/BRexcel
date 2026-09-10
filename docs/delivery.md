# Delivery and agent handoff

Read [product](product.md) for scope, [architecture](architecture.md) for boundaries and only the contract relevant to the task. Decisions explain rationale without repeating contracts. This file consolidates milestones, backlog and escalation to avoid three overlapping planning documents.

## Milestones

| Milestone | Exit / tasks |
| --- | --- |
| M0 — Inception | Reviewed product, contracts, threats and ordered backlog; this documentation pass. |
| M1 — Storefront | A visitor discovers a labeled fixture and understands its value; T01–T02. |
| M2 — Showcase | One useful interactive demo with explicit limitations; T03–T04. |
| M3 — Commerce | Test checkout creates verified payment and a separate grant despite retries; T05–T07. |
| M4 — Delivery | Same initiating browser can download only its purchased version; T08–T09. |
| M5 — Recovery and release | Cross-browser recovery, operational repair and deployed release evidence; T10–T13. |

M3/M4 remain test-mode only; M5 is the first live-sale gate. Tasks are ordered below; dependencies permit parallel work but do not authorize scope expansion. Each is one focused implementation session against one product fixture. If a task cannot fit, split implementation within its contract rather than invent infrastructure.

## Initial backlog

### T01 — Discover one product (first slice)

- **Goal:** visitor moves from catalog/home to one truthful product detail page.
- **Depends on:** M0.
- **Area:** `app/page.tsx`, `app/products/[slug]/page.tsx`, existing styles, `content/products/`.
- **Acceptance:** labeled synthetic fixture supplies stable ID/slug, THB display price, benefits, compatibility, license placeholder and demo-coming-soon disclosure; unknown slug is not-found; no enabled purchase action; keyboard and 360px layout work. Do not present placeholder terms as approved commercial terms.
- **Non-goals:** demos, checkout, storage, new dependencies, design-system framework.
- **Tests:** existing lint/build; manually verify home→detail, unknown slug and keyboard/mobile layout. Add no runner solely for static copy.
- **Lead-review required:** no.

### T02 — Validate public product publication

- **Goal:** enforce the product contract and prevent accidental public asset inclusion.
- **Depends on:** T01.
- **Area:** catalog validation, `content/products/`, focused tests, `.github/workflows/`, contribution guidance.
- **Acceptance:** duplicate IDs/slugs, invalid price and sale-enabled fixture rejected; public projection excludes private fields; CI checks tracked asset signatures/common workbook formats and secret patterns, including renamed ZIP-based workbook fixture; documented provenance review remains mandatory. CI runs existing lint/build and focused tests.
- **Non-goals:** SQL catalog, comprehensive DLP, protected real fixtures.
- **Tests:** valid/invalid catalog fixtures, public projection, synthetic renamed workbook signature and harmless text allow-case; CI job runs successfully.
- **Lead-review required:** no (new dependency still follows escalation).

### T03 — Render a constrained showcase

- **Goal:** turn the showcase v1 contract into a reusable renderer and validator.
- **Depends on:** T02.
- **Area:** `lib/showcase/`, showcase components/tests.
- **Acceptance:** render all contract block types using a tiny synthetic fixture; allowlisted calculator only; reject unknown references/types and invalid defaults; edit, view switch and reset operate without network/persistence; tables accompany charts.
- **Non-goals:** workbook importer, formula language, dynamic plugins, polished product demo.
- **Tests:** invalid manifest cases, malicious text escaping, input bounds/nonfinite values, reset and keyboard control interaction.
- **Lead-review required:** no — implement the fixed manifest/public-code contract; escalate any proposed extension.

### T04 — Demonstrate one useful scenario

- **Goal:** product detail embeds a meaningful, inspectable demo.
- **Depends on:** T03.
- **Area:** `content/showcases/`, one calculator, product detail.
- **Acceptance:** savings fixture from showcase contract (or operator-approved first-product scenario) changes outputs/table/chart together; disclosure and provenance present; scenario/reset supported; calculator errors show recoverable feedback. Fixture remains unsellable.
- **Non-goals:** another full demo, saved scenarios, private workbook extraction.
- **Tests:** default/negative/boundary calculations, scenario/reset, accessible table parity and mobile interaction; inspect network/build for protected references.
- **Lead-review required:** no.

### T05 — Persist a commercial attempt safely

- **Goal:** minimal durable order/payment/grant repository for one test product.
- **Depends on:** T02.
- **Area:** `lib/commerce/`, server database adapter, minimal migrations, integration tests.
- **Acceptance:** immutable order snapshot and attempt references persist; source/event uniqueness enforced; grant transaction API exists; anonymous/browser clients cannot mutate commerce records. Include hashed order credential persistence contract; no auth system yet.
- **Non-goals:** generalized commerce schema, bundles, UI, live infrastructure provisioning without operator configuration.
- **Tests:** fresh migration apply, transaction rollback, uniqueness/concurrency and unauthorized database access using local/test database.
- **Lead-review required:** yes — schema invariants and private-data grants.

### T06 — Start guest hosted checkout

- **Goal:** approved test offer redirects to Stripe with a durable, scoped attempt.
- **Depends on:** T05.
- **Area:** checkout server entry point, offer mapping, guest cookie, provider adapter and minimal test checkout button.
- **Acceptance:** server owns price/version/quantity; stale display asks reconfirmation; same attempt retries return same session after simulated timeout; hashed guest capability set per access contract; test account card and PromptPay options verified or explicitly blocked pending eligibility.
- **Non-goals:** live selling, cart, custom payment fields, entitlement from redirect.
- **Tests:** manipulated IDs/amounts, inactive offer, timeout retry, origin rejection, cookie flags and hash persistence, provider test-mode session.
- **Lead-review required:** yes — browser/provider and guest-credential boundaries.

### T07 — Fulfill verified payment idempotently

- **Goal:** genuine test payment records separate payment and entitlement in one reliable transaction.
- **Depends on:** T06.
- **Area:** webhook route, commerce processor, access grant operation, integration tests.
- **Acceptance:** raw-body verification, paid-state and snapshot matching; exactly one grant for same-event and distinct-event concurrent delivery; rollback remains retryable; mismatches surface as anomalies; late failure cannot erase success; paid completion works with browser closed.
- **Non-goals:** download transport, queues, payment-success claims from client.
- **Tests:** invalid signature, unpaid completion, delayed success/failure, wrong currency/account/environment, duplicate/concurrent events, injected database failure and successful retry.
- **Lead-review required:** yes — payment-to-ownership transition.

### T08 — Show accurate payment and delivery status

- **Goal:** purchaser sees server-derived pending/preparing/ready/failure states.
- **Depends on:** T07.
- **Area:** return page, authorized status endpoint, status UI.
- **Acceptance:** URL alone reveals no order; initiating credential sees only its order, no-store responses; bounded polling and recovery guidance; ready state depends on grant, not query parameters. T09 adds actual download.
- **Non-goals:** auth recovery implementation, client grant creation.
- **Tests:** delayed webhook, forged success query, missing/foreign cookie, polling stop, two-browser cache isolation and keyboard status announcement.
- **Lead-review required:** no — apply established credential contract.

### T09 — Deliver the permitted version

- **Goal:** paid guest receives its immutable file through a short-lived authorized link.
- **Depends on:** T08.
- **Area:** access authorization/issuance endpoint, private storage adapter, download button and audit records.
- **Acceptance:** private synthetic object registered outside repository; only active matching grant gets 60-second link; denial contains no object path; issue/failure events logged safely; no-store/no-referrer and rate limits applied; storage/audit outage yields retry feedback.
- **Non-goals:** real workbook committed to Git, upload UI, DRM, transfer-completion claims.
- **Tests:** anonymous/foreign/revoked/wrong-version requests, direct private-object denial, link expiry, issuance log sanitation, storage failure and valid re-download.
- **Lead-review required:** yes — final private-byte delivery boundary.

### T10 — Explain recovery without leaking purchases

- **Goal:** purchaser has a usable recovery entry and purchase-list view shell before identity wiring.
- **Depends on:** T08.
- **Area:** recovery page, purchase-list presentation and UI tests.
- **Acceptance:** accessible email form, generic request response, pending/empty/error/list states with synthetic view models; real-send control remains disabled until T11; no purchase lookup from typed email.
- **Non-goals:** invented ownership, custom auth, production email delivery.
- **Tests:** validation, keyboard submission, generic empty/nonempty presentation and mobile layout.
- **Lead-review required:** no.

### T11 — Recover and claim purchases passwordlessly

- **Goal:** verified customer recovers purchase on another browser and re-downloads through T09.
- **Depends on:** T09, T10.
- **Area:** Auth integration, callback/session validation, transactional claim, recovery and purchase list.
- **Acceptance:** enable send after provider configuration; verified subject only; claim unclaimed matching destination with canonicalization; never reassign claimed ownership; rate limits and redirect allowlist; owner download and guest download use same entitlement policy.
- **Non-goals:** passwords, social login, automated typo correction/account merge.
- **Tests:** cross-browser end-to-end recovery, expired/replayed credential, unverified email, conflicting owner, concurrent claims, malicious redirect, generic responses and unrelated-email isolation.
- **Lead-review required:** yes — identity-to-entitlement claim.

### T12 — Reconcile incidents and revoke access

- **Goal:** operator can repair missed processing and handle refund/dispute lifecycle safely.
- **Depends on:** T07, T09, T11.
- **Area:** shared payment processor lifecycle handlers, protected operator command/runbook, sanitized structured logs.
- **Acceptance:** reconcile provider references through same processor; show pending/attention orders without exposing secrets; full refund revokes, dispute suspends, audited verified resolution can reinstate; late success cannot undo them; actor/reason/evidence recorded. Document partial-refund/manual support path.
- **Non-goals:** admin app, automated commercial-policy decisions, observability vendor.
- **Tests:** missed webhook reconciliation twice, refund-before-success delivery order, duplicate refund, dispute/reinstatement, unauthorized operator invocation and download denial after revocation.
- **Lead-review required:** yes — lifecycle changes to access rights.

### T13 — Prove release readiness

- **Goal:** close the product release criteria in the configured deployment.
- **Depends on:** T04, T12.
- **Area:** deployment configuration, CI/browser acceptance, release/support runbook and evidence record.
- **Acceptance:** resolve product open gates; configure production email, secrets, rate limits and private storage; exercise card/PromptPay, recovery, failure/repair and secret rotation in staging; complete five-user evaluation and artifact scan; record results and remaining blockers. Live enablement is conditional on all gates.
- **Non-goals:** new features, unapproved policy assumptions, declaring launch from mocks alone.
- **Tests:** complete product/threat-model acceptance matrix, production build, secret/client scan, two-user access tests and operator rehearsal.
- **Lead-review required:** no — verify existing contracts; escalate only if a boundary must change.

## Lead escalation

Lead checkpoints are exactly **T05, T06, T07, T09, T11, T12**. Review the boundary-bearing diff and test evidence once; ordinary follow-up fixes do not require repeated lead review.

Escalate an invariant contradiction, changed security boundary/public contract, new durable dependency/infrastructure, material scope expansion or disproven architecture assumption. Send: task ID, observed evidence, contract affected, smallest proposed change and tradeoff. Resolve ordinary TypeScript, styling, test failures, local refactors and framework syntax using local docs without escalation.

Implementation handoff: complete one task; report changed behavior, acceptance evidence, dependency changes and unresolved blockers. Never mark a milestone complete from mock-only evidence when its exit requires a provider or deployed check. Do not silently implement adjacent tasks. Keep planning and feature commits separate. Direct-main workflow is not established by this repository; default to a branch/PR for delivery.
