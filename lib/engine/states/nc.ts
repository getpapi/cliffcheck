/**
 * lib/engine/states/nc.ts — North Carolina rule table. Extracted verbatim from STATES.NC.
 * Gov-source citation comments preserved as-is.
 */
import type { StateRules } from '../types';

export const NC: StateRules = {
  supported: true,
  label: 'North Carolina',
  // SNAP: NC does NOT use BBCE as of FY2026 — federal default 130% FPL gross limit.
  // https://www.fns.usda.gov/snap/broad-based-categorical-eligibility
  snap: {
    grossLimitFPL: 1.3,
  },
  // Medicaid: NC expanded December 2023. Adults eligible to 138% FPL.
  // CHIP (NC Health Choice consolidated into Medicaid): children to 211% FPL.
  // https://medicaid.ncdhhs.gov/
  // https://www.kff.org/medicaid/state-indicator/medicaid-income-eligibility-limits/
  medicaid: {
    expanded: true,
    expansionFPL: 1.38,
    childrenFPL: 2.11,
  },
  // ACA: SLCSP benchmark — Raleigh-Durham / Charlotte representative values, FY2026.
  // NC marketplace benchmarks run slightly higher than OH (fewer insurers in rural counties).
  // https://www.kff.org/interactive/subsidy-calculator/
  aca: {
    slcspMonthly: { 1: 720, 2: 1440, 3: 1800, 4: 2160, 5: 2700, 6: 3240 },
  },
  // NC Subsidized Child Care Assistance Program (SCCAP) — NC DHHS DCDEE.
  // Entry 200% FPL statewide baseline; continuation to 85% SMI (~285% FPL family of 4).
  // Copay sliding 9–10% of gross; modeled as ~10% average.
  // https://ncchildcare.ncdhhs.gov/Home/Work-With-Parents/Financial-Assistance
  childcare: {
    subsidyName: 'SCCAP', // Subsidized Child Care Assistance Program
    entryFPL: 2.0,
    exitFPL: 2.85, // 85% SMI ≈ 285% FPL for family of 4 (approx — see TX note)
    coPayRate: 0.1, // sliding average — NC SCCAP 2026
    coPayFreeFPL: 1.0, // waiver at/below poverty
    valuePerChild: [0, 9500, 19000, 28500],
  },
  // Section 8 / HCV — HUD FY2026 FMR + 50% AMI, Raleigh-Cary MSA.
  housing: {
    incomeLimitAnnual: 52000, // 50% AMI Raleigh family of 4
    paymentStandardMonthly: 1800, // 3BR Raleigh
    tenantShareRate: 0.3,
  },
  // NC state income tax — FLAT (single statutory rate), so it uses the flat path
  // (no brackets). State income tax rate: NCDOR 2026 — 3.99% (the legislated
  // step-down: 4.5% 2024 → 4.25% 2025 → 3.99% 2026). noTaxFloor = $25,500 = the
  // NC standard deduction for married-filing-jointly (2026), below which taxable
  // income and thus liability is zero. Modelled on gross wages as the AGI proxy.
  // https://www.ncdor.gov/taxes-forms/individual-income-tax
  incomeTax: {
    noTaxFloor: 25500,
    flatRate: 0.0399,
  },
};
