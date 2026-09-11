"use client";

import Link from "next/link";
import { useState } from "react";
import { calculate, coerceInput, defaults, type Manifest } from "@/lib/showcase/core";

type ShowcaseProps = {
  manifest: Manifest;
  variant?: "default" | "lab";
};

const formatValue = (value: number, maximumFractionDigits = 0) =>
  value.toLocaleString("th-TH", { maximumFractionDigits });

export function Showcase({ manifest, variant = "default" }: ShowcaseProps) {
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
      setError(`${input.label} must be between ${formatValue(input.min)} and ${formatValue(input.max)}.`);
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
        if (block.type === "text") return <p key={block.id} className="showcase-copy">{block.text}</p>;
        if (block.type === "input") {
          const input = manifest.inputs.find((item) => item.id === block.inputId);
          if (!input) return null;
          return (
            <label className="showcase-input" key={block.id}>
              <span>{input.label}</span>
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
          const suffix = block.outputId === "savingsRate" ? "%" : " THB";
          return (
            <p className="showcase-output" key={block.id}>
              <span>{block.label}</span>
              <strong>{formatValue(result.outputs[block.outputId])}{suffix}</strong>
            </p>
          );
        }
        const rows = result.tables[block.tableId] ?? [];
        if (block.type === "table") {
          return (
            <div className="showcase-table-wrap" key={block.id}>
              <table>
                <thead><tr>{block.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
                <tbody>{rows.map((row) => <tr key={row.label}><td>{row.label}</td><td>{formatValue(row.value)}</td></tr>)}</tbody>
              </table>
            </div>
          );
        }
        const maximum = Math.max(...rows.map((row) => Math.abs(row.value)), 1);
        return (
          <div className="showcase-chart" key={block.id} aria-label={block.label}>
            {rows.map((row) => (
              <div key={row.label}>
                <span>{row.label}</span>
                <i><b style={{ width: `${Math.abs(row.value) / maximum * 100}%` }} /></i>
                <strong>{formatValue(row.value)}</strong>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );

  if (variant !== "lab") {
    return (
      <section className="showcase showcase--default" aria-labelledby={`${manifest.id}-title`}>
        <p className="eyebrow">Interactive product showcase</p>
        <h2 id={`${manifest.id}-title`}>{manifest.title}</h2>
        <p className="showcase-disclosure">{manifest.disclosure}</p>
        <div className="showcase-controls">
          {manifest.scenarios?.map((scenario) => (
            <button key={scenario.id} type="button" onClick={() => { setValues(scenario.values); setError(""); }}>
              {scenario.title}
            </button>
          ))}
        </div>
        <div className="showcase-tabs" role="tablist" aria-label="Showcase views">
          {manifest.views.map((item) => (
            <button key={item.id} type="button" role="tab" aria-selected={view === item.id} onClick={() => setView(item.id)}>
              {item.title}
            </button>
          ))}
        </div>
        {error && <p className="showcase-error" role="alert">{error}</p>}
        {renderActiveBlocks()}
        <button className="showcase-reset" type="button" onClick={reset}>Reset fixture</button>
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
    <section className="showcase showcase--lab" aria-label={manifest.title}>
      <div className="lab-view-tabs" role="tablist" aria-label="Demo views">
        {manifest.views.map((item) => (
          <button key={item.id} type="button" role="tab" aria-selected={view === item.id} onClick={() => setView(item.id)}>
            {item.title}
          </button>
        ))}
      </div>
      {error && <p className="showcase-error" role="alert">{error}</p>}

      {view === manifest.views[0].id ? (
        <div className="lab-grid">
          <div className="lab-panel lab-panel--input">
            <p className="panel-label">01 · Input · THB / month</p>
            <div className="lab-inputs">
              {manifest.inputs.map((input, index) => (
                <label key={input.id}>
                  <span>{input.label}</span>
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
            <div className="scenario-buttons" aria-label="Preset scenarios">
              {manifest.scenarios?.map((scenario) => (
                <button
                  key={scenario.id}
                  type="button"
                  aria-pressed={Object.entries(scenario.values).every(([key, value]) => values[key] === value)}
                  onClick={() => { setValues(scenario.values); setError(""); }}
                >
                  {scenario.title}
                </button>
              ))}
              <button type="button" onClick={reset}>Reset</button>
            </div>
          </div>

          <div className="lab-panel lab-panel--calculation">
            <p className="panel-label">02 · Calculation</p>
            <div className="formula-list">
              <div><span>{formatValue(essential)} + {formatValue(flexible)} + {formatValue(debt)}</span><b>{formatValue(commitments)}</b></div>
              <div><span>{formatValue(income)} − {formatValue(commitments)}</span><b className="orange-value">{formatValue(remaining)}</b></div>
              <div><span>{formatValue(remaining)} ÷ {formatValue(income)}</span><b>{formatValue(savingsRate, 1)}%</b></div>
              <div><span>Target gap</span><b>{formatValue(targetGap)}</b></div>
            </div>
            <div className="lab-bars" aria-label="Cashflow comparison">
              {[
                ["Income", income, "income"],
                ["Committed", commitments, "committed"],
                ["Remaining", remaining, "remaining"],
              ].map(([label, value, tone]) => (
                <div key={String(label)}>
                  <span>{label}</span>
                  <i><b className={`bar--${tone}`} style={{ width: `${Math.abs(Number(value)) / maxBarValue * 100}%` }} /></i>
                  <strong>{formatValue(Number(value))}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="lab-panel lab-panel--result">
            <p className="panel-label">03 · Result</p>
            <span className="result-intro">This month leaves</span>
            <div className="result-value"><strong>{formatValue(remaining)}</strong><span>THB</span></div>
            <p className="result-summary">
              A {formatValue(savingsRate, 1)}% savings rate — {targetGap === 0 ? `the ${formatValue(target)} target is covered.` : `${formatValue(targetGap)} THB short of the target.`}
            </p>
            <dl className="result-details">
              <div><dt>Total commitments</dt><dd>{formatValue(commitments)}</dd></div>
              <div><dt>Savings rate</dt><dd>{formatValue(savingsRate, 1)}%</dd></div>
              {tightRemaining !== null && <div><dt>Tight month</dt><dd>{formatValue(tightRemaining)}</dd></div>}
            </dl>
            <Link className="button button--lab" href="/products/freelancer-cashflow-planner">Open full product</Link>
          </div>
        </div>
      ) : (
        <div className="lab-breakdown">{renderActiveBlocks()}</div>
      )}
    </section>
  );
}
