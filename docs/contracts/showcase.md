# Showcase contract

**CURRENT contract v1.** Public, synthetic representation; never a workbook transport format. A manifest references statically registered calculation logic shipped with the app, not downloadable scripts or evaluated formulas.

| Field | Meaning / restrictions |
| --- | --- |
| `schemaVersion`, `id`, `productId`, `title` | Stable references; only supported schema versions accepted. |
| `disclosure`, `provenance` | What is simulated/omitted; synthetic data origin and public-disclosure review reference. |
| `calculatorId` | Key in a build-time allowlist of public pure functions. No dynamic code, URLs or expression strings. |
| `inputs` | Stable ID, label, number or enum kind, default, numeric bounds/step or allowed options, unit. |
| `views` | Ordered IDs/titles containing blocks; these may look like sheets but do not implement Excel semantics. |
| `blocks` | Text labels, input references, output references, fixed-column tables, or bar/line chart references. Plain text only; chart has a table equivalent. |
| `scenarios` | Named sets of valid input values. Optional; same validation as user edits. |
| `interactions` | Only edit input, select scenario, switch view, reset. State lives in memory. |

Calculation signature: `calculate(validatedInputs) -> { outputs, tables, series }`, keyed by IDs referenced in blocks. It is deterministic, bounded, synchronous and side-effect-free: no network, storage, clock, secrets or commerce. Manifest validation rejects duplicate IDs, unknown references/calculators, invalid defaults and unsupported block types. Reject nonfinite/out-of-range numeric values; present a field error and retain last valid outputs. Calculation failure shows a recoverable error, never misleading partial results. Reset restores defaults and errors.

Illustrative fixture: monthly savings view; inputs `monthlyIncome` and `monthlyExpense` (THB, 0–1,000,000); output `remaining = income - expense`; a two-row income/expense table and matching bar chart. Allow negative remaining. Default 50,000 / 30,000 yields 20,000; 50,000 / 60,000 yields -10,000. This public arithmetic is intentionally not an extracted workbook model.

**Forbidden:** workbook bytes/base64, embedded archives, protected sheets/formulas or named ranges copied without public approval, real customer data, hidden proprietary datasets, private object keys/URLs, credentials, macros, executable strings, external script/asset loaders and export/download of a commercial workbook. Renaming a protected export “demo JSON” does not make it public.

No cell addressing language, dependency graph evaluator, workbook parser, file upload, cross-sheet formula engine or persisted user scenarios. Declare bounded manifests: MVP at most 5 views, 20 inputs and 100 rows per table/series; raise only with a concrete need. Text must be escaped, controls labeled, and keyboard navigation supported. The demo must state that it is representative and identify important differences from the purchased product.
