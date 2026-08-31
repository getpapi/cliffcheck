/**
 * lib/engine/states/ny.ts — New York rule table. FY2026, gov-sourced.
 *
 * NY's distinguishing mechanic is the Essential Plan (ACA §1331 Basic Health
 * Program): near-$0 coverage between Medicaid (≤138% FPL) and the full
 * marketplace. As of July 1, 2026 its ceiling CONTRACTED from 250% to 200% FPL
 * (CMS reverted the 2024 §1332-waiver expansion to base BHP authority on
 * 2026-03-23, after H.R.1 / Pub. L. 119-21 defunded the expanded band). So a NY
 * household aging past 200% FPL loses $0-premium EP coverage and jumps to
 * marketplace PTC premiums — a SECOND benefits cliff distinct from the standard
 * Medicaid/childcare cliff. Modelled via aca.essentialPlan + the branch in
 * calcACAPremium (see lib/engine/aca.ts, docs/state-rules/ny.md).
 *
 * Regional values (ACA SLCSP, housing) use the New York City metro. NYC city
 * income tax is deliberately NOT modelled (state-only baseline for v1).
 */
import type { StateRules } from '../types';

export const NY: StateRules = {
  supported: true,
  label: 'New York',
  // SNAP: NY BBCE — gross income limit 200% FPL (the max federal option, and the
  // ceiling that attaches to households with a dependent child / elderly / disabled
  // member — the exact cliff-tool population), asset test waived. NY OTDA GIS
  // 25DC024 (2025-2026 income guidelines). The federal net-income test at 100% FPL
  // still binds and zeroes the benefit first (~$44.7k for a family of 4), so the
  // 200% gross ceiling never binds before it — same as the other BBCE states.
  // https://otda.ny.gov/policy/gis/2025/25DC024.pdf
  // https://otda.ny.gov/programs/snap/
  snap: {
    grossLimitFPL: 2.0,
  },
  // Medicaid: NY expanded 2014. MAGI adults/parents eligible to 138% FPL
  // (133% + 5% disregard). Children flow to Child Health Plus (CHIP) — subsidised
  // to 400% FPL (free ≤~222% FPL, sliding per-child premium above). NY DOH GIS
  // 26 MA/05 (2026 MAGI levels); Child Health Plus eligibility & cost.
  // https://www.health.ny.gov/health_care/medicaid/publications/docs/gis/26ma05_att1.pdf
  // https://www.health.ny.gov/health_care/child_health_plus/eligibility_and_cost.htm
  medicaid: {
    expanded: true,
    expansionFPL: 1.38,
    childrenFPL: 4.0, // Child Health Plus subsidised ceiling (400% FPL)
  },
  // ACA: NY State of Health (state exchange). NY uses PURE COMMUNITY RATING —
  // premiums do not vary by age (NY Ins. Law §§3231/4317). SLCSP anchored on the
  // 2026 statewide benchmark of $817/mo (KFF; corroborated by NYSOH's 2026 lowest-
  // cost Silver of $806.61 for NYC boroughs) × the app's household curve
  // [1, 2, 2.5, 3, 3.75, 4.5], since per-size SLCSP is not published.
  //   essentialPlan: the §1331 BHP tier — $0 premium for ALL enrollees (verbatim
  //   on the NYSOH Essential Plan page), eligibility ≤200% FPL from 2026-07-01.
  //   The second cliff is the step from $0 EP premium to marketplace PTC at 200%.
  // https://info.nystateofhealth.ny.gov/EssentialPlan
  // https://www.health.ny.gov/press/releases/2026/2026-03-23_federal_approval_to_preserve_health_coverage.htm
  aca: {
    slcspMonthly: { 1: 817, 2: 1634, 3: 2043, 4: 2451, 5: 3064, 6: 3677 },
    essentialPlan: {
      maxFPL: 2.0, // ceiling contracted 250% → 200% FPL, effective 2026-07-01
      monthlyPremium: 0, // $0 for all EP tiers (tiers differ only in cost-sharing)
    },
  },
  // NY Child Care Assistance Program (CCAP) — OCFS via local districts. Statewide
  // eligibility ceiling is 85% State Median Income (the max federal CCDF ceiling):
  // ~$116,492/yr for a family of 4 (eff. June 2026, OCFS 26-OCFS-INF-06) ≈ 353% FPL.
  // Modelled as an FPL fraction anchored on the family-of-4 SMI figure (SMI and FPL
  // scale differently by size, so this is an approximation for other sizes). Family
  // share capped low (~1% of income over FPL). Value-per-child reflects NY
  // 75th-percentile market rate (statewide; NYC runs higher) — a representative
  // magnitude, not a transcribed figure.
  // https://ocfs.ny.gov/main/sppd/policy/child-care.php
  // https://ocfs.ny.gov/programs/childcare/ccap/
  childcare: {
    subsidyName: 'Child Care Assistance Program',
    entryFPL: 3.53, // 85% SMI ≈ 353% FPL (family of 4, $116,492/yr)
    exitFPL: 3.53,
    coPayRate: 0.01, // NY family-share cap (~1% of income above FPL)
    coPayFreeFPL: 1.0,
    valuePerChild: [0, 12000, 24000, 34000],
  },
  // Section 8 / HCV — HUD FY2026, New York, NY HUD Metro FMR Area (NYC metro,
  // area METRO35620MM5600; Bronx/Kings/NY/Putnam/Queens/Richmond/Rockland/
  // Westchester). Values read from HUD's FY2026 primary files: 3BR metro FMR
  // $3,644/mo (FMR Schedule) and the 50% Very-Low-Income limit for a family of 4
  // $84,800/yr (Section 8 income limits — the VLI term that gates vouchers, NOT
  // the LIHTC/lottery AMI). Metro-wide; NYCHA/HPD use SAFMRs by ZIP. Modelled as
  // inactive unless the household holds a voucher (see calcSection8Value).
  // https://www.huduser.gov/portal/datasets/fmr/fmr2026/FY2026_FMR_Schedule.pdf
  // https://www.huduser.gov/portal/datasets/il/il26/Section8-FY26.xlsx
  housing: {
    incomeLimitAnnual: 84800, // 50% VLI, NYC HUD Metro FMR Area, family of 4
    paymentStandardMonthly: 3644, // 3BR NYC HUD Metro FMR (FY2026)
    tenantShareRate: 0.3,
  },
  // NY state income tax — PROGRESSIVE (unlike the flat-tax states), now modelled
  // with real marginal brackets via the engine's bracketed path (see tax.ts).
  // State income tax brackets: NY DTF 2026 MFJ schedule (Tax Law §601), §36B-style
  //   marginal rates: 4% ≤$17,150 taxable, 4.5% to $23,600, 5.25% to $27,900,
  //   5.5% to $161,550 (higher brackets are out of the $0–$120k chart range).
  // noTaxFloor = $25,000 keeps the credit-adjusted zero-liability floor: the MFJ
  // standard deduction (~$16,050) plus household / Empire-State child / EITC
  // credits zero NY liability for a family of 4 up to ~$25k gross. The bracket
  // `upTo` bounds are on the post-floor base (gross − 25,000) and are positioned
  // so each marginal rate flips at its correct GROSS threshold: 4% band ends at
  // $33,200 gross (8,200 post-floor), 4.5% at $39,650 (14,650), 5.25% at $43,950
  // (18,950), 5.5% above — i.e. statutory taxable threshold + $16,050 deduction −
  // $25,000 floor. NYC city income tax is NOT modelled (state-only baseline). Tax
  // is a smooth cost — it does not create a cliff — so this refines the take-home
  // level without changing the cliff geometry. https://www.tax.ny.gov/
  incomeTax: {
    noTaxFloor: 25000,
    flatRate: 0.055, // fallback only; superseded by brackets below
    brackets: [
      { upTo: 8200, rate: 0.04 }, // gross 25,000–33,200
      { upTo: 14650, rate: 0.045 }, // gross 33,200–39,650
      { upTo: 18950, rate: 0.0525 }, // gross 39,650–43,950
      { upTo: null, rate: 0.055 }, // gross 43,950+ (5.5% to $161,550 statutory)
    ],
  },
};
