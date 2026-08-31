/**
 * lib/engine/states/ca.ts — California rule table. FY2026, gov-sourced.
 * Expansion Medicaid (Medi-Cal via Covered California), 200% BBCE SNAP (CalFresh),
 * progressive state income tax (FTB). Regional values (ACA SLCSP, housing) use the
 * Los Angeles-Long Beach-Anaheim metro (HUD: Los Angeles-Long Beach-Glendale HMFA).
 *
 * California's Covered California runs a STATE premium subsidy on top of the federal
 * PTC (and a $0 state cost-sharing-reduction program) — a genuine second lever that
 * softens the ACA cliff for 138–400%+ FPL households. The engine's StateAcaRules
 * schema cannot express a state-funded subsidy layer (only slcspMonthly + the NY-only
 * essentialPlan tier), so CA's state subsidy is NOT modelled here — SLCSP feeds the
 * standard federal calcACAPremium path exactly like every other non-BHP state. This
 * means the model slightly OVERSTATES California ACA cost for subsidised households.
 * (No essentialPlan tier — that is NY's §1331 BHP; California has no Basic Health Program.)
 */
import type { StateRules } from '../types';

export const CA: StateRules = {
  supported: true,
  label: 'California',
  // SNAP = CalFresh. California BBCE (Modified Categorical Eligibility) sets the
  // gross income limit at 200% FPL — the max federal BBCE option — with the asset
  // test waived. USDA BBCE state list (CA = 200%). The federal net-income test at
  // 100% FPL still binds and zeroes the benefit first (~$33k for a family of 4), so
  // the 200% gross ceiling never binds before it — same as the other BBCE states.
  // https://www.fns.usda.gov/snap/broad-based-categorical-eligibility
  // https://www.cdss.ca.gov/calfresh
  snap: {
    grossLimitFPL: 2.0,
  },
  // Medicaid = Medi-Cal. California expanded in 2014. MAGI adults (incl. childless
  // adults) and parents eligible to 138% FPL (133% + 5% income disregard). Note CA
  // additionally covers all-ages regardless of immigration status (full-scope Medi-Cal
  // expansion completed 2024) — but that is an eligibility-category widening, not an
  // income-ceiling change, so the FPL model is unchanged. Children flow to Medi-Cal /
  // C-CHIP (Optional Targeted Low-Income Children's Program) to 266% FPL. KFF Jan 2026.
  // https://www.kff.org/affordable-care-act/state-indicator/medicaid-income-eligibility-limits-for-adults-as-a-percent-of-the-federal-poverty-level/
  // https://www.kff.org/affordable-care-act/state-indicator/medicaid-and-chip-income-eligibility-limits-for-children-as-a-percent-of-the-federal-poverty-level/
  medicaid: {
    expanded: true,
    expansionFPL: 1.38, // 133% + 5% income disregard
    childrenFPL: 2.66, // Medi-Cal / C-CHIP children ceiling (266% FPL)
  },
  // ACA: Covered California (state exchange). SLCSP anchored on the Los Angeles
  // regions (Covered California rating regions 15 & 16 — among the state's lowest-cost),
  // 2026 second-lowest-cost Silver for a 40-year-old ≈ $460/mo after the ~10.5% LA
  // rate increase for plan year 2026 (Covered California PY2026 rate filing) × the
  // app's household curve [1, 2, 2.5, 3, 3.75, 4.5], since per-size SLCSP is not
  // published. California's state premium subsidy + $0 state CSR are NOT modelled
  // (schema limitation — see file header), so subsidised-household ACA cost is
  // slightly overstated.
  // https://www.coveredca.com/newsroom/news-releases/2025/08/14/covered-california-rates-and-plans-for-2026-consumer-affordability-on-the-line-with-uncertainty-surrounding-federal-premium-tax-credit-extension/
  aca: {
    slcspMonthly: { 1: 460, 2: 920, 3: 1150, 4: 1380, 5: 1725, 6: 2070 },
  },
  // California child care subsidy — CalWORKs Child Care (Stages 1-3) + the
  // Alternative Payment Program / CCTR, administered by CDSS and CDE. Statewide
  // income ceiling is 85% State Median Income (the max federal CCDF ceiling):
  // ~$108,600/yr for a family of 4 (2025-2026 program year, adjusted each July 1)
  // ≈ 329% FPL. Modelled as an FPL fraction anchored on the family-of-4 SMI figure
  // (SMI and FPL scale differently by size, so this is an approximation for other
  // sizes). Both entry and continuation use the 85% SMI ceiling (CA moved to 85% SMI
  // for initial eligibility). Family fees are capped at 1% of monthly income (2023
  // reform, made permanent) — modelled as coPayRate 0.01.
  // https://www.cdss.ca.gov/inforesources/child-care-and-development
  // https://www.cde.ca.gov/sp/cd/ci/
  childcare: {
    subsidyName: 'CalWORKs Child Care / Alternative Payment',
    entryFPL: 3.29, // 85% SMI ≈ 329% FPL (family of 4, ~$108,600/yr)
    exitFPL: 3.29,
    coPayRate: 0.01, // family fees capped at 1% of monthly income (2023 reform)
    coPayFreeFPL: 1.0,
    valuePerChild: [0, 13000, 26000, 37000], // representative CA (LA) market magnitude
  },
  // Section 8 / HCV — HUD FY2026, Los Angeles-Long Beach-Glendale, CA HMFA
  // (METRO31080M31080; all of Los Angeles County). 3BR metro FMR $3,298/mo
  // (FY2026 FMR Schedule) and the 50% Very-Low-Income limit for a family of 4
  // $83,300/yr (FY2026 Section 8 income limits — the VLI term that gates vouchers,
  // NOT the LIHTC/lottery AMI). Metro-wide; LA-area PHAs use SAFMRs by ZIP.
  // Modelled as inactive unless the household holds a voucher (see calcSection8Value).
  // https://www.huduser.gov/portal/datasets/fmr/fmr2026/FY2026_FMR_Schedule.pdf
  // https://www.huduser.gov/portal/datasets/il.html
  housing: {
    incomeLimitAnnual: 83300, // 50% VLI, LA-Long Beach-Glendale HMFA, family of 4
    paymentStandardMonthly: 3298, // 3BR LA HMFA FMR (FY2026)
    tenantShareRate: 0.3,
  },
  // California state income tax — PROGRESSIVE (Franchise Tax Board), modelled via the
  // engine's bracketed path (see tax.ts). Real FTB MFJ marginal rates 1/2/4/6/8/9.3%
  // (Rev. & Tax. Code §17041), applied to the post-floor base (gross − noTaxFloor).
  // noTaxFloor = $30,000 folds the MFJ standard deduction (~$11,400, 2026) plus CA's
  // exemption/dependent credits (~$1,220 for a family of 4), renter's credit, and the
  // nonrefundable low-income structures that zero a low-income family's CA liability.
  // The bracket `upTo` bounds are on the post-floor base and positioned so each
  // marginal rate flips at its correct GROSS threshold = FTB 2026 MFJ taxable-income
  // bracket top + $11,400 standard deduction − $30,000 floor:
  //   1% band ends ~$33,500 gross, 2% ~$63,800, 4% ~$94,100, 6% ~$126,200,
  //   8% ~$156,500, 9.3% above (higher brackets are out of the useful chart range).
  // California's exemption/dependent credits are family-size-specific and only
  // partially folded into the scalar floor, so this slightly OVERSTATES low-income CA
  // liability (a family of 4 at ~$44k owes ~$0 in reality vs ~$245 modelled) — a
  // conservative approximation. Tax is a smooth cost (no cliff), so it refines the
  // take-home level without changing the cliff geometry. https://www.ftb.ca.gov/
  incomeTax: {
    noTaxFloor: 30000,
    flatRate: 0.02, // fallback only; superseded by brackets below
    brackets: [
      { upTo: 3500, rate: 0.01 }, // gross 30,000–33,500
      { upTo: 33800, rate: 0.02 }, // gross 33,500–63,800
      { upTo: 64100, rate: 0.04 }, // gross 63,800–94,100
      { upTo: 96200, rate: 0.06 }, // gross 94,100–126,200
      { upTo: 126500, rate: 0.08 }, // gross 126,200–156,500
      { upTo: null, rate: 0.093 }, // gross 156,500+ (9.3% top marginal in range)
    ],
  },
};
