/**
 * lib/engine/aca.ts — ACA premium (PTC) and Cost-Sharing Reduction.
 * Extracted verbatim from _acaApplicablePct / calcACAPremium / calcACACSR.
 */
import { FED } from './federal';
import { getFPL } from './fpl';
import { getState } from './registry';
import type { CalcOpts } from './types';

// ── ACA applicable percentage (piecewise linear interpolation) ─────────
function _acaApplicablePct(fplFraction: number): number {
  const t = FED.aca.pctTable;
  if (fplFraction <= t[0][0]) return t[0][1];
  if (fplFraction >= t[t.length - 1][0]) return t[t.length - 1][1];
  for (let i = 1; i < t.length; i++) {
    if (fplFraction <= t[i][0]) {
      const [x0, y0] = t[i - 1];
      const [x1, y1] = t[i];
      return y0 + ((y1 - y0) * (fplFraction - x0)) / (x1 - x0);
    }
  }
  return t[t.length - 1][1];
}

// ── ACA Premium Cost (annual expense, positive value) ──────────────────
// Hard cliff at 400% FPL: below = subsidised; above = full premium.
export function calcACAPremium(annualIncome: number, familySize: number, opts?: CalcOpts): number {
  const { stateCode = 'OH' } = opts || {};
  const state = getState(stateCode);
  const fpl = getFPL(familySize);
  const fplFraction = annualIncome / fpl;
  const size = Math.min(Math.max(1, familySize), 6);
  const slcsp = state.aca.slcspMonthly;
  const slcspAnnual = (slcsp[size] || slcsp[6]) * 12;

  // Below 100% FPL → Medicaid; no ACA cost
  if (fplFraction < FED.aca.eligibleFPLMin) return 0;

  // Basic Health Program (ACA §1331) tier — currently only NY's Essential Plan.
  // While income sits inside the EP window the household pays the near-$0 EP
  // premium instead of the marketplace PTC contribution. Crossing maxFPL drops
  // it into full marketplace premiums — the SECOND cliff. Guarded on the state
  // actually declaring aca.essentialPlan, so every other state falls straight
  // through to the unchanged PTC math (regression-guarded, byte-identical).
  const ep = state.aca.essentialPlan;
  if (ep && fplFraction <= ep.maxFPL) return Math.round(ep.monthlyPremium * 12);

  // Above 400% FPL → no PTC; pay full premium (hard cliff). At exactly 400% PTC still applies.
  if (fplFraction > FED.aca.cliffFPL) return slcspAnnual;

  const contribution = Math.round(annualIncome * _acaApplicablePct(fplFraction));
  return Math.min(contribution, slcspAnnual);
}

// ── ACA Cost-Sharing Reduction (annual effective value, positive) ──────
// CSR reduces cost-sharing (deductible/copay/OOP-max) for Silver-plan
// enrollees below 250% FPL. Modelled as an additive *effective value*
// (annual avoided out-of-pocket cost), distinct from the premium tax
// credit handled by calcACAPremium. Eligibility mirrors PTC: only when
// the household is on the marketplace (i.e. acaCost > 0 in the
// orchestrator), so getEffectiveTakeHome gates this call. Returns 0
// outside the CSR window (<100% FPL Medicaid, ≥250% FPL no CSR, >400%
// FPL premium cliff). Silver plan assumed (federal benchmark default).
export function calcACACSR(annualIncome: number, familySize: number): number {
  const fpl = getFPL(familySize);
  const fplFraction = annualIncome / fpl;
  if (fplFraction < FED.aca.eligibleFPLMin) return 0;
  const tier = FED.aca.csr.tiers.find((t) => fplFraction <= t.maxFPL);
  if (!tier) return 0;
  const size = Math.min(Math.max(1, familySize), 6);
  return tier.perEnrolleeAnnual * size;
}
