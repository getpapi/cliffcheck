/**
 * lib/engine/states/pa.ts — Pennsylvania rule table. FY2026, gov-sourced.
 * Expansion Medicaid (Pennie exchange), BBCE SNAP, flat state income tax.
 * Regional values (ACA, housing) use Philadelphia-Camden-Wilmington MSA.
 */
import type { StateRules } from '../types';

export const PA: StateRules = {
  supported: true,
  label: 'Pennsylvania',
  // SNAP: Pennsylvania BBCE at 200% FPL gross limit, asset test waived.
  // https://www.fns.usda.gov/snap/broad-based-categorical-eligibility
  snap: {
    grossLimitFPL: 2.0,
  },
  // Medicaid: Pennsylvania expanded 2015. Adults 19-64 and parents eligible to
  // 138% FPL (single clean edge). Children/CHIP covered to ~319% FPL. KFF Jan 2026.
  // https://www.kff.org/affordable-care-act/state-indicator/medicaid-income-eligibility-limits-for-adults-as-a-percent-of-the-federal-poverty-level/
  medicaid: {
    expanded: true,
    expansionFPL: 1.38, // 133% + 5% income disregard
    childrenFPL: 3.19,
  },
  // ACA: SLCSP benchmark — Philadelphia representative, FY2026 (Pennie exchange).
  // Anchored on KFF PA single-adult (age-40) benchmark ($572) x the app's
  // household curve [1, 2, 2.5, 3, 3.75, 4.5]; per-size SLCSP is not published.
  // https://www.kff.org/affordable-care-act/state-indicator/marketplace-average-benchmark-premiums/
  aca: {
    slcspMonthly: { 1: 572, 2: 1144, 3: 1430, 4: 1716, 5: 2145, 6: 2574 },
  },
  // Pennsylvania Child Care Works (CCW) — PA DHS via ELRCs.
  // Entry 200% FPL; continuation to 235% FPL (FPIG-based, not SMI — PA is more
  // restrictive on the upper end than the federal 85% SMI ceiling). Copay capped
  // at 7% of income (federal CCDF cap); PA sliding band 3-7%.
  // https://www.pa.gov/agencies/dhs/resources/early-learning-child-care/child-care-works
  childcare: {
    subsidyName: 'Child Care Works',
    entryFPL: 2.0,
    exitFPL: 2.35, // 235% FPIG redetermination ceiling
    coPayRate: 0.07,
    coPayFreeFPL: 1.0,
    valuePerChild: [0, 11000, 22000, 32000],
  },
  // Section 8 / HCV — HUD FY2026, Philadelphia-Camden-Wilmington MSA
  // (METRO37980M37980). Metro-wide figures; Philadelphia HCV uses SAFMRs by ZIP.
  // https://www.huduser.gov/portal/datasets/fmr.html
  // https://www.huduser.gov/portal/datasets/il.html
  housing: {
    incomeLimitAnnual: 61350, // 50% AMI Philadelphia MSA family of 4
    paymentStandardMonthly: 2170, // 3BR Philadelphia MSA FMR
    tenantShareRate: 0.3,
  },
  // Pennsylvania flat income tax — 3.07% from the first dollar. Schedule SP
  // (Tax Forgiveness) zeroes liability up to ~$32k for a family of 4; modeled as
  // the no-tax floor (approximation — SP phases out over a band above this).
  // https://www.revenue.pa.gov/
  incomeTax: {
    noTaxFloor: 32000,
    flatRate: 0.0307,
  },
};
