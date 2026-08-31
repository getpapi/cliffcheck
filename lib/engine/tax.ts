/**
 * lib/engine/tax.ts — state income tax. Extracted verbatim from calcStateIncomeTax.
 */
import { getState } from './registry';
import type { CalcOpts } from './types';

// ── State Income Tax ───────────────────────────────────────────────────
// Per-state model, gated on STATES.XX.incomeTax presence. States without an
// incomeTax block return 0 (e.g. TX/FL — no state income tax). Two shapes:
//  • flat   — (income − noTaxFloor) × flatRate            (OH, NC, MI, GA, PA)
//  • bracketed — progressive marginal rates over the same post-floor base
//                (income − noTaxFloor), when tax.brackets is present (NY).
// Modelled on gross wages as a proxy for state AGI (user input doesn't capture
// itemised deductions); noTaxFloor folds the standard deduction / credit floor.
// Returned as a positive owed amount; the orchestrator subtracts it from
// totalEffective alongside ACA premium cost.
export function calcStateIncomeTax(annualIncome: number, opts?: CalcOpts): number {
  const { stateCode = 'OH' } = opts || {};
  const state = getState(stateCode);
  const tax = state.incomeTax;
  if (!tax) return 0;
  const taxable = annualIncome - tax.noTaxFloor;
  if (taxable <= 0) return 0;

  // Progressive path: sum marginal rate over each bracket span of the taxable
  // base. Brackets are ascending on the post-floor base; the final entry
  // (upTo: null) is the open-ended top bracket.
  if (tax.brackets && tax.brackets.length > 0) {
    let owed = 0;
    let prev = 0;
    for (const bracket of tax.brackets) {
      const cap = bracket.upTo === null ? taxable : Math.min(bracket.upTo, taxable);
      if (cap > prev) owed += (cap - prev) * bracket.rate;
      prev = cap;
      if (cap >= taxable) break;
    }
    return Math.round(owed);
  }

  // Flat path (unchanged): single rate over the whole taxable base.
  return Math.round(taxable * tax.flatRate);
}
