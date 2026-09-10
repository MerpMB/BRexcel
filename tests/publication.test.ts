import assert from "node:assert/strict";
import test from "node:test";
import { freelancerCashflowPlanner } from "../content/products/freelancer-cashflow-planner";
import { createPublicCatalog, validateCatalog } from "../lib/catalog/publication";
import { containsSecret, isWorkbookLike } from "../scripts/validate-publication";

const valid = () => ({ ...freelancerCashflowPlanner, benefits: [...freelancerCashflowPlanner.benefits], compatibility: [...freelancerCashflowPlanner.compatibility] });
test("valid synthetic catalog passes", () => assert.doesNotThrow(() => validateCatalog([valid()])));
test("duplicate IDs and slugs fail", () => { assert.throws(() => validateCatalog([valid(), valid()])); assert.throws(() => validateCatalog([valid(), { ...valid(), productId: "prd_02A" }])); });
test("invalid prices fail", () => { assert.throws(() => validateCatalog([{ ...valid(), displayPrice: "free" }])); assert.throws(() => validateCatalog([{ ...valid(), displayPrice: "฿0" }])); });
test("synthetic sale-enabled products fail", () => assert.throws(() => validateCatalog([{ ...valid(), saleEnabled: true, saleAvailability: "available" }])));
test("public projection excludes internal fields", () => { const product = createPublicCatalog([valid()])[0]; assert.equal("internalSource" in product, false); assert.equal("saleEnabled" in product, false); });
test("workbook guard detects extensions and renamed synthetic ZIP signature", () => { assert.equal(isWorkbookLike("asset.xlsx", Buffer.from("text")), true); assert.equal(isWorkbookLike("fixture.bin", Buffer.from("PK fake [Content_Types].xml xl/workbook.xml")), true); assert.equal(isWorkbookLike("notes.zip", Buffer.from("PK harmless archive")), false); });
test("secret guard rejects credentials but allows normal content", () => { assert.equal(containsSecret("STRIPE" + "_SECRET_KEY=" + "sk_test_" + "123"), true); assert.equal(containsSecret("Synthetic fixture documentation"), false); });
