/**
 * lib/engine/eitc.ts — Federal EITC. Extracted verbatim from calcFederalEITC.
 */
import { FED } from './federal';
import type { CalcOpts } from './types';

// ── Federal EITC ───────────────────────────────────────────────────────
// Three-region piecewise: phase-in (linear up to maxCredit), plateau (flat),
// phase-out (linear down to zero). Uses earned income for phase-in; phase-out
// uses max(earned, AGI) per IRS — for our wage-only model, earned == AGI.
// numChildren derived from familySize - adultCount, clamped to 0–3+.
// Filing status derived from adultCount: 2 = MFJ, 1 = single (head-of-household
// EITC parameters match single, so we collapse them).
export function calcFederalEITC(annualIncome: number, familySize: number, opts?: CalcOpts): number {
  const { adultCount = 2 } = opts || {};
  const numChildren = Math.max(0, Math.min(3, familySize - adultCount));
  const isMFJ = adultCount >= 2;
  const p = FED.eitc[numChildren];
  if (!p || annualIncome <= 0) return 0;

  // Phase-in: linear from $0 up to earnedAmt.
  if (annualIncome <= p.earnedAmt) {
    return Math.round(annualIncome * p.phaseInRate);
  }
  // Phase-out: starts at phaseOutStart{Single|MFJ}, ends when credit hits zero.
  const phaseOutStart = isMFJ ? p.phaseOutStartMFJ : p.phaseOutStartSingle;
  if (annualIncome > phaseOutStart) {
    const reduction = (annualIncome - phaseOutStart) * p.phaseOutRate;
    return Math.max(0, Math.round(p.maxCredit - reduction));
  }
  // Plateau: flat at max credit between earnedAmt and phaseOutStart.
  return p.maxCredit;
}
