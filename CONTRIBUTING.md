# Contributing to BRexcel

Thank you for considering a contribution. BRexcel is at its foundation stage,
so small, well-scoped improvements to documentation, project hygiene, and
future implementation are especially valuable.

## Before opening a pull request

- Discuss significant architectural or product changes in an issue first.
- Keep changes focused and avoid adding speculative dependencies or abstractions.
- Do not commit credentials, customer data, payment details, or commercial
  spreadsheet files.
- Use synthetic fixtures only; original workbooks never belong in this repository.
- Run the relevant checks documented in `package.json` before submitting.

Run `npm run validate:publication` before changing public product metadata. It
rejects invalid catalog entries, obvious secrets, and workbook-like assets.
Resolve the reported source issue rather than bypassing the check.

## Code and documentation

Use the repository's `.editorconfig` conventions. Write clear commit messages,
document behavior that is not obvious from the code, and keep README claims
aligned with the implementation.

By contributing, you agree that your contributions are licensed under the
[Apache License 2.0](LICENSE).
