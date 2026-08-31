/**
 * lib/engine/snap.ts — SNAP allotment. Extracted verbatim from calcSnap.
 */
import { FED } from './federal';
import { getFPL } from './fpl';
import { getState } from './registry';
import type { CalcOpts } from './types';

// ── SNAP ───────────────────────────────────────────────────────────────
// Graduated phase-out — not a binary cliff. $0.30 reduction per $1 net income.
// Two binding tests:
//   1) Gross test — household-state's gross limit (130% FPL federal default; 165–200% FPL in BBCE states).
//   2) Net test — 100% FPL after standard, earned-income, and excess-shelter deductions.
// BBCE waives the asset test and raises the gross limit but NEVER waives the net test.
export function calcSnap(annualIncome: number, familySize: number, opts?: CalcOpts): number {
  const { stateCode = 'OH', hasVoucher = false } = opts || {};
  const state = getState(stateCode);
  const fpl = getFPL(familySize);
  const size = Math.min(Math.max(1, familySize), 6);
  const grossMonthly = annualIncome / 12;

  // Gross income test (state BBCE limit)
  if (annualIncome > fpl * state.snap.grossLimitFPL) return 0;

  const stdDed = FED.snap.stdDeduction[size];
  const eid = grossMonthly * FED.snap.eidRate;
  const adjusted = Math.max(0, grossMonthly - stdDed - eid);

  // Excess shelter deduction — shelter cost above 50% of adjusted income, capped.
  // Section 8 voucher holders pay only their tenant share (~30% of income), already
  // covered by housing assistance — modeled with shelter ≈ 0 to avoid double-counting.
  const shelterMonthly = hasVoucher ? 0 : grossMonthly * FED.snap.shelterProxyShare;
  const halfAdjusted = adjusted * 0.5;
  const excessShelter = Math.min(
    FED.snap.excessShelterCap,
    Math.max(0, shelterMonthly - halfAdjusted)
  );

  const netMonthly = Math.max(0, adjusted - excessShelter);

  // Net income test (federal 100% FPL — applies to all households, including BBCE)
  const netLimit = (fpl * FED.snap.netLimitFPL) / 12;
  if (netMonthly > netLimit) return 0;

  const maxBenefit = FED.snap.maxMonthlyBenefit[size];
  const monthly = Math.max(0, maxBenefit - Math.round(netMonthly * FED.snap.benefitReductionRate));
  return monthly * 12;
}
