"use client";

import Link from "next/link";
import { useState } from "react";
import { calculate, coerceInput, defaults, type Manifest } from "@/lib/showcase/core";
import type { Locale } from "@/lib/i18n/config";

export type ShowcaseCopy = {
  interactiveShowcase: string;
  showcaseViewsAriaLabel: string;
  demoViewsAriaLabel: string;
  presetScenariosAriaLabel: string;
  cashflowComparisonAriaLabel: string;
  resetFixture: string;
  reset: string;
  panelInput: string;
  panelCalculation: string;
  panelResult: string;
  resultIntro: string;
  targetGap: string;
  totalCommitments: string;
  savingsRate: string;
  tightMonth: string;
  openFullProduct: string;
  barIncome: string;
  barCommitted: string;
  barRemaining: string;
  /** Template strings interpolated client-side; placeholders in {curly} braces. */
  resultCoveredTemplate: string;
  resultShortTemplate: string;
  rangeErrorTemplate: string;
};

function format(template: string, vars: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (match, key) => vars[key] ?? match);
}

const defaultCopy: ShowcaseCopy = {
  interactiveShowcase: "Interactive product showcase",
  showcaseViewsAriaLabel: "Showcase views",
  demoViewsAriaLabel: "Demo views",
  presetScenariosAriaLabel: "Preset scenarios",
  cashflowComparisonAriaLabel: "Cashflow comparison",
  resetFixture: "Reset fixture",
  reset: "Reset",
  panelInput: "01 · Input · THB / month",
  panelCalculation: "02 · Calculation",
  panelResult: "03 · Result",
  resultIntro: "This month leaves",
  targetGap: "Target gap",
  totalCommitments: "Total commitments",
  savingsRate: "Savings rate",
  tightMonth: "Tight month",
  openFullProduct: "Open full product",
  barIncome: "Income",
  barCommitted: "Committed",
  barRemaining: "Remaining",
  resultCoveredTemplate: "A {rate}% savings rate — the {target} target is covered.",
  resultShortTemplate: "A {rate}% savings rate — {gap} THB short of the target.",
  rangeErrorTemplate: "{label} must be between {min} and {max}.",
};

type ShowcaseProps = {
  manifest: Manifest;
  variant?: "default" | "lab";
  locale?: Locale;
  title?: string;
  disclosure?: string;
  copy?: ShowcaseCopy;
  /** Manifest id (input/block/view/scenario) -> localized label. Falls back to the manifest's own label. */
  labels?: Record<string, string>;
  /** Calculator-returned row label (e.g. "Income") -> localized label. Falls back to the row label itself. */
  rowLabels?: Record<string, string>;
  tableColumns?: readonly string[];
};

export function Showcase({
  manifest,
  variant = "default",
  locale = "th",
  title,
  disclosure,
  copy,
  labels,
  rowLabels,
  tableColumns,
}: ShowcaseProps) {
  const c = { ...defaultCopy, ...copy };
  const label = (id: string, fallback: string) => labels?.[id] ?? fallback;
  const rowLabel = (text: string) => rowLabels?.[text] ?? text;
  const numberLocale = locale === "en" ? "en-US" : "th-TH";
  const formatValue = (value: number, maximumFractionDigits = 0) =>
    value.toLocaleString(numberLocale, { maximumFractionDigits });

  const base = defaults(manifest);
  const [values, setValues] = useState(base);
  const [view, setView] = useState(manifest.views[0].id);
  const [error, setError] = useState("");
  const result = calculate(manifest, values);
  const active = manifest.views.find((item) => item.id === view) ?? manifest.views[0];

  const update = (id: string, raw: string) => {
    const input = manifest.inputs.find((item) => item.id === id);
    if (!input) return;
    const value = coerceInput(input, Number(raw));
    if (value === null) {
      setError(format(c.rangeErrorTemplate, { label: label(input.id, input.label), min: formatValue(input.min), max: formatValue(input.max) }));
      return;
    }
    setError("");
    setValues({ ...values, [id]: value });
  };

  const reset = () => {
    setValues(base);
    setError("");
  };

  const renderActiveBlocks = () => (
    <div className="showcase-blocks">
      {active.blocks.map((block) => {
        if (block.type === "text") return <p key={block.id} className="showcase-copy">{label(block.id, block.text)}</p>;
        if (block.type === "input") {
          const input = manifest.inputs.find((item) => item.id === block.inputId);
          if (!input) return null;
          return (
            <label className="showcase-input" key={block.id}>
              <span>{label(input.id, input.label)}</span>
              <span className="showcase-input__control">
                <input
                  type="number"
                  value={values[input.id]}
                  min={input.min}
                  max={input.max}
                  step={input.step}
                  onChange={(event) => update(input.id, event.target.value)}
                />
                <small>{input.unit}</small>
              </span>
            </label>
          );
        }
        if (block.type === "output") {
          const isSavingsRate = block.outputId === "savingsRate";
          const suffix = isSavingsRate ? "%" : " THB";
          return (
            <p className="showcase-output" key={block.id}>
              <span>{label(block.id, block.label)}</span>
              <strong>{formatValue(result.outputs[block.outputId], isSavingsRate ? 1 : 0)}{suffix}</strong>
            </p>
          );
        }
        const rows = result.tables[block.tableId] ?? [];
        if (block.type === "table") {
          const columns = tableColumns ?? block.columns;
          return (
            <div className="showcase-table-wrap" key={block.id}>
              <table>
                <thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
                <tbody>{rows.map((row) => <tr key={row.label}><td>{rowLabel(row.label)}</td><td>{formatValue(row.value)}</td></tr>)}</tbody>
              </table>
            </div>
          );
        }
        const maximum = Math.max(...rows.map((row) => Math.abs(row.value)), 1);
        return (
          <div className="showcase-chart" key={block.id} aria-label={label(block.id, block.label)}>
            {rows.map((row) => (
              <div key={row.label}>
                <span>{rowLabel(row.label)}</span>
                <i><b style={{ width: `${Math.abs(row.value) / maximum * 100}%` }} /></i>
                <strong>{formatValue(row.value)}</strong>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );

  const resolvedTitle = title ?? manifest.title;
  const resolvedDisclosure = disclosure ?? manifest.disclosure;

  if (variant !== "lab") {
    return (
      <section className="showcase showcase--default" aria-labelledby={`${manifest.id}-title`}>
        <p className="eyebrow">{c.interactiveShowcase}</p>
        <h2 id={`${manifest.id}-title`}>{resolvedTitle}</h2>
        <p className="showcase-disclosure">{resolvedDisclosure}</p>
        <div className="showcase-controls">
          {manifest.scenarios?.map((scenario) => (
            <button key={scenario.id} type="button" onClick={() => { setValues(scenario.values); setError(""); }}>
              {label(scenario.id, scenario.title)}
            </button>
          ))}
        </div>
        <div className="showcase-tabs" role="tablist" aria-label={c.showcaseViewsAriaLabel}>
          {manifest.views.map((item) => (
            <button key={item.id} type="button" role="tab" aria-selected={view === item.id} onClick={() => setView(item.id)}>
              {label(item.id, item.title)}
            </button>
          ))}
        </div>
        {error && <p className="showcase-error" role="alert">{error}</p>}
        {renderActiveBlocks()}
        <button className="showcase-reset" type="button" onClick={reset}>{c.resetFixture}</button>
      </section>
    );
  }

  const income = values.monthlyIncome ?? 0;
  const essential = values.essentialExpenses ?? 0;
  const flexible = values.flexibleExpenses ?? 0;
  const debt = values.monthlyCommitments ?? 0;
  const target = values.savingsTarget ?? 0;
  const commitments = result.outputs.commitments ?? 0;
  const remaining = result.outputs.remaining ?? 0;
  const savingsRate = result.outputs.savingsRate ?? 0;
  const targetGap = result.outputs.targetGap ?? 0;
  const tightScenario = manifest.scenarios?.find((scenario) => scenario.id === "tight");
  const tightRemaining = tightScenario ? calculate(manifest, tightScenario.values).outputs.remaining : null;
  const maxBarValue = Math.max(Math.abs(income), Math.abs(commitments), Math.abs(remaining), 1);

  return (
    <section className="showcase showcase--lab" aria-label={resolvedTitle}>
      <div className="lab-view-tabs" role="tablist" aria-label={c.demoViewsAriaLabel}>
        {manifest.views.map((item) => (
          <button key={item.id} type="button" role="tab" aria-selected={view === item.id} onClick={() => setView(item.id)}>
            {label(item.id, item.title)}
          </button>
        ))}
      </div>
      {error && <p className="showcase-error" role="alert">{error}</p>}

      {view === manifest.views[0].id ? (
        <div className="lab-grid">
          <div className="lab-panel lab-panel--input">
            <p className="panel-label">{c.panelInput}</p>
            <div className="lab-inputs">
              {manifest.inputs.map((input, index) => (
                <label key={input.id}>
                  <span>{label(input.id, input.label)}</span>
                  <span className={index === 0 ? "lab-input lab-input--selected" : "lab-input"}>
                    <input
                      type="number"
                      value={values[input.id]}
                      min={input.min}
                      max={input.max}
                      step={input.step}
                      onChange={(event) => update(input.id, event.target.value)}
                    />
                    <small>{input.unit}</small>
                  </span>
                </label>
              ))}
            </div>
            <div className="scenario-buttons" aria-label={c.presetScenariosAriaLabel}>
              {manifest.scenarios?.map((scenario) => (
                <button
                  key={scenario.id}
                  type="button"
                  aria-pressed={Object.entries(scenario.values).every(([key, value]) => values[key] === value)}
                  onClick={() => { setValues(scenario.values); setError(""); }}
                >
                  {label(scenario.id, scenario.title)}
                </button>
              ))}
              <button type="button" onClick={reset}>{c.reset}</button>
            </div>
          </div>

          <div className="lab-panel lab-panel--calculation">
            <p className="panel-label">{c.panelCalculation}</p>
            <div className="formula-list">
              <div><span>{formatValue(essential)} + {formatValue(flexible)} + {formatValue(debt)}</span><b>{formatValue(commitments)}</b></div>
              <div><span>{formatValue(income)} − {formatValue(commitments)}</span><b className="orange-value">{formatValue(remaining)}</b></div>
              <div><span>{formatValue(remaining)} ÷ {formatValue(income)}</span><b>{formatValue(savingsRate, 1)}%</b></div>
              <div><span>{c.targetGap}</span><b>{formatValue(targetGap)}</b></div>
            </div>
            <div className="lab-bars" aria-label={c.cashflowComparisonAriaLabel}>
              {[
                [c.barIncome, income, "income"],
                [c.barCommitted, commitments, "committed"],
                [c.barRemaining, remaining, "remaining"],
              ].map(([barLabel, value, tone]) => (
                <div key={String(tone)}>
                  <span>{barLabel}</span>
                  <i><b className={`bar--${tone}`} style={{ width: `${Math.abs(Number(value)) / maxBarValue * 100}%` }} /></i>
                  <strong>{formatValue(Number(value))}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="lab-panel lab-panel--result">
            <p className="panel-label">{c.panelResult}</p>
            <span className="result-intro">{c.resultIntro}</span>
            <div className="result-value"><strong>{formatValue(remaining)}</strong><span>THB</span></div>
            <p className="result-summary">
              {targetGap === 0
                ? format(c.resultCoveredTemplate, { rate: formatValue(savingsRate, 1), target: formatValue(target) })
                : format(c.resultShortTemplate, { rate: formatValue(savingsRate, 1), gap: formatValue(targetGap) })}
            </p>
            <dl className="result-details">
              <div><dt>{c.totalCommitments}</dt><dd>{formatValue(commitments)}</dd></div>
              <div><dt>{c.savingsRate}</dt><dd>{formatValue(savingsRate, 1)}%</dd></div>
              {tightRemaining !== null && <div><dt>{c.tightMonth}</dt><dd>{formatValue(tightRemaining)}</dd></div>}
            </dl>
            <Link className="button button--lab" href="/products/freelancer-cashflow-planner">{c.openFullProduct}</Link>
          </div>
        </div>
      ) : (
        <div className="lab-breakdown">{renderActiveBlocks()}</div>
      )}
    </section>
  );
}
