/**
 * lib/engine/states/mo.ts — Missouri rule table. FY2026, gov-sourced.
 * Expansion Medicaid (MO HealthNet, voter-approved Amendment 2), NON-BBCE SNAP
 * (federal 130% FPL floor — Missouri never adopted BBCE), progressive-but-low
 * state income tax (top rate 4.7%). Regional values (ACA SLCSP, housing) use the
 * St. Louis, MO-IL HUD Metro FMR Area / St. Louis marketplace rating region.
 */
import type { StateRules } from '../types';

export const MO: StateRules = {
  supported: true,
  label: 'Missouri',
  // SNAP: Missouri does NOT use Broad-Based Categorical Eligibility. It is one of
  // the ~9 states that retain the plain federal gross-income floor of 130% FPL
  // (with the standard SNAP asset test), alongside AR/KS/MS/NE/SD/TN/UT/WY. So the
  // gross limit is 1.30, not the 165–200% BBCE ceilings used by the other CliffCheck
  // states. The federal net-income test at 100% FPL still binds first and zeroes the
  // benefit (~$32k for a family of 4), so the 130% gross ceiling rarely binds ahead
  // of it — but it is materially lower than a BBCE state's, so cliff exit is earlier.
  // https://www.fns.usda.gov/snap/broad-based-categorical-eligibility
  // https://www.fns.usda.gov/snap/recipient/eligibility
  snap: {
    grossLimitFPL: 1.3,
  },
  // Medicaid: MO HealthNet — EXPANSION. Missouri voters passed Amendment 2
  // (Nov 2020); expansion took effect July 1, 2021 (courts ordered enforcement
  // after an initial funding fight). MAGI adults 19–64 / parents eligible to 138%
  // FPL (133% + 5% disregard). Children flow to MO HealthNet for Kids / CHIP,
  // subsidised to 300% FPL. KFF Jan 2026 eligibility levels.
  // https://www.kff.org/affordable-care-act/state-indicator/medicaid-income-eligibility-limits-for-adults-as-a-percent-of-the-federal-poverty-level/
  // https://mydss.mo.gov/healthnet
  medicaid: {
    expanded: true,
    expansionFPL: 1.38, // 133% + 5% income disregard
    childrenFPL: 3.0, // MO HealthNet for Kids / CHIP subsidised ceiling (300% FPL)
  },
  // ACA: SLCSP benchmark — St. Louis marketplace rating region representative,
  // plan year 2026. Anchored on the St. Louis-area single-adult (age-40) benchmark
  // Silver premium (~$755/mo — 2026 marketplace rates, enhanced APTCs having
  // expired end-2025) × the app's household curve [1, 2, 2.5, 3, 3.75, 4.5], since
  // per-size SLCSP is not published. Missouri uses the federal exchange
  // (HealthCare.gov). https://www.healthcare.gov/
  // https://www.kff.org/affordable-care-act/state-indicator/marketplace-average-benchmark-premiums/
  aca: {
    slcspMonthly: { 1: 755, 2: 1510, 3: 1888, 4: 2265, 5: 2831, 6: 3398 },
  },
  // Missouri Child Care Subsidy — DESE Early Childhood (CCDBG lead agency since
  // Aug 2021), Family Support Division determines eligibility. Initial eligibility
  // at 150% FPL. Enrolled families keep coverage through Transitional Child Care
  // (TCC) up to 242% FPL (TCC Level A ≤185%, B ≤215%, C ≤242%), so exitFPL = 2.42.
  // Sliding family co-pay (modelled at ~9% of income above FPL). Value-per-child
  // reflects Missouri market-rate care (below coastal states) — representative
  // magnitudes, not transcribed line items.
  // https://dese.mo.gov/childhood/child-care-subsidy/families
  // https://dssmanuals.mo.gov/child-care-subsidy/
  childcare: {
    subsidyName: 'Child Care Subsidy Program',
    entryFPL: 1.5, // 150% FPL initial eligibility
    exitFPL: 2.42, // Transitional Child Care Level C ceiling (242% FPL)
    coPayRate: 0.09, // sliding family co-pay — modelled average
    coPayFreeFPL: 1.0,
    valuePerChild: [0, 9000, 18000, 27000],
  },
  // Section 8 / HCV — HUD FY2026, St. Louis, MO-IL HUD Metro FMR Area
  // (METRO41180M41180). 50% Very-Low-Income limit for a family of 4 = $55,700
  // (the VLI term that gates vouchers). 3BR FMR: FY2025 = $1,570; the FY2026
  // schedule applied a +2.8% national weighted-average adjustment, so ~$1,614 is
  // used here (exact FY2026 per-metro 3BR not machine-transcribed). Metro-wide;
  // St. Louis Housing Authority may set payment standards by SAFMR/ZIP. Modelled
  // as inactive unless the household holds a voucher (see calcSection8Value).
  // https://www.huduser.gov/portal/datasets/fmr.html
  // https://www.huduser.gov/portal/datasets/il.html
  housing: {
    incomeLimitAnnual: 55700, // 50% VLI, St. Louis MO-IL HUD Metro FMR Area, family of 4
    paymentStandardMonthly: 1614, // 3BR St. Louis metro FMR (FY2025 $1,570 + FY2026 +2.8%)
    tenantShareRate: 0.3,
  },
  // Missouri state income tax — PROGRESSIVE but low, modelled via the engine's
  // bracketed path (see tax.ts). MO DOR 2026 schedule: graduated 2%–4.7% in
  // ~$1,313 taxable-income increments, first $1,313 exempt, top rate 4.7% on
  // taxable income above $9,191. Because the top rate kicks in so early, nearly
  // the whole chart range above ~$41k gross sits in the 4.7% band; the sub-$9k
  // bands are encoded for accuracy at low incomes but are immaterial to the cliff.
  //   noTaxFloor = $31,500 folds the 2026 MFJ standard deduction (Missouri
  //   conforms to the federal figure), so a low-income family of 4 owes ~$0 and the
  //   post-floor base equals MO taxable income directly. Bracket `upTo` bounds are
  //   on that post-floor base. Tax is a smooth cost (no cliff), so this refines the
  //   take-home level without changing cliff geometry. https://dor.mo.gov/
  incomeTax: {
    noTaxFloor: 31500,
    flatRate: 0.047, // fallback only; superseded by brackets below
    brackets: [
      { upTo: 1313, rate: 0 }, // first $1,313 taxable exempt
      { upTo: 2626, rate: 0.02 },
      { upTo: 3939, rate: 0.025 },
      { upTo: 5252, rate: 0.03 },
      { upTo: 6565, rate: 0.035 },
      { upTo: 7878, rate: 0.04 },
      { upTo: 9191, rate: 0.045 },
      { upTo: null, rate: 0.047 }, // taxable income above $9,191
    ],
  },
};
