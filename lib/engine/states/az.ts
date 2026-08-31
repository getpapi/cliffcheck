/**
 * lib/engine/states/az.ts — Arizona rule table. FY2026, gov-sourced.
 *
 * Arizona is a Medicaid EXPANSION state (AHCCCS covers adults incl. childless to
 * 138% FPL) with a flat 2.5% state income tax — the lowest flat rate of any
 * income-taxing state (AZ Prop 208 flat-tax transition completed 2023). No BHP /
 * Essential Plan tier, so ACA behaviour is the standard marketplace-PTC path.
 *
 * Regional values (ACA SLCSP, housing) use the Phoenix-Mesa-Chandler, AZ MSA
 * (Maricopa + Pinal counties) — the state's dominant metro (~⅔ of AZ population).
 * Sources captured 2026-07-31.
 */
import type { StateRules } from '../types';

export const AZ: StateRules = {
  supported: true,
  label: 'Arizona',
  // SNAP (AZ "Nutrition Assistance", DES): BBCE — gross income limit 185% FPL,
  // asset test waived. AZ elected the 185% BBCE ceiling (above the federal 130%
  // minimum). The federal net-income test at 100% FPL still binds and zeroes the
  // benefit first (~$32.2k for a family of 4), so the 185% gross ceiling never
  // binds before it — same pattern as the other BBCE states.
  // https://www.fns.usda.gov/snap/broad-based-categorical-eligibility
  // https://des.az.gov/services/basic-needs/food-nutrition-assistance
  snap: {
    grossLimitFPL: 1.85,
  },
  // Medicaid: Arizona expanded 2014 (AHCCCS). MAGI adults/parents AND childless
  // adults eligible to 138% FPL (133% + 5% disregard). Children flow to KidsCare
  // (AZ CHIP), subsidised to 200% FPL. KFF Jan 2026; AHCCCS eligibility.
  // https://www.kff.org/affordable-care-act/state-indicator/medicaid-income-eligibility-limits-for-adults-as-a-percent-of-the-federal-poverty-level/
  // https://www.azahcccs.gov/Members/GetCovered/
  medicaid: {
    expanded: true,
    expansionFPL: 1.38,
    childrenFPL: 2.0, // KidsCare (AZ CHIP) subsidised ceiling (200% FPL)
  },
  // ACA: SLCSP benchmark — Phoenix-Mesa-Chandler representative, FY2026
  // (HealthCare.gov / federal exchange; AZ has no state exchange). Anchored on the
  // KFF AZ statewide 2026 benchmark of $532/mo (single adult) × the app's
  // household curve [1, 2, 2.5, 3, 3.75, 4.5], since per-size SLCSP is not
  // published. No Basic Health Program / Essential Plan tier in AZ, so the ACA
  // path is the standard marketplace-PTC math (no second BHP cliff).
  // https://www.kff.org/affordable-care-act/state-indicator/marketplace-average-benchmark-premiums/
  aca: {
    slcspMonthly: { 1: 532, 2: 1064, 3: 1330, 4: 1596, 5: 1995, 6: 2394 },
  },
  // Arizona DES Child Care Assistance (CCDF). Initial eligibility gross income
  // ≤ 165% FPL; continuation/redetermination to 85% State Median Income
  // (~240% FPL for a family of 4 — SMI and FPL scale differently by size, so this
  // is an approximation for other sizes). Copay is a sliding daily fee (Level 1
  // ~$1/day through 85% FPL, up to Level 6 ~$10/day at 165% FPL — AZ Admin Code
  // R6-5-4616), which is small relative to income; modelled as a low continuous
  // rate with a near-free band up to 85% FPL. Value-per-child reflects AZ market
  // rate — a representative magnitude, not a transcribed figure.
  // https://des.az.gov/services/child-and-family/child-care
  // https://des.az.gov/services/child-and-family/child-care/how-apply-for-child-care-assistance
  childcare: {
    subsidyName: 'DES Child Care Assistance',
    entryFPL: 1.65,
    exitFPL: 2.4, // 85% SMI ≈ 240% FPL (family of 4, redetermination ceiling)
    coPayRate: 0.05, // sliding daily fee, low relative to income (AAC R6-5-4616)
    coPayFreeFPL: 0.85, // Level 1 ($1/day) band ≈ near-free through 85% FPL
    valuePerChild: [0, 10000, 20000, 30000],
  },
  // Section 8 / HCV — HUD FY2026, Phoenix-Mesa-Chandler, AZ MSA (Maricopa + Pinal
  // counties). 3BR metro FMR $2,452/mo (FY2026 FMR Schedule) and the 50%
  // Very-Low-Income limit for a family of 4 $56,200/yr (FY2026 Section 8 income
  // limits — the VLI term that gates vouchers). Metro-wide; Phoenix/Maricopa HCV
  // use SAFMRs by ZIP. Modelled as inactive unless the household holds a voucher
  // (see calcSection8Value).
  // https://www.huduser.gov/portal/datasets/fmr.html
  // https://www.huduser.gov/portal/datasets/il.html
  housing: {
    incomeLimitAnnual: 56200, // 50% VLI, Phoenix-Mesa-Chandler MSA, family of 4
    paymentStandardMonthly: 2452, // 3BR Phoenix-Mesa-Chandler FMR (FY2026)
    tenantShareRate: 0.3,
  },
  // Arizona flat income tax — 2.5% from the first taxable dollar (lowest flat rate
  // among income-taxing states; the Prop 208 transition to a single 2.5% rate
  // completed for tax year 2023). AZ ties its standard deduction to the federal
  // amount (MFJ ~$30k+); with the standard deduction plus the $100/dependent tax
  // credit, liability zeroes for a family of 4 up to ~$30k gross. Modelled as the
  // no-tax floor (approximation — AZ has no separate low-income forgiveness band,
  // liability simply begins above the deduction). Tax is a smooth cost — it does
  // not create a cliff — so this refines take-home without changing cliff geometry.
  // https://azdor.gov/individual-income-tax-information
  incomeTax: {
    noTaxFloor: 30000,
    flatRate: 0.025,
  },
};
