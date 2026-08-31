/**
 * lib/engine/states/tn.ts — Tennessee rule table. FY2026, gov-sourced.
 *
 * Tennessee is a NON-EXPANSION state (TennCare never took the ACA adult
 * expansion), and it levies NO state income tax on wages — the Hall tax on
 * interest/dividends was fully repealed effective 2021 (Pub. Ch. 86, 2016), so
 * there is NO incomeTax block (same as tx.ts). Because there is no expansion
 * adult category, the ACA marketplace subsidy cliff is the dominant mechanic
 * here: adults above 100% FPL price into marketplace PTC premiums, and TN's
 * 2026 benchmark premiums jumped hard (CMS approved a ~37.5% weighted average
 * rate increase for the 2026 plan year — the largest in years), which steepens
 * the ACA cost curve relative to the expansion states.
 *
 * Regional values (ACA SLCSP anchor, housing) use the Memphis, TN-MS-AR HUD
 * Metro FMR Area — Shelby County — the state's densest working-poor metro.
 */
import type { StateRules } from '../types';

export const TN: StateRules = {
  supported: true,
  label: 'Tennessee',
  // SNAP: Tennessee is one of only ~6 states that does NOT operate Broad-Based
  // Categorical Eligibility (BBCE). It applies the plain federal gross-income
  // test of 130% FPL and enforces the federal asset limit ($3,000; $4,500 for
  // elderly/disabled). A TDHS proposal to align SNAP limits with TANF via BBCE
  // was pending before the General Assembly but is NOT in effect for FY2026, so
  // the gross ceiling stays at the federal 130% FPL. (The federal net-income
  // test at 100% FPL still binds first and zeroes the benefit before the 130%
  // gross ceiling matters — same ordering as every other state.)
  // https://www.fns.usda.gov/snap/broad-based-categorical-eligibility
  // https://sycamoretn.org/snap-in-tn/
  snap: {
    grossLimitFPL: 1.3,
  },
  // Medicaid: TennCare — NON-EXPANSION (no ACA adult expansion category, so
  // childless adults are generally ineligible at 0% FPL). In mid-2024 CMS
  // approved TN raising its PARENT/caretaker ceiling to 100% FPL (105% after the
  // standard 5% MAGI disregard) — now the HIGHEST parent threshold among all
  // non-expansion states. Children flow to TennCare/CoverKids (CHIP): standard
  // Medicaid children covered to 147% FPL (ages 1-5) / 138% (ages 6-18), and
  // CoverKids CHIP extends the children's ceiling to 250% FPL (≈255% with the 5%
  // disregard) — modelled as the single children's ceiling. KFF / NASHP.
  // https://www.kff.org/medicaid/state-indicator/medicaid-income-eligibility-limits/
  // https://www.healthinsurance.org/medicaid/tennessee/
  // https://nashp.org/tennessee-chip-fact-sheet/
  medicaid: {
    expanded: false,
    parentFPL: 1.05, // 100% FPL + 5% MAGI disregard (raised mid-2024, CMS-approved)
    childlessAdultFPL: 0, // non-expansion: no childless-adult eligibility
    childrenFPL: 2.5, // CoverKids CHIP ceiling (250% FPL)
  },
  // ACA: Healthcare.gov (TN uses the federal marketplace — no state exchange).
  // Anchored on Tennessee's 2026 statewide average benchmark (SLCSP) premium of
  // $711/mo for a single adult (KFF Marketplace Average Benchmark Premiums, 2026)
  // × the app's household-size curve [1, 2, 2.5, 3, 3.75, 4.5], since per-size
  // SLCSP is not published. Memphis-area on-exchange rates track close to the
  // statewide benchmark. No Basic Health Program tier (only NY runs a §1331 BHP).
  // https://www.kff.org/affordable-care-act/state-indicator/marketplace-average-benchmark-premiums/
  aca: {
    slcspMonthly: { 1: 711, 2: 1422, 3: 1778, 4: 2133, 5: 2666, 6: 3200 },
  },
  // Tennessee Child Care Certificate Program (CCCP) — TDHS. Eligibility ceiling
  // is 85% State Median Income (the max federal CCDF ceiling): $7,277/mo =
  // $87,324/yr for a family of 4 (TDHS Income Eligibility & Co-Pay Chart, eff.
  // 2025-10-01) ≈ 272% FPL (family of 4, 2025 HHS guideline $32,150). Modelled
  // as an FPL fraction anchored on the family-of-4 SMI figure (SMI and FPL scale
  // differently by size, so this is an approximation for other sizes). Effective
  // 2025-10-01 every approved family is assessed a flat ~5% income-based co-pay
  // (waived for Families First / Early Head Start / DCS / behavioral-health
  // referrals — modelled as the low-income free band). Value-per-child reflects
  // TN market-rate magnitudes (Memphis-area full-time care), representative not
  // transcribed.
  // https://www.tn.gov/humanservices/for-families/child-care-services/child-care-payment-assistance/child-care-certificate-program.html
  // https://www.tn.gov/content/dam/tn/human-services/documents/Income%20Eligibility%20Limits%20and%20CoPay%20Chart%2010.1.25.pdf
  childcare: {
    subsidyName: 'Child Care Certificate Program',
    entryFPL: 2.72, // 85% SMI ≈ 272% FPL (family of 4, $87,324/yr)
    exitFPL: 2.72,
    coPayRate: 0.05, // flat 5% income-based co-pay, eff. 2025-10-01
    coPayFreeFPL: 1.0, // categorical waiver band (Families First / EHS / DCS)
    valuePerChild: [0, 9000, 18000, 27000],
  },
  // Section 8 / HCV — HUD, Memphis TN-MS-AR HUD Metro FMR Area (Shelby County).
  // Values are the CONFIRMED FY2025 primary-source figures (FY2026 not yet
  // published for this metro at build time; FY2026 will land marginally higher):
  // 50% Very-Low-Income limit family of 4 = $31,650 (the VLI term that gates
  // vouchers, on a $63,300 area median family income), and the metro-wide 3BR
  // Fair Market Rent = $1,781/mo. Metro-wide figures; Memphis HA uses SAFMRs by
  // ZIP (3BR SAFMR band ~$1,390–$2,520). Modelled as inactive unless the
  // household holds a voucher (see calcSection8Value).
  // https://www.huduser.gov/portal/datasets/il.html
  // https://www.huduser.gov/portal/datasets/fmr.html
  housing: {
    incomeLimitAnnual: 31650, // 50% VLI, Memphis HMFA, family of 4 (FY2025 confirmed)
    paymentStandardMonthly: 1781, // 3BR Memphis metro FMR (FY2025 confirmed)
    tenantShareRate: 0.3,
  },
  // No incomeTax block: Tennessee levies no state income tax on wages. The Hall
  // income tax (on interest/dividends only) was fully repealed effective tax year
  // 2021, so wage earners owe $0 in state income tax — like TX/FL.
};
