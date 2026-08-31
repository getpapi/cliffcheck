/**
 * lib/engine/fedTax.ts — FICA + federal income tax (task-181, Option C).
 *
 * Closes the net-paycheck honesty gap: "take-home" previously subtracted state
 * income tax but not FICA (7.65%) or federal income tax, so the headline was
 * benefits-effective, not what a payslip shows. Both are modelled here as pure
 * functions mirroring tax.ts / eitc.ts / ctc.ts and subtracted by the
 * orchestrator so the single effective number is an honest all-in figure
 * (pay + benefits, after ALL taxes). See
 * docs/research/net-paycheck-framing-findings.md (task-165, Option C).
 *
 * Income basis: gross wages as the AGI proxy — the same wage-only
 * simplification eitc.ts / ctc.ts / tax.ts already use. Pre-tax 401(k)/HSA/FSA
 * legitimately reduce the real federal-taxable base, but v1 keeps the flat
 * gross-wage proxy for consistency with the rest of the engine (findings doc
 * subtlety #3 recommends exactly this).
 */
import { FED } from './federal';
import type { CalcOpts } from './types';

export type FilingStatus = 'single' | 'mfj' | 'hoh';

/**
 * Deterministic filing status from household shape — no UI control needed:
 *  • 2+ adults → married filing jointly (matches eitc.ts / ctc.ts isMFJ)
 *  • 1 adult with children → head of household
 *  • 1 adult, no children → single
 */
export function deriveFilingStatus(familySize: number, adultCount: number): FilingStatus {
  if (adultCount >= 2) return 'mfj';
  const numChildren = Math.max(0, familySize - adultCount);
  return numChildren > 0 ? 'hoh' : 'single';
}

// ── FICA (employee side) ───────────────────────────────────────────────
// OASDI 6.2% capped at the SS wage base + Medicare 1.45% uncapped = 7.65%
// flat below the cap. The chart runs to $200k, past the $176,100 base, so the
// cap matters: above it only the Medicare portion applies to marginal dollars.
// Returned as a positive owed amount; the orchestrator subtracts it.
export function calcFICA(annualIncome: number): number {
  if (annualIncome <= 0) return 0;
  const f = FED.fica;
  const oasdi = f.oasdiRate * Math.min(annualIncome, f.oasdiWageBase);
  const medicare = f.medicareRate * annualIncome;
  return Math.round(oasdi + medicare);
}

// ── Federal income tax (gross, before credits) ─────────────────────────
// Marginal brackets over (gross wages − standard deduction by filing status).
// Returns the GROSS bracket tax: credits are handled where they belong —
// the non-refundable CTC offsets this liability inside calcFederalCTC (which
// returns the DELIVERED credit value: offset + capped refundable ACTC), and
// the EITC is fully refundable so it stays additive as cash. Subtracting this
// gross tax while adding those delivered credits nets to the family's true
// position without double-counting (findings doc subtlety #1).
export function calcFederalIncomeTax(
  annualIncome: number,
  familySize: number,
  opts?: CalcOpts
): number {
  const { adultCount = 2 } = opts || {};
  if (annualIncome <= 0) return 0;

  const status = deriveFilingStatus(familySize, adultCount);
  const t = FED.fedIncomeTax;
  const taxable = annualIncome - t.standardDeduction[status];
  if (taxable <= 0) return 0;

  let owed = 0;
  let prev = 0;
  for (const [upTo, rate] of t.brackets[status]) {
    const cap = upTo === null ? taxable : Math.min(upTo, taxable);
    if (cap > prev) owed += (cap - prev) * rate;
    prev = cap;
    if (cap >= taxable) break;
  }
  return Math.round(owed);
}
