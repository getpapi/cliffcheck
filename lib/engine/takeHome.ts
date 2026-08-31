/**
 * lib/engine/takeHome.ts — effective take-home orchestrator + cliff-chart data.
 *
 * Extracted verbatim from calcEffectiveTakeHome / getCliffChartData. The only
 * change is the PUBLIC signature: getEffectiveTakeHome takes an options object
 * (TakeHomeInput) instead of positional args, per the documented contract. The
 * internal calc flow — including MAGI threading and match-value handling — is
 * preserved exactly.
 */
import { calcSnap } from './snap';
import { calcACAPremium, calcACACSR } from './aca';
import { isOnMedicaid, calcMedicaidValue } from './medicaid';
import { calcChildcareSubsidy } from './childcare';
import { calcSection8Value } from './housing';
import { calcFederalEITC } from './eitc';
import { calcFederalCTC } from './ctc';
import { calcStateIncomeTax } from './tax';
import { calcFICA, calcFederalIncomeTax } from './fedTax';
import type { TakeHomeInput, TakeHomeBreakdown } from './types';

// ── Effective Take-Home ────────────────────────────────────────────────
// Returns breakdown + totalEffective for any income across all programs.
// employerHealthInsurance=true short-circuits ACA premium math entirely.
// matchRate (% of salary) is added to totalEffective only — not to annualIncome.
// hsaContribution + pretax401k + dependentCareFsa reduce MAGI for ACA and Medicaid only.
// SNAP uses gross income (federal eligibility rule — NOT MAGI-based).
// EITC, Section 8, childcare, state income tax, FICA, and federal income tax
// all use gross wages (the engine's wage-only AGI proxy).
// IRS MAGI for ACA/Medicaid: AGI = gross wages − pre-tax 401(k) − HSA − dependent-care FSA.
// Dependent-care FSA is capped at $5,000/yr (IRS §129). It reduces MAGI only — it does
// NOT change the childcare subsidy (fixed per-child value minus an income copay; no
// user-entered expense base, so no double-count).
// Source: IRS Pub 969 (HSA), IRS Pub 525 (401k elective deferrals), IRS Pub 503 / §129
// (dependent-care FSA $5,000 cap), healthcare.gov MAGI definition.
export function getEffectiveTakeHome(input: TakeHomeInput): TakeHomeBreakdown {
  const {
    annualIncome,
    familySize,
    state: stateCode = 'OH',
    pfccEnrolled = false,
    hasVoucher = false,
    adultCount = 2,
    employerHealthInsurance = false,
    matchRate = 0,
    hsaContribution = 0,
    pretax401k = 0,
    dependentCareFsa = 0,
  } = input;

  // MAGI used for ACA and Medicaid only — SNAP/EITC/Section8/childcare use gross.
  // Dependent-care FSA is capped at $5,000/yr (IRS §129), then reduces MAGI like HSA/401k.
  const magi = Math.max(
    0,
    annualIncome -
      Math.max(0, Number(hsaContribution) || 0) -
      Math.max(0, Number(pretax401k) || 0) -
      Math.min(5000, Math.max(0, Number(dependentCareFsa) || 0))
  );
  const calcOpts = { stateCode, pfccEnrolled, hasVoucher, adultCount };
  const onMedicaid = isOnMedicaid(magi, familySize, calcOpts);

  const snapValue = calcSnap(annualIncome, familySize, calcOpts);
  const medicaidValue = onMedicaid ? calcMedicaidValue(magi, familySize, calcOpts) : 0;
  const onMarketplace = !onMedicaid && !employerHealthInsurance;
  const acaCost = onMarketplace ? calcACAPremium(magi, familySize, calcOpts) : 0;
  const acaCSRValue = onMarketplace ? calcACACSR(magi, familySize) : 0;
  const section8Value = calcSection8Value(annualIncome, calcOpts);
  const childcareValue = calcChildcareSubsidy(annualIncome, familySize, calcOpts);
  const eitcValue = calcFederalEITC(annualIncome, familySize, calcOpts);
  const ctcValue = calcFederalCTC(annualIncome, familySize, calcOpts);
  const stateTaxOwed = calcStateIncomeTax(annualIncome, calcOpts);
  // FICA + gross federal income tax (task-181, Option C): the single effective
  // number is now an honest all-in figure — pay + benefits, after ALL taxes.
  // federalTaxOwed is GROSS; ctcValue is the DELIVERED credit (offset +
  // refundable), so +ctcValue − federalTaxOwed nets correctly (no double-count).
  // EITC is fully refundable, so it stays additive as cash regardless of
  // liability. See lib/engine/fedTax.ts + docs/research/net-paycheck-framing-findings.md.
  const ficaOwed = calcFICA(annualIncome);
  const federalTaxOwed = calcFederalIncomeTax(annualIncome, familySize, calcOpts);
  const matchPct = Math.max(0, Number(matchRate) || 0);
  const matchValue = Math.round((matchPct / 100) * annualIncome);
  const magiReduction = annualIncome - magi;

  const totalEffective = Math.round(
    annualIncome +
      snapValue +
      medicaidValue +
      section8Value +
      childcareValue +
      eitcValue +
      ctcValue +
      acaCSRValue +
      matchValue -
      acaCost -
      stateTaxOwed -
      ficaOwed -
      federalTaxOwed
  );

  return {
    grossWages: annualIncome,
    magi,
    magiReduction,
    snapValue,
    medicaidValue,
    acaCost,
    acaCSRValue,
    section8Value,
    childcareValue,
    eitcValue,
    ctcValue,
    stateTaxOwed,
    ficaOwed,
    federalTaxOwed,
    matchValue,
    totalEffective,
  };
}

// ── Cliff Chart Data ───────────────────────────────────────────────────
// 201 points: $0 to $200,000 in $1,000 increments. Raised from $120k so
// two-earner households fit on the axis (owner call, 10-07-2026); every
// benefit has phased out well below the new ceiling, so the added band is
// wages-minus-tax only.
export function getCliffData(
  input: Omit<TakeHomeInput, 'annualIncome'>
): Array<{ income: number } & TakeHomeBreakdown> {
  const points: Array<{ income: number } & TakeHomeBreakdown> = [];
  for (let income = 0; income <= 200000; income += 1000) {
    points.push({ income, ...getEffectiveTakeHome({ ...input, annualIncome: income }) });
  }
  return points;
}
