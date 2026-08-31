/**
 * lib/engine/states/in.ts — Indiana rule table. FY2026, gov-sourced.
 * Expansion Medicaid (Healthy Indiana Plan / HIP 2.0), NON-BBCE SNAP (federal
 * 130% gross limit), flat state income tax. Regional values (ACA SLCSP, housing)
 * use the Indianapolis-Carmel-Anderson metro.
 *
 * Note: the export const is `IN` (two-letter uppercase state code, matching the
 * other state modules). `in` is a JS keyword but is legal as an exported binding
 * identifier and as an object property key, so there is no collision here.
 */
import type { StateRules } from '../types';

export const IN: StateRules = {
  supported: true,
  label: 'Indiana',
  // SNAP: Indiana does NOT use Broad-Based Categorical Eligibility (BBCE). It
  // applies the plain federal test — gross income ≤ 130% FPL, net ≤ 100% FPL —
  // so the gross limit is the federal 1.30, not the 1.65–2.00 of the BBCE states
  // (Indiana is confirmed absent from USDA's BBCE state list; it sits alongside
  // AL/AR as one of the stricter 130% states). Households with an elderly/
  // disabled member are exempt from the gross test, but the cliff-tool population
  // (working family with a dependent child) is bound by the 130% gross ceiling.
  // https://www.fns.usda.gov/snap/broad-based-categorical-eligibility
  // https://www.in.gov/fssa/dfr/snap-cash-and-health-coverage-assistance/supplemental-nutrition-assistance-program-snap/
  snap: {
    grossLimitFPL: 1.3,
  },
  // Medicaid: Indiana EXPANDED via the Healthy Indiana Plan (HIP 2.0), a CMS
  // §1115 waiver approved Jan 2015 (renewed through 2027). Non-elderly, non-
  // disabled adults 19–64 are eligible to 138% FPL (133% + 5% income disregard),
  // with income-based POWER-account contributions ($1–$27/mo). Children flow to
  // Hoosier Healthwise (Medicaid + CHIP): infants to 208% FPL, ages 1–18 to
  // 158% FPL, and CHIP to 250% FPL — so the children ceiling is 250% FPL. KFF.
  // https://www.kff.org/affordable-care-act/healthy-indiana-plan-and-the-affordable-care-act/
  // https://www.in.gov/fssa/hip/
  medicaid: {
    expanded: true,
    expansionFPL: 1.38, // 133% + 5% income disregard (HIP 2.0 adult ceiling)
    childrenFPL: 2.5, // Hoosier Healthwise / CHIP ceiling (250% FPL)
  },
  // ACA: SLCSP benchmark — Indianapolis representative, FY2026 (federal exchange;
  // Indiana has no state-based marketplace). Anchored on the 2026 Indianapolis
  // single-adult (age-40) benchmark Silver of ~$490/mo × the app's household curve
  // [1, 2, 2.5, 3, 3.75, 4.5]; per-size SLCSP is not published. Indiana's 2026
  // marketplace premiums rose sharply after the enhanced-PTC expiration.
  // https://www.kff.org/affordable-care-act/state-indicator/marketplace-average-benchmark-premiums/
  aca: {
    slcspMonthly: { 1: 490, 2: 980, 3: 1225, 4: 1470, 5: 1838, 6: 2205 },
  },
  // Indiana Child Care Development Fund (CCDF) voucher — IN FSSA / OECOSL.
  // Initial eligibility tightened to 135% FPL (~$43,403/yr, family of 4) in 2025;
  // enrolled families continue up to 85% State Median Income (~$53,700/yr for a
  // family of 4 ≈ 163% FPL — Indiana's 85% SMI is low relative to states like
  // TX/NY, so the exit band is narrow). Copay is a sliding weekly fee; modeled at
  // the federal CCDF 7%-of-income affordability benchmark, waived below 100% FPL.
  // Per-child value reflects Indiana market rate (~$1,000/mo average).
  // https://www.in.gov/fssa/carefinder/child-care-vouchers/
  // https://www.in.gov/fssa/carefinder/files/CCDFSlidingFeeSchedule_withCopays_2026.pdf
  childcare: {
    subsidyName: 'CCDF Voucher',
    entryFPL: 1.35, // 135% FPL initial eligibility (~$43,403 family of 4)
    exitFPL: 1.63, // 85% SMI ≈ 163% FPL family of 4 ($53,700/yr, approx)
    coPayRate: 0.07,
    coPayFreeFPL: 1.0,
    valuePerChild: [0, 10000, 20000, 30000],
  },
  // Section 8 / HCV — HUD FY2026, Indianapolis-Carmel, IN HUD Metro FMR Area
  // (METRO26900M26900; Marion + 8 surrounding counties). 3BR metro FMR $1,907/mo
  // (FY2026 FMR Schedule); 50% Very-Low-Income limit for a family of 4 $42,400/yr
  // (FY2026 Section 8 income limits — the VLI term that gates vouchers, cross-
  // checked against the published 7-person figure at HUD's 1.24 family-size
  // factor). Metro-wide; the Indianapolis Housing Agency uses SAFMRs by ZIP.
  // https://www.huduser.gov/portal/datasets/fmr/fmr2026/FY2026_FMR_Schedule.pdf
  // https://www.huduser.gov/portal/datasets/il/il26/HUD-sec8-FY26.pdf
  housing: {
    incomeLimitAnnual: 42400, // 50% VLI, Indianapolis-Carmel HMFA, family of 4
    paymentStandardMonthly: 1907, // 3BR Indianapolis-Carmel metro FMR (FY2026)
    tenantShareRate: 0.3,
  },
  // Indiana flat income tax — 2.95% for tax year 2026 (Indiana DOR; the statutory
  // phase-down: 3.05% 2024 → 3.00% 2025 → 2.95% 2026 → 2.90% 2027, per SB451).
  // Indiana has NO standard deduction; instead a $1,000 personal exemption per
  // taxpayer/spouse plus a $1,500 exemption per dependent. For a family of 4
  // (2 adults + 2 children) that is 2×$1,000 + 2×$1,500 = $5,000, modeled as the
  // no-tax floor (the income below which state liability is zero). County income
  // taxes (LIT, ~1–3% by county) are deliberately NOT modeled — they vary by
  // residence county and sit outside the state-baseline scope.
  // https://www.in.gov/dor/resources/tax-rates-and-reports/rates-fees-and-penalties/
  incomeTax: {
    noTaxFloor: 5000,
    flatRate: 0.0295,
  },
};
