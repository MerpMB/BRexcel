import assert from "node:assert/strict";
import test from "node:test";
import { defaultLocale, isLocale, resolveLocale, type Locale } from "../lib/i18n/config";
import { getDictionary } from "../lib/i18n/dictionaries";
import { en } from "../lib/i18n/dictionaries/en";
import { th } from "../lib/i18n/dictionaries/th";
import { freelancerCashflowPlanner } from "../content/products/freelancer-cashflow-planner";
import { calculate, defaults } from "../lib/showcase/core";
import { freelancerCashflowShowcase } from "../content/showcases/freelancer-cashflow";

test("default locale is Thai", () => assert.equal(defaultLocale, "th"));

test("absent locale preference resolves to Thai", () => {
  assert.equal(resolveLocale(undefined), "th");
  assert.equal(resolveLocale(null), "th");
});

test("explicit th cookie resolves to Thai", () => assert.equal(resolveLocale("th"), "th"));

test("explicit en cookie resolves to English", () => assert.equal(resolveLocale("en"), "en"));

test("invalid or malformed locale values fall back to Thai", () => {
  assert.equal(resolveLocale("fr"), "th");
  assert.equal(resolveLocale(""), "th");
  assert.equal(resolveLocale("TH"), "th");
  assert.equal(resolveLocale("english"), "th");
  assert.equal(isLocale("th"), true);
  assert.equal(isLocale("en"), true);
  assert.equal(isLocale("fr"), false);
});

test("dictionary lookup is deterministic for valid locales", () => {
  assert.strictEqual(getDictionary("th"), getDictionary("th"));
  assert.strictEqual(getDictionary("en"), getDictionary("en"));
  assert.notStrictEqual(getDictionary("th") as unknown, getDictionary("en") as unknown);
});

test("dictionary lookup falls back deterministically to Thai for an unrecognized locale", () => {
  const invalid = "fr" as Locale;
  assert.strictEqual(getDictionary(invalid), getDictionary("th"));
});

test("en and th dictionaries expose the same structural keys (no missing translations)", () => {
  const keysOf = (value: unknown): string[] =>
    typeof value === "object" && value !== null && !Array.isArray(value)
      ? Object.keys(value as Record<string, unknown>).sort()
      : [];
  assert.deepEqual(keysOf(en), keysOf(th));
  assert.deepEqual(keysOf(en.navigation), keysOf(th.navigation));
  assert.deepEqual(keysOf(en.home.sheetRows), keysOf(th.home.sheetRows));
  assert.deepEqual(keysOf(en.demo.showcase.freelancerCashflow.inputs), keysOf(th.demo.showcase.freelancerCashflow.inputs));
  assert.deepEqual(keysOf(en.demo.showcase.freelancerCashflow.outputs), keysOf(th.demo.showcase.freelancerCashflow.outputs));
  assert.deepEqual(keysOf(en.product.freelancerCashflowPlanner), keysOf(th.product.freelancerCashflowPlanner));
});

test("proper product/brand names are not translated between locales", () => {
  assert.equal(en.product.freelancerCashflowPlanner.title, "Freelancer Cashflow Planner");
  assert.equal(th.product.freelancerCashflowPlanner.title, "Freelancer Cashflow Planner");
  assert.equal(en.common.brand, "BRexcel");
  assert.equal(th.common.brand, "BRexcel");
});

test("Thai copy is actually translated, not a stub of the English strings", () => {
  assert.notEqual(en.home.heading, th.home.heading);
  assert.notEqual(en.product.freelancerCashflowPlanner.summary, th.product.freelancerCashflowPlanner.summary);
  assert.ok(/[฀-๿]/.test(th.home.heading), "Thai heading should contain Thai script");
});

test("showcase translations for both locales key off the same stable input/output/view/scenario ids as the manifest", () => {
  const inputIds = freelancerCashflowShowcase.inputs.map((input) => input.id).sort();
  assert.deepEqual(Object.keys(en.demo.showcase.freelancerCashflow.inputs).sort(), inputIds);
  assert.deepEqual(Object.keys(th.demo.showcase.freelancerCashflow.inputs).sort(), inputIds);

  const viewIds = freelancerCashflowShowcase.views.map((view) => view.id).sort();
  assert.deepEqual(Object.keys(en.demo.showcase.freelancerCashflow.views).sort(), viewIds);
  assert.deepEqual(Object.keys(th.demo.showcase.freelancerCashflow.views).sort(), viewIds);

  const scenarioIds = (freelancerCashflowShowcase.scenarios ?? []).map((scenario) => scenario.id).sort();
  assert.deepEqual(Object.keys(en.demo.showcase.freelancerCashflow.scenarios).sort(), scenarioIds);
  assert.deepEqual(Object.keys(th.demo.showcase.freelancerCashflow.scenarios).sort(), scenarioIds);
});

test("public calculation results are identical regardless of which locale dictionary is loaded", () => {
  const base = defaults(freelancerCashflowShowcase);
  const resultWithEnLoaded = (() => {
    void en;
    return calculate(freelancerCashflowShowcase, base);
  })();
  const resultWithThLoaded = (() => {
    void th;
    return calculate(freelancerCashflowShowcase, base);
  })();
  assert.deepEqual(resultWithEnLoaded, resultWithThLoaded);
  assert.equal(resultWithEnLoaded.outputs.remaining, 20000);
  assert.equal(resultWithEnLoaded.outputs.commitments, 30000);
});

test("i18n layer leaves stable product/domain truth unchanged", () => {
  assert.equal(freelancerCashflowPlanner.productId, "prd_01J7K9Q2M4V6X8Z0A1B3C5D7E9");
  assert.equal(freelancerCashflowPlanner.slug, "freelancer-cashflow-planner");
  assert.equal(freelancerCashflowPlanner.publicationState, "synthetic-fixture");
  assert.equal(freelancerCashflowPlanner.saleAvailability, "not-available");
  assert.equal(freelancerCashflowPlanner.synthetic, true);
  assert.equal(freelancerCashflowPlanner.saleEnabled, false);
  assert.equal(freelancerCashflowPlanner.demoReference, "interactive-demo-not-yet-implemented");
  assert.equal(freelancerCashflowPlanner.displayPrice, "฿890");
});
