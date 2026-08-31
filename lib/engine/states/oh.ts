/**
 * lib/engine/states/oh.ts — Ohio rule table. Extracted verbatim from STATES.OH.
 * Gov-source citation comments preserved as-is.
 */
import type { StateRules } from '../types';

export const OH: StateRules = {
  supported: true,
  label: 'Ohio',
  // SNAP: Ohio BBCE (200% FPL gross limit) — federal default is 130%.
  snap: {
    grossLimitFPL: 2.0,
  },
  // Medicaid: Ohio expanded 2014. Adults 19–64 eligible to 138% FPL.
  // https://www.medicaid.gov/state-overviews/stateprofile.html?state=Ohio
  medicaid: {
    expanded: true,
    expansionFPL: 1.38, // 133% + 5% income disregard
    childrenFPL: 2.16,
  },
  // ACA: SLCSP benchmark — central/northeast Ohio representative values, FY2026.
  aca: {
    slcspMonthly: { 1: 700, 2: 1400, 3: 1750, 4: 2100, 5: 2625, 6: 3150 },
  },
  // Ohio PFCC Childcare Subsidy — Ohio DCY
  // https://childrenandyouth.ohio.gov/for-providers/resources/pfcc
  childcare: {
    subsidyName: 'PFCC', // Publicly Funded Child Care
    entryFPL: 1.45,
    exitFPL: 3.0,
    coPayRate: 0.07, // Effective July 2026
    coPayFreeFPL: 1.0,
    // Annual gross childcare value — Ohio 75th percentile market rate
    valuePerChild: [0, 11000, 23000, 33000],
  },
  // Section 8 / HCV — HUD; Columbus MHA (CMHA) 2026 est.
  // Modeled inactive by default (Ohio PHA waitlists closed).
  housing: {
    incomeLimitAnnual: 52500, // 50% AMI Columbus family of 4
    paymentStandardMonthly: 1750, // 3BR Columbus
    tenantShareRate: 0.3,
  },
  // Ohio state income tax — flat tax post-HB 96 (2025).
  // Source: Policy Matters Ohio "The Great Ohio Tax Shift, 2026"
  //  https://policymattersohio.org/research/the-great-ohio-tax-shift-2026/
  // Source: Tax Foundation 2026 State Tax Changes
  //  https://taxfoundation.org/research/all/state/2026-state-tax-changes/
  // Retrieved: 2026-04-27.
  // Structure: 0% on Ohio AGI ≤ $26,050; 2.75% flat on amount above $26,050.
  // Single threshold for all filing statuses (frozen since 2021; indexing
  // suspended through 2026). NOT a cliff — marginal kick-in only.
  // Modelled on gross wages as a proxy for Ohio AGI (no itemised deductions
  // captured in user input). Local/municipal income taxes (RITA, CCA) are
  // out of scope — they vary by city and need explicit user input.
  incomeTax: {
    noTaxFloor: 26050,
    flatRate: 0.0275,
  },
};
