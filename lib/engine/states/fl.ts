/**
 * lib/engine/states/fl.ts — Florida rule table. FY2026, gov-sourced.
 * Non-expansion Medicaid, BBCE SNAP, no state income tax. Closest analog: TX.
 * Regional values (ACA, housing) use Miami-Dade (Miami-Miami Beach-Kendall HMFA).
 */
import type { StateRules } from '../types';

export const FL: StateRules = {
  supported: true,
  label: 'Florida',
  // SNAP: Florida BBCE at 200% FPL gross limit, asset test waived (federal default 130%).
  // https://www.fns.usda.gov/snap/broad-based-categorical-eligibility
  snap: {
    grossLimitFPL: 2.0,
  },
  // Medicaid: Florida is non-expansion. Parents eligible to ~27% FPL (family of 3);
  // childless non-disabled adults ineligible (0% FPL). Children/CHIP (Florida
  // KidCare) covered to ~215% FPL. KFF Jan 2026.
  // https://www.kff.org/affordable-care-act/state-indicator/medicaid-income-eligibility-limits-for-adults-as-a-percent-of-the-federal-poverty-level/
  medicaid: {
    expanded: false,
    parentFPL: 0.27,
    childlessAdultFPL: 0,
    childrenFPL: 2.15,
  },
  // ACA: SLCSP benchmark — Miami-Fort Lauderdale representative, FY2026.
  // Anchored on KFF FL single-adult (age-40) benchmark ($683) x the app's
  // household curve [1, 2, 2.5, 3, 3.75, 4.5]; per-size SLCSP is not published.
  // https://www.kff.org/affordable-care-act/state-indicator/marketplace-average-benchmark-premiums/
  aca: {
    slcspMonthly: { 1: 683, 2: 1366, 3: 1708, 4: 2049, 5: 2561, 6: 3074 },
  },
  // Florida School Readiness Program — Office of Early Learning / DEL.
  // Entry 150% FPL; continuation to 85% SMI (~272% FPL for family of 4).
  // Copay is a sliding weekly-dollar schedule; modeled as ~8% average.
  // https://www.fldoe.org/schools/early-learning/parents/school-readiness.stml
  childcare: {
    subsidyName: 'School Readiness',
    entryFPL: 1.5,
    exitFPL: 2.72, // 85% SMI ≈ 272% FPL for family of 4 (approx)
    coPayRate: 0.08, // sliding average — flagged approximation
    coPayFreeFPL: 0.5,
    valuePerChild: [0, 10000, 20000, 30000],
  },
  // Section 8 / HCV — HUD FY2026, Miami-Dade (Miami-Miami Beach-Kendall HMFA).
  // https://www.huduser.gov/portal/datasets/fmr.html
  // https://www.huduser.gov/portal/datasets/il.html
  housing: {
    incomeLimitAnnual: 68100, // 50% AMI Miami-Dade family of 4
    paymentStandardMonthly: 3127, // 3BR Miami-Dade FMR
    tenantShareRate: 0.3,
  },
  // Florida has NO state income tax — no incomeTax block (same as TX).
};
