# BRexcel

BRexcel is an open-source foundation for a future digital-commerce platform
for premium spreadsheet products. It is deliberately at an **early development
and foundation stage**: this repository currently contains project hygiene,
documentation, and a minimal Next.js application shell—not a storefront.

## Product vision

BRexcel is intended to help creators sell high-quality spreadsheet templates
with secure digital delivery and browser-based demonstrations. It is being
designed with Thai customers in mind, including a future path for QR / PromptPay
payments, while retaining room for international payments.

The key product boundary is simple: an interactive preview may demonstrate a
workbook's behavior, but the original paid workbook must never reach a browser
before purchase and download authorization. Authentication alone is insufficient.

## Status

| Area | Status |
| --- | --- |
| Next.js, TypeScript, App Router, and ESLint foundation | Implemented |
| Public repository guidance and Apache-2.0 source licensing | Implemented |
| Product and architecture inception | Documented; implementation pending |
| Storefront, product catalog, and product pages | Not yet implemented |
| Interactive spreadsheet preview engine | Not yet implemented |
| Payment processing, including Stripe Checkout and PromptPay | Not yet implemented |
| Supabase/Postgres, private storage, authentication, entitlements, and secure downloads | Not yet implemented |

## Core principles

- Keep the first solution lightweight before generalizing it.
- Maintain explicit product and security boundaries.
- Never deliver an original paid workbook before purchase and download authorization.
- Treat payment state as server-authoritative when payments are introduced.
- Keep future entitlement state distinct from payment state.
- Keep commercial assets separate from open-source source code.
- Grow architecture from demonstrated product needs.
- Avoid defaulting to a marketplace, CMS, universal Excel runtime, or Shopify clone.
- Prefer boring, understandable technology over speculative abstraction.

## Planning entry points

- [Product scope and release criteria](docs/product.md)
- [Architecture and dependency gates](docs/architecture.md)
- [Threat model](docs/threat-model.md)
- [Milestones, atomic backlog and lead escalation](docs/delivery.md)
- Contracts: [product](docs/contracts/product.md), [showcase](docs/contracts/showcase.md),
  [checkout](docs/contracts/checkout.md), [entitlement](docs/contracts/entitlement.md)
- Decisions: [application](docs/decisions/0001-application-shape.md),
  [commercial assets](docs/decisions/0002-commercial-asset-boundary.md),
  [showcase](docs/decisions/0003-spreadsheet-showcase-strategy.md),
  [commerce and identity](docs/decisions/0004-commerce-and-entitlement-boundary.md)

## Technology direction

The expected direction is Next.js and TypeScript, with Supabase/Postgres,
private Supabase Storage, Stripe Checkout / PromptPay, and GitHub Actions
considered in future phases. These are directional choices only; none of those
integrations are present in this repository today.

## Commercial workbook boundary

This public repository contains no commercial workbook or template assets.
Future production workbooks and downloadable `.xlsx` files must remain outside
the repository and be delivered only through an appropriately authorized,
server-controlled flow. The `.gitignore` blocks common Excel formats to reduce
the risk of accidental inclusion.

## License and commercial assets

The source code and documentation in this repository are licensed under the
[Apache License 2.0](LICENSE). That license does **not** automatically apply to
commercial spreadsheet templates, downloadable `.xlsx` files, proprietary
product content, brand assets, logos, or other commercial assets unless they
are explicitly identified as licensed under it.

## Development

Install dependencies and start the local application:

```bash
npm install
npm run dev
```

For a production verification build:

```bash
npm run lint
npm run build
```

## Contributing

Contributions are welcome once they are scoped to the project's current stage.
Please read [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md)
before opening a pull request or reporting a vulnerability.

## License

Apache License 2.0. See [LICENSE](LICENSE).
