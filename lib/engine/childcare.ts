/**
 * lib/engine/childcare.ts — childcare subsidy. Extracted verbatim from calcChildcareSubsidy.
 */
import { getFPL } from './fpl';
import { getState } from './registry';
import type { CalcOpts } from './types';

// ── Childcare Subsidy ──────────────────────────────────────────────────
// Entry cliff at state.childcare.entryFPL. Enrolled families exit at exitFPL.
// numChildren = familySize - adultCount (supports single-parent households).
export function calcChildcareSubsidy(annualIncome: number, familySize: number, opts?: CalcOpts): number {
  const { stateCode = 'OH', pfccEnrolled = false, adultCount = 2 } = opts || {};
  const state = getState(stateCode);
  const cc = state.childcare;
  const fpl = getFPL(familySize);
  const fplFraction = annualIncome / fpl;
  const numChildren = Math.max(0, familySize - adultCount);
  const idx = Math.min(numChildren, cc.valuePerChild.length - 1);
  const grossValue = cc.valuePerChild[idx];

  if (grossValue === 0) return 0;

  // Entry: ≤ entryFPL. Continuation for enrolled: ≤ exitFPL.
  const eligible = fplFraction <= cc.entryFPL || (pfccEnrolled && fplFraction <= cc.exitFPL);
  if (!eligible) return 0;

  const coPay = fplFraction <= cc.coPayFreeFPL ? 0 : Math.round(annualIncome * cc.coPayRate);
  return Math.max(0, grossValue - coPay);
}
