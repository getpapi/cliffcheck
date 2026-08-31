/**
 * lib/engine/states/wa.ts — Washington rule table. FY2026, gov-sourced.
 * Expansion Medicaid (Apple Health via Washington Healthplanfinder / Cascade
 * Care), BBCE SNAP at the max 200% FPL option, and NO state income tax on wages
 * (WA levies no personal income tax — the incomeTax block is omitted entirely,
 * like Texas/Florida). Regional values (ACA SLCSP, housing) use the
 * Seattle-Bellevue, WA HUD Metro FMR Area — one of the highest-rent metros in
 * the country, so the housing figures run well above the multi-state norm.
 */
import type { StateRules } from '../types';

export const WA: StateRules = {
  supported: true,
  label: 'Washington',
  // SNAP (WA "Basic Food") — WA is a BBCE state at the maximum 200% FPL gross
  // limit, asset test waived (USDA BBCE state options list). The federal net-
  // income test at 100% FPL still binds first (~$33k for a family of 4) and
  // zeroes the benefit before the 200% gross ceiling is ever reached — same
  // structural behaviour as the other 200% BBCE states (NY/PA). WA DSHS
  // administers Basic Food; FY2026 income limits eff. Oct 1 2025 – Sep 30 2026.
  // https://www.fns.usda.gov/snap/broad-based-categorical-eligibility
  // https://www.dshs.wa.gov/esa/community-services-offices/basic-food
  snap: {
    grossLimitFPL: 2.0,
  },
  // Medicaid — "Apple Health". WA expanded 2014; MAGI adults & parents (incl.
  // childless adults) eligible to 138% FPL (133% + 5% disregard). Children flow
  // to Apple Health for Kids: FREE ≤215% FPL, then a CHIP tier with a modest
  // (~$30/mo) premium up to 317% FPL. childrenFPL encodes the subsidised CHIP
  // ceiling (317% FPL), matching how NY encodes Child Health Plus. KFF Jan 2026;
  // WA HCA Apple Health for Kids.
  // https://www.kff.org/affordable-care-act/state-indicator/medicaid-income-eligibility-limits-for-adults-as-a-percent-of-the-federal-poverty-level/
  // https://www.hca.wa.gov/health-care-services-supports/apple-health-medicaid-coverage/apple-health-kids
  medicaid: {
    expanded: true,
    expansionFPL: 1.38, // 133% + 5% income disregard
    childrenFPL: 3.17, // Apple Health for Kids / CHIP subsidised ceiling (317% FPL)
  },
  // ACA — Washington Healthplanfinder (state exchange, "Cascade Care"). SLCSP
  // anchored on a Seattle / King County single-adult (age-40) 2026 benchmark of
  // ~$560/mo × the app's household curve [1, 2, 2.5, 3, 3.75, 4.5]; per-size
  // SLCSP is not published. WA Silver premiums rose ~40% for plan year 2026
  // (WAHBE 2026 landscape; carriers loading ~43% for defunded federal CSRs), so
  // this benchmark sits above prior years. No §1331 Basic Health Program (WA's
  // "Cascade Care Savings" is a state premium subsidy, not a BHP tier), so ACA
  // math is unchanged — no essentialPlan field.
  // https://www.wahbexchange.org/
  // https://www.kff.org/affordable-care-act/state-indicator/marketplace-average-benchmark-premiums/
  aca: {
    slcspMonthly: { 1: 560, 2: 1120, 3: 1400, 4: 1680, 5: 2100, 6: 2520 },
  },
  // Working Connections Child Care (WCCC) — WA DCYF. Initial eligibility 60% SMI
  // (~$83,600/yr for a family of 4 in 2026 ≈ 253% FPL); once approved, families
  // hold eligibility for 12 months and are only terminated if income exceeds
  // 85% SMI (~$118,400/yr ≈ 359% FPL, the federal CCDF ceiling) — modelled as
  // the continuation/exit band. WA has eliminated or minimised copays for its
  // lowest-income families under the Fair Start for Kids Act; modelled here as a
  // modest sliding copay (~5%), $0 at/below the poverty line, which UNDERSTATES
  // WA's actual $0-copay generosity for very-low-income households (a
  // conservative choice, consistent with the sibling states). Value-per-child
  // reflects WA's high market rate — WCCC pays the 85th percentile of the 2024
  // Market Rate Survey from July 1 2026, and Seattle infant care runs ~$1,700/mo.
  // https://dcyf.wa.gov/services/earlylearning-childcare/getting-help/wccc
  // https://dcyf.wa.gov/services/early-learning-providers/subsidy/legislative-updates
  childcare: {
    subsidyName: 'Working Connections Child Care',
    entryFPL: 2.53, // 60% SMI initial eligibility (~$83.6k/yr, family of 4)
    exitFPL: 3.59, // 85% SMI continuation ceiling (~$118.4k/yr, family of 4)
    coPayRate: 0.05, // WA sliding copay; low relative to the 7% federal cap
    coPayFreeFPL: 1.0, // $0 copay at/below poverty (WA's $0 band runs broader)
    valuePerChild: [0, 15000, 30000, 42000], // WA/Seattle high market rate
  },
  // Section 8 / HCV — HUD FY2026, Seattle-Bellevue, WA HUD Metro FMR Area
  // (METRO42660MM7600; King & Snohomish counties). 3BR metro FMR $3,260/mo and
  // the 50% Very-Low-Income limit for a family of 4 $82,200/yr (the VLI term that
  // gates vouchers, not the LIHTC/AMI figure). Among the highest housing values
  // of any modelled state. Metro-wide; the Seattle Housing Authority uses SAFMRs
  // by ZIP that run higher. Inactive unless the household holds a voucher.
  // https://www.huduser.gov/portal/datasets/fmr.html
  // https://www.huduser.gov/portal/datasets/il.html
  housing: {
    incomeLimitAnnual: 82200, // 50% VLI, Seattle-Bellevue HUD Metro FMR Area, family of 4
    paymentStandardMonthly: 3260, // 3BR Seattle-Bellevue HUD Metro FMR (FY2026)
    tenantShareRate: 0.3,
  },
  // No incomeTax block: Washington levies NO personal income tax on wages. (The
  // 7% capital-gains excise tax is irrelevant to wage earners and is not
  // modelled.) States without an incomeTax block return $0 state tax — see
  // calcStateIncomeTax / tx.ts.
};
