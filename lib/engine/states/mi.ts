/**
 * lib/engine/states/mi.ts — Michigan rule table. Extracted verbatim from STATES.MI.
 * Gov-source citation comments preserved as-is.
 */
import type { StateRules } from '../types';

export const MI: StateRules = {
  supported: true,
  label: 'Michigan',
  // SNAP: Michigan uses BBCE at 200% FPL gross limit — MDHHS.
  // https://www.fns.usda.gov/snap/broad-based-categorical-eligibility
  snap: {
    grossLimitFPL: 2.0,
  },
  // Medicaid: Healthy Michigan Plan (expanded 2014). Adults eligible to 138% FPL.
  // MIChild/CHIP covers children to 212% FPL.
  // https://www.michigan.gov/mdhhs/assistance-programs/medicaid
  medicaid: {
    expanded: true,
    expansionFPL: 1.38,
    childrenFPL: 2.12,
  },
  // ACA: SLCSP benchmark — Detroit-Warren-Dearborn representative values, FY2026.
  // Detroit marketplace is competitive — benchmarks run below the OH/NC range.
  // https://www.kff.org/interactive/subsidy-calculator/
  aca: {
    slcspMonthly: { 1: 620, 2: 1240, 3: 1550, 4: 1860, 5: 2325, 6: 2790 },
  },
  // MDHHS Child Development and Care (CDC) scholarship — MI expanded eligibility 2024.
  // Entry 200% FPL; continuation to 85% SMI (~285% FPL family of 4).
  // Copay sliding with poverty-band waiver; modeled as ~8% average.
  // https://www.michigan.gov/mdhhs/assistance-programs/childcare
  childcare: {
    subsidyName: 'CDC', // Child Development and Care scholarship
    entryFPL: 2.0,
    exitFPL: 2.85, // 85% SMI ≈ 285% FPL for family of 4 (approx — see TX note)
    coPayRate: 0.08, // sliding average — MDHHS CDC 2026
    coPayFreeFPL: 1.0, // waiver at/below poverty
    valuePerChild: [0, 10000, 20000, 29000],
  },
  // Section 8 / HCV — HUD FY2026 FMR + 50% AMI, Detroit-Warren-Dearborn MSA.
  // Detroit FMR notably lower than other large metros.
  housing: {
    incomeLimitAnnual: 48000, // 50% AMI Detroit family of 4
    paymentStandardMonthly: 1600, // 3BR Detroit
    tenantShareRate: 0.3,
  },
  // MI state income tax — FLAT (single statutory rate), so it uses the flat path
  // (no brackets). State income tax rate: Michigan Treasury 2026 — 4.25% (the
  // 2023 one-year dip to 4.05% reverted to the statutory 4.25% for 2024+).
  // noTaxFloor = $23,200 ≈ 4 × the Michigan personal exemption (~$5,800/exemption)
  // for a family of 4 — MI has no standard deduction, it zeros liability via
  // per-exemption allowances. The $5,800 exemption is the 2025 figure carried as a
  // 2026 estimate (Treasury indexes it annually); flagged rather than invented.
  // https://www.michigan.gov/taxes/iit
  incomeTax: {
    noTaxFloor: 23200,
    flatRate: 0.0425,
  },
};
