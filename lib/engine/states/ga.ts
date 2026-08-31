/**
 * lib/engine/states/ga.ts — Georgia rule table. FY2026, gov-sourced.
 * Non-expansion Medicaid, NARROW BBCE SNAP (130% FPL), flat state income tax.
 * Regional values (ACA, housing) use Atlanta-Sandy Springs-Roswell metro.
 */
import type { StateRules } from '../types';

export const GA: StateRules = {
  supported: true,
  label: 'Georgia',
  // SNAP: Georgia's BBCE is "narrow" — it waives the asset test but KEEPS the
  // federal 130% FPL gross limit (NOT expanded to 165/200% like FL/OH/PA).
  // https://www.fns.usda.gov/snap/broad-based-categorical-eligibility
  snap: {
    grossLimitFPL: 1.3,
  },
  // Medicaid: Georgia is non-expansion. Parents ~1% FPL (among the lowest in the
  // US, family of 3); childless non-disabled adults 0% via the traditional
  // program. NOTE: the "Georgia Pathways to Coverage" §1115 demo covers adults
  // 19-64 to 100% FPL IF they complete 80 qualifying hours/month — conditional,
  // hours-gated, so it is NOT modeled as a flat income ceiling here.
  // Children/CHIP (PeachCare for Kids) covered to ~205% FPL. KFF Jan 2026.
  // https://www.kff.org/affordable-care-act/state-indicator/medicaid-income-eligibility-limits-for-adults-as-a-percent-of-the-federal-poverty-level/
  // https://pathways.georgia.gov/eligibility
  medicaid: {
    expanded: false,
    parentFPL: 0.01,
    childlessAdultFPL: 0,
    childrenFPL: 2.05,
  },
  // ACA: SLCSP benchmark — Atlanta representative, FY2026.
  // Anchored on the Atlanta single-adult (age-40) benchmark (~$510) x the app's
  // household curve [1, 2, 2.5, 3, 3.75, 4.5]; per-size SLCSP is not published.
  // https://www.kff.org/interactive/subsidy-calculator/
  aca: {
    slcspMonthly: { 1: 510, 2: 1020, 3: 1275, 4: 1530, 5: 1913, 6: 2295 },
  },
  // Georgia CAPS (Childcare and Parent Services) — DECAL / Bright from the Start.
  // Entry ~50% SMI (~165% FPL, family of 4); exit 85% SMI (~280% FPL).
  // Copay is a sliding schedule; modeled as ~8% average.
  // https://www.decal.ga.gov/qualityinitiatives/CAPS.aspx
  childcare: {
    subsidyName: 'CAPS',
    entryFPL: 1.65,
    exitFPL: 2.8, // 85% SMI ≈ 280% FPL for family of 4 (approx)
    coPayRate: 0.08, // sliding average — flagged approximation
    coPayFreeFPL: 0.5,
    valuePerChild: [0, 9000, 18000, 27000],
  },
  // Section 8 / HCV — HUD FY2026, Atlanta-Sandy Springs-Roswell metro.
  // Metro is a mandatory Small Area FMR area — payment standard varies by ZIP;
  // metro-wide 3BR FMR used here.
  // https://www.huduser.gov/portal/datasets/fmr.html
  // https://www.huduser.gov/portal/datasets/il.html
  housing: {
    incomeLimitAnnual: 58900, // 50% AMI Atlanta family of 4
    paymentStandardMonthly: 2182, // 3BR Atlanta metro-wide FMR
    tenantShareRate: 0.3,
  },
  // Georgia flat income tax — 4.99% (2026, HB 1437). Standard deduction $24k MFJ
  // + $5k/dependent → ~$34k effective no-tax floor for a family of 4. Modeled on
  // gross wages as an AGI proxy (no itemised deductions in user input).
  // https://dor.georgia.gov/taxes/important-tax-updates
  incomeTax: {
    noTaxFloor: 34000,
    flatRate: 0.0499,
  },
};
