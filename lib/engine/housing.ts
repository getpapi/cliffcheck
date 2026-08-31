/**
 * lib/engine/housing.ts — Section 8 / HCV value. Extracted verbatim from calcSection8Value.
 */
import { getState } from './registry';
import type { CalcOpts } from './types';

// ── Section 8 / HCV Value ──────────────────────────────────────────────
// HUD sliding formula: subsidy = max(0, paymentStandard − tenantShare),
// where tenantShare = 30% of monthly adjusted gross income. Zero above the state
// income limit (50% AMI) or when the household has no voucher.
export function calcSection8Value(annualIncome: number, opts?: CalcOpts): number {
  const { stateCode = 'OH', hasVoucher = false } = opts || {};
  const state = getState(stateCode);
  const h = state.housing;
  if (!hasVoucher) return 0;
  if (annualIncome > h.incomeLimitAnnual) return 0;
  const tenantShare = (annualIncome / 12) * h.tenantShareRate;
  return Math.max(0, Math.round((h.paymentStandardMonthly - tenantShare) * 12));
}
