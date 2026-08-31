/**
 * lib/engine/medicaid.ts — Medicaid eligibility + value proxy.
 * Extracted verbatim from isOnMedicaid / calcMedicaidValue.
 */
import { FED } from './federal';
import { getFPL } from './fpl';
import { getState } from './registry';
import type { CalcOpts } from './types';

// ── Medicaid eligibility check (boolean) ───────────────────────────────
// Expansion states: adults eligible ≤ expansionFPL.
// Non-expansion states: parentFPL when household has children, childlessAdultFPL when not.
export function isOnMedicaid(annualIncome: number, familySize: number, opts?: CalcOpts): boolean {
  const { stateCode = 'OH', adultCount = 2 } = opts || {};
  const state = getState(stateCode);
  const fplFraction = annualIncome / getFPL(familySize);
  if (state.medicaid.expanded) {
    return fplFraction <= (state.medicaid.expansionFPL as number);
  }
  // Non-expansion branch: treat adults as parents if household has any children,
  // otherwise as childless. Texas and similar states distinguish sharply between
  // the two (e.g. TX: 18% FPL parents, 0% FPL childless adults).
  const numChildren = Math.max(0, familySize - Math.max(1, Number(adultCount)));
  const threshold =
    numChildren > 0 ? state.medicaid.parentFPL ?? 0 : state.medicaid.childlessAdultFPL ?? 0;
  return fplFraction <= threshold;
}

// ── Medicaid Value (annual dollar proxy for free coverage) ─────────────
// Value proxy = avoided insurance cost (adults × adultAnnualValueProxy).
export function calcMedicaidValue(annualIncome: number, familySize: number, opts?: CalcOpts): number {
  const { stateCode = 'OH', adultCount = 2 } = opts || {};
  if (!isOnMedicaid(annualIncome, familySize, { stateCode, adultCount })) return 0;
  const adults = Math.max(1, Math.min(adultCount, familySize));
  return adults * FED.medicaid.adultAnnualValueProxy;
}
