import type { ShowcaseCopy } from "@/components/showcase/Showcase";
import type { Messages } from "./dictionaries/en";

/**
 * Maps the localized freelancer-cashflow showcase copy onto the manifest's stable
 * ids (input/block/view/scenario ids) and the calculator's stable row labels.
 * The manifest itself (content/showcases/freelancer-cashflow.ts) and the calculator
 * (lib/showcase/core.ts) stay locale-neutral — only this presentation mapping changes.
 */
export function getFreelancerCashflowShowcaseProps(messages: Messages) {
  const fc = messages.demo.showcase.freelancerCashflow;

  const copy: ShowcaseCopy = {
    interactiveShowcase: messages.demo.showcase.interactiveShowcase,
    resetFixture: messages.demo.showcase.resetFixture,
    reset: messages.demo.showcase.reset,
    panelInput: messages.demo.showcase.panelInput,
    panelCalculation: messages.demo.showcase.panelCalculation,
    panelResult: messages.demo.showcase.panelResult,
    resultIntro: messages.demo.showcase.resultIntro,
    targetGap: messages.demo.showcase.targetGap,
    totalCommitments: messages.demo.showcase.totalCommitments,
    savingsRate: messages.demo.showcase.savingsRate,
    tightMonth: messages.demo.showcase.tightMonth,
    openFullProduct: messages.demo.showcase.openFullProduct,
    barIncome: messages.demo.showcase.barIncome,
    barCommitted: messages.demo.showcase.barCommitted,
    barRemaining: messages.demo.showcase.barRemaining,
    resultCoveredTemplate: messages.demo.showcase.resultCoveredTemplate,
    resultShortTemplate: messages.demo.showcase.resultShortTemplate,
    rangeErrorTemplate: messages.demo.showcase.rangeErrorTemplate,
  };

  const labels: Record<string, string> = {
    monthlyIncome: fc.inputs.monthlyIncome,
    essentialExpenses: fc.inputs.essentialExpenses,
    flexibleExpenses: fc.inputs.flexibleExpenses,
    monthlyCommitments: fc.inputs.monthlyCommitments,
    savingsTarget: fc.inputs.savingsTarget,
    remaining: fc.outputs.remaining,
    commitments: fc.outputs.commitments,
    rate: fc.outputs.savingsRate,
    gap: fc.outputs.targetGap,
    cashflow: fc.views.cashflow,
    breakdown: fc.views.breakdown,
    typical: fc.scenarios.typical,
    tight: fc.scenarios.tight,
    intro: fc.introText,
    chart: fc.chartLabel,
  };

  const rowLabels: Record<string, string> = {
    Income: fc.rows.income,
    Commitments: fc.rows.commitments,
    Remaining: fc.rows.remaining,
  };

  return {
    title: fc.title,
    disclosure: fc.disclosure,
    copy,
    labels,
    rowLabels,
    tableColumns: [fc.tableColumns.category, fc.tableColumns.thb] as const,
  };
}
