/**
 * lib/engine/states/tx.ts — Texas rule table. Extracted verbatim from STATES.TX.
 * Gov-source citation comments preserved as-is.
 */
import type { StateRules } from '../types';

export const TX: StateRules = {
  supported: true,
  label: 'Texas',
  // SNAP: Texas BBCE at 165% FPL (gross limit) — Texas HHSC.
  // https://www.fns.usda.gov/snap/broad-based-categorical-eligibility
  snap: {
    grossLimitFPL: 1.65,
  },
  // Medicaid: Texas is non-expansion. Parents eligible to ~18% FPL;
  // childless adults generally ineligible (0% FPL). CHIP covers children to 201% FPL.
  // https://www.kff.org/medicaid/state-indicator/medicaid-income-eligibility-limits/
  medicaid: {
    expanded: false,
    parentFPL: 0.18,
    childlessAdultFPL: 0,
    childrenFPL: 2.01,
  },
  // ACA: SLCSP benchmark — Dallas-Fort Worth representative values, FY2026.
  // https://www.kff.org/interactive/subsidy-calculator/
  aca: {
    slcspMonthly: { 1: 650, 2: 1300, 3: 1625, 4: 1950, 5: 2438, 6: 2925 },
  },
  // Texas Child Care Services (CCS) — Texas Workforce Commission.
  // Entry 200% FPL; continuation to 85% SMI (~285% FPL for family of 4).
  // Copay sliding 0–12% based on FPL band; modeled as ~8% average.
  // https://www.twc.texas.gov/programs/child-care
  childcare: {
    subsidyName: 'CCS', // Child Care Services
    entryFPL: 2.0,
    exitFPL: 2.85, // 85% SMI ≈ 285% FPL for family of 4 (approx)
    coPayRate: 0.08, // sliding average — TWC CCS 2026
    coPayFreeFPL: 0.5, // very-low-income waiver band
    valuePerChild: [0, 10000, 20000, 30000],
  },
  // Section 8 / HCV — HUD FY2026 FMR + 50% AMI, Dallas-Plano-Irving MSA.
  // https://www.huduser.gov/portal/datasets/fmr.html
  // https://www.huduser.gov/portal/datasets/il.html
  housing: {
    incomeLimitAnnual: 54000, // 50% AMI Dallas family of 4
    paymentStandardMonthly: 2100, // 3BR Dallas
    tenantShareRate: 0.3,
  },
};
