/**
 * lib/engine/states/va.ts — Virginia rule table. FY2026, gov-sourced.
 * Expansion Medicaid (Cardinal Care), BBCE SNAP at 200% FPL, PROGRESSIVE but
 * compressed state income tax (2/3/5/5.75%, top rate at only $17k taxable).
 * Regional values (ACA SLCSP, housing) use the Richmond, VA metro.
 */
import type { StateRules } from '../types';

export const VA: StateRules = {
  supported: true,
  label: 'Virginia',
  // SNAP: Virginia BBCE — gross income limit raised to 200% FPL (from the federal
  // 130%), asset test waived, via categorical eligibility through a TANF-funded
  // service. The federal net-income test at 100% FPL still binds and zeroes the
  // benefit first (~$32k net for a family of 4), so the 200% gross ceiling never
  // binds before it — same as the other BBCE states (OH/PA/FL/NY).
  // https://www.fns.usda.gov/snap/broad-based-categorical-eligibility
  // https://www.dss.virginia.gov/benefit/snap.cgi
  snap: {
    grossLimitFPL: 2.0,
  },
  // Medicaid: Virginia EXPANDED under the ACA effective 2019-01-01 (2018 budget,
  // enrollment opened Jan 2019) — now branded Cardinal Care. MAGI adults 19-64
  // and parents, INCLUDING childless adults, eligible to 138% FPL (133% + 5%
  // disregard). Children flow to FAMIS (Virginia's CHIP) — subsidised to 205% FPL
  // (Medicaid for children ≤148% FPL, FAMIS 148–205% FPL). KFF Jan 2026; CoverVA.
  // https://www.kff.org/affordable-care-act/state-indicator/medicaid-income-eligibility-limits-for-adults-as-a-percent-of-the-federal-poverty-level/
  // https://coverva.dmas.virginia.gov/learn/coverage-for-children/medicaid-for-children-and-famis/
  medicaid: {
    expanded: true,
    expansionFPL: 1.38, // 133% + 5% income disregard
    childrenFPL: 2.05, // FAMIS (CHIP) subsidised ceiling, 205% FPL
  },
  // ACA: Virginia's Insurance Marketplace (state-based exchange since 2024, HBE).
  // SLCSP anchored on the FY2026 Virginia benchmark Silver premium for a 40-year-
  // old non-smoker (~$575/mo, Richmond-representative) × the app's household curve
  // [1, 2, 2.5, 3, 3.75, 4.5]; per-size SLCSP is not published. Virginia has no
  // Basic Health Program, so ACA math is the standard PTC path (no second cliff).
  // https://help.marketplace.virginia.gov/hc/en-us/articles/11972880800141-Second-Lowest-Cost-Silver-Plan-SLCSP
  aca: {
    slcspMonthly: { 1: 575, 2: 1150, 3: 1438, 4: 1725, 5: 2156, 6: 2588 },
  },
  // Virginia Child Care Subsidy Program (CCSP) — overseen by VDOE, administered by
  // VDSS via local departments. Eligibility ceiling is 85% State Median Income
  // (the max federal CCDF ceiling) for families with a child under kindergarten
  // age: ~$113,904/yr for a family of 4 ≈ 354% FPL. Modelled as an FPL fraction
  // anchored on the family-of-4 SMI figure (SMI and FPL scale differently by size,
  // so this is an approximation for other sizes). Copay is a sliding scale (VDOE
  // CCSP Copayment Scale, eff. 2025-07-01), capped near the federal 7% affordability
  // benchmark; modelled at ~8% average. Value-per-child reflects representative VA
  // market-rate magnitudes (Richmond metro), not a transcribed figure.
  // https://www.childcare.virginia.gov/families/paying-for-child-care
  // https://www.childcare.virginia.gov/home/showpublisheddocument/62604/638864381965000000
  childcare: {
    subsidyName: 'Child Care Subsidy Program',
    entryFPL: 3.54, // 85% SMI ≈ 354% FPL (family of 4, $113,904/yr)
    exitFPL: 3.54,
    coPayRate: 0.08, // sliding copay scale — flagged approximation
    coPayFreeFPL: 1.0,
    valuePerChild: [0, 11000, 22000, 32000],
  },
  // Section 8 / HCV — HUD FY2026, Richmond, VA HUD Metro FMR Area
  // (METRO40060M40060). Values from HUD's FY2026 primary datasets: 3BR metro FMR
  // $2,072/mo and the 50% Very-Low-Income limit for a family of 4 $56,750/yr (the
  // VLI term that gates vouchers). Metro-wide; Richmond RRHA may apply SAFMRs by
  // ZIP. Modelled as inactive unless the household holds a voucher (see
  // calcSection8Value).
  // https://www.huduser.gov/portal/datasets/fmr.html
  // https://www.huduser.gov/portal/datasets/il.html
  housing: {
    incomeLimitAnnual: 56750, // 50% VLI, Richmond VA HUD Metro FMR Area, family of 4
    paymentStandardMonthly: 2072, // 3BR Richmond VA metro FMR (FY2026)
    tenantShareRate: 0.3,
  },
  // Virginia state income tax — PROGRESSIVE but COMPRESSED, modelled via the
  // engine's bracketed path (see tax.ts). Statutory schedule (Va. Code §58.1-320):
  //   2% ≤$3,000 taxable, 3% to $5,000, 5% to $17,000, 5.75% above $17,000. The top
  // 5.75% rate kicks in at only $17,000 of VA taxable income, so most of the $0–
  // $200k chart range sits in the top bracket.
  // noTaxFloor = $21,000 folds the VA standard deduction (MFJ $17,500, 2026) plus
  // personal/dependent exemptions (4 × $930 ≈ $3,720) for a family of 4, so VA
  // taxable income ≈ gross − 21,000 and low-income liability rounds to ~$0. Because
  // the post-floor base then equals VA taxable income, each bracket `upTo` is the
  // statutory taxable threshold directly: 2% band ends at $24,000 gross (3,000
  // post-floor), 3% at $26,000 (5,000), 5% at $38,000 (17,000), 5.75% above. Tax is
  // a smooth cost — it does not create a cliff — so this refines take-home level
  // without changing cliff geometry.
  // https://www.tax.virginia.gov/income-tax-calculator
  // https://law.lis.virginia.gov/vacode/title58.1/chapter3/section58.1-320/
  incomeTax: {
    noTaxFloor: 21000,
    flatRate: 0.0575, // fallback only; superseded by brackets below
    brackets: [
      { upTo: 3000, rate: 0.02 }, // gross 21,000–24,000
      { upTo: 5000, rate: 0.03 }, // gross 24,000–26,000
      { upTo: 17000, rate: 0.05 }, // gross 26,000–38,000
      { upTo: null, rate: 0.0575 }, // gross 38,000+
    ],
  },
};
