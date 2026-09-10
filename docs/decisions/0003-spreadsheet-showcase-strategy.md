# 0003 — Spreadsheet showcase strategy

**LOCKED — 2026-09-10:** the commercial workbook and public showcase are different artifacts. **CURRENT:** a small declarative manifest plus deliberately implemented, public calculation functions.

This demonstrates the buying decision's key interactions without distributing the original workbook or building Excel compatibility. Handcraft the first meaningful demo; share presentation/control primitives and prove configuration reuse with a tiny synthetic test fixture. Do not build a second full product demo just to justify abstraction.

Reject workbook parsers, cell formula languages and arbitrary expression evaluation in MVP. Public calculations are inspectable and copyable by design; operator must approve their disclosure. Support a new primitive only when an actual product interaction needs it and the [contract](../contracts/showcase.md) cannot express it.
