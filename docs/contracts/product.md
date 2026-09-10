# Product contract

**CURRENT contract v1.** Conceptual records, not a prescribed SQL schema.

| Concept | Minimum meaning |
| --- | --- |
| Product | Stable opaque `productId`; changeable unique public slug; title, Thai summary, benefits, compatibility, license summary, demo reference and publication state. IDs survive slug/title changes. |
| Product version | Immutable `versionId` belonging to one product; release label/date, file checksum, size and private object reference. Replacing bytes requires a new version. Public projection excludes object reference. |
| Sale offer | Server-owned mapping of product + version + active provider price + integer minor-unit amount + currency. MVP: THB, one item, quantity one; no browser-set price. |

Public detail shows price, supported spreadsheet applications/versions, limitations, license/support terms and showcase omissions. Displayed price is informational; checkout revalidates the current offer and asks for confirmation if it changed. Do not silently charge a different amount.

Published does not imply purchasable. Fixture, retired, missing-version or inactive-price products cannot initiate checkout. Unknown slugs yield not-found. Checkout verifies product/version/offer association together; a product ID does not authorize an arbitrary version.

Test environments may use a separate synthetic offer/version registry with Stripe test prices and private synthetic files; it must be impossible to select that registry in live checkout. The public storefront fixture is never live-sale-enabled. T06 registers its synthetic version before starting checkout; T09 adds buyer delivery, not initial file registration.

Operator publishes public content through review and registers protected files separately. A product becomes sale-enabled only after private version integrity and offer mapping are verified. Order snapshots preserve product/version, amount, currency and applicable terms even after retirement. Retirement stops new purchases, not existing downloads; access exceptions require explicit revocation under [entitlement](entitlement.md).
