# Product

BRexcel makes premium spreadsheets easier to evaluate and purchase through Thai-friendly commerce and representative browser demos. The platform is OSS; commercial products are separate proprietary assets.

Decision vocabulary throughout these docs: **LOCKED** = expensive or unsafe to violate; **CURRENT** = replaceable MVP choice; **OPEN** = unresolved, with a gate below. Contracts define behavior; ADRs record rationale; [delivery](delivery.md) defines execution.

## Users and journey

| User | Job |
| --- | --- |
| Prospective buyer | Understand compatibility, value, limitations and price; try useful interactions before paying. |
| Purchaser | Receive the correct file after payment and recover access later. |
| Operator | Publish approved products, diagnose failed fulfillment and handle support without editing application code for each incident. |

Discover product → understand value → try representative demo → purchase → verified payment confirmation → entitlement → download → recover purchase later.

**CURRENT:** Thai-first copy and THB pricing, one product per checkout, quantity one, guest purchase. Start with one sellable product; use a clearly labeled synthetic fixture until its content is approved. No invented testimonials, sales claims or live checkout for fixtures. Isolated provider-test fixtures follow the [product contract](contracts/product.md).

## MVP scope

**IN:** storefront/catalog, product detail with compatibility and license summary, one reusable showcase demonstrated by one product, Stripe-hosted card/PromptPay checkout, authoritative payment processing, distinct entitlement, private download, passwordless recovery and purchase list, operator visibility into pending/failed fulfillment, manual support and refund handling through provider tools.

**OUT:** carts, subscriptions, marketplace/multiple sellers, coupons, bundles, gifting, complimentary grants, automated upgrade rights, paid account tiers, full CMS/admin app, workbook upload/conversion, arbitrary Excel formulas/macros, cloud workbook editing, user-saved demo scenarios, native apps, multilingual framework, custom payment forms, automated tax engine, automated refund UI, attribution/marketing platform and DRM. Model identifiers may allow extensions; do not build their workflows.

## Release evidence

- Five Thai target users try the first approved demo; at least four change an input, explain the resulting output, and locate price/compatibility without help. Record confusion and revise before launch.
- Card and PromptPay test purchases each reach authorized download and later recovery on another browser. Cancellation, delayed payment and failed payment do not grant access.
- Security acceptance cases in [threat-model.md](threat-model.md) pass, including concurrent event delivery and cross-customer requests; no protected bytes appear in public build artifacts.
- In a healthy staging run, 10/10 valid paid events yield access within 60 seconds of server receipt. Fault injection leaves a diagnosable, retryable record instead of lost ownership.
- Core journey works by keyboard at 360px and desktop widths; demo charts have readable table equivalents and payment states are announced accessibly.
- Before live sales, operator rehearses a missed webhook recovery and revoked entitlement, and verifies delivery/recovery support instructions. No live payments until M5 exits.

These are launch criteria, not demonstrated results. After launch measure paid-to-delivered failures and support incidents first; set conversion targets only after a meaningful baseline exists.

## Open decisions and gates

| Decision | Owner / deadline |
| --- | --- |
| First workbook, useful demo interaction, price, compatibility, license and support contact | Product owner before replacing fixture / enabling live catalog |
| Merchant eligibility and actual card/PromptPay availability | Operator before T06 provider integration acceptance |
| Selling entity, tax treatment, refund terms and privacy/record retention obligations | Operator with appropriate advice before T13 live release; no jurisdictional assumptions in code |
| Hosting region, storage/egress budget and outbound email provider | Operator before T09/T11 production configuration |

Upgrade rights are fixed to the purchased version for MVP; changing that is a later product decision, not an unresolved implementation choice.
