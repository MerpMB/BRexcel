import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { validateCatalog } from "../lib/catalog/publication";
import { freelancerCashflowPlanner } from "../content/products/freelancer-cashflow-planner";

const workbookExtension = /\.(xlsx|xlsm|xls)$/i;
const secretPatterns = [/\bsk_(live|test)_[A-Za-z0-9]+\b/, /\bAKIA[0-9A-Z]{16}\b/, /(?:STRIPE|SUPABASE)_[A-Z0-9_]*(?:KEY|TOKEN|SECRET)\s*=\s*[^\s]+/i, /postgres(?:ql)?:\/\/[^\s:@/]+:[^\s@/$]+@[^\s/]+(?:\/[^\s?#]+)?/i];

export function isWorkbookLike(path: string, bytes: Buffer) {
  return workbookExtension.test(path) || (bytes.subarray(0, 2).toString() === "PK" && bytes.includes(Buffer.from("[Content_Types].xml")) && bytes.includes(Buffer.from("xl/workbook.xml")));
}

export function containsSecret(text: string) { return secretPatterns.some((pattern) => pattern.test(text)); }

export function validateRepository(root = process.cwd()) {
  validateCatalog([freelancerCashflowPlanner]);
  const files = execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8" }).trim().split(/\r?\n/).filter(Boolean);
  for (const file of files) {
    const bytes = readFileSync(resolve(root, file));
    if (isWorkbookLike(file, bytes)) throw new Error(`Protected workbook-like asset: ${file}`);
    if (containsSecret(bytes.toString("utf8"))) throw new Error(`Potential secret in tracked file: ${file}`);
  }
}

if (process.argv[1]?.endsWith("validate-publication.js")) validateRepository();
