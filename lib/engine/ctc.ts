/**
 * lib/engine/ctc.ts — Federal Child Tax Credit (IRC §24). Mirrors eitc.ts.
 */
import { FED } from './federal';
import { calcFederalIncomeTax } from './fedTax';
import type { CalcOpts } from './types';

// ── Federal Child Tax Credit (CTC / ACTC) ──────────────────────────────
// FY2026 current law (IRC §24): $2,000 per qualifying child. Returns the
// DELIVERED credit value now that federal income tax IS modelled (task-181):
//  • Non-refundable portion: offsets the household's gross federal income-tax
//    liability (calcFederalIncomeTax), dollar for dollar, up to the credit.
//  • Refundable portion (Additional CTC): whatever credit remains after the
//    offset, capped at $1,700/child (TY2025, Rev. Proc. 2024-40) AND at the
//    15%-of-earned-income-above-$2,500 phase-in — the binding constraint for
//    families with little or no liability.
//  • High-income phase-out: full credit reduced by 5% of income above
//    $400,000 MFJ / $200,000 single — above the modelled band for MFJ, only
//    grazing the $200k chart edge for single filers.
// delivered = offset + refundable. The orchestrator ADDS this value while
// SUBTRACTING the gross federal tax, which nets to the family's true position
// with no double-count (the task-165 findings' subtlety #1; this also
// reconciles the task-164 note that the $1,700/child ACTC cap was previously
// unmodelled — it now binds exactly where the IRS applies it).
// numChildren = familySize − adultCount (no 3-child cap, unlike EITC).
// Income basis: gross wages as the AGI proxy — same simplification as
// eitc.ts / tax.ts / fedTax.ts.
export function calcFederalCTC(annualIncome: number, familySize: number, opts?: CalcOpts): number {
  const { adultCount = 2 } = opts || {};
  const numChildren = Math.max(0, familySize - adultCount);
  if (numChildren === 0 || annualIncome <= 0) return 0;

  const c = FED.ctc;
  const fullCredit = c.perChild * numChildren;

  // High-income phase-out: 5% of income above the filing-status threshold.
  const isMFJ = adultCount >= 2;
  const phaseOutStart = isMFJ ? c.phaseOutStartMFJ : c.phaseOutStartSingle;
  const reduction = Math.max(0, annualIncome - phaseOutStart) * c.phaseOutRate;
  const available = Math.max(0, fullCredit - reduction);
  if (available <= 0) return 0;

  // Non-refundable portion: offsets gross federal income-tax liability.
  const grossTax = calcFederalIncomeTax(annualIncome, familySize, opts);
  const offset = Math.min(grossTax, available);

  // Refundable ACTC: remaining credit, capped per child and by the earned-income
  // phase-in (15% of earned income above $2,500).
  const refundable = Math.min(
    available - offset,
    c.refundableCapPerChild * numChildren,
    c.phaseInRate * Math.max(0, annualIncome - c.earnedFloor)
  );

  return Math.max(0, Math.round(offset + refundable));
}
