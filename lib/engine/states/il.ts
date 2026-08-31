/**
 * lib/engine/states/il.ts — Illinois rule table. FY2026, gov-sourced.
 * Expansion Medicaid (Get Covered Illinois exchange), BBCE SNAP, flat state
 * income tax. Regional values (ACA SLCSP, housing) use the Chicago-Naperville-
 * Elgin / Chicago-Joliet-Naperville HUD Metro FMR Area (Cook, DuPage, Kane,
 * Lake, McHenry, Will counties). Values captured 2026-07-31.
 */
import type { StateRules } from '../types';

export const IL: StateRules = {
  supported: true,
  label: 'Illinois',
  // SNAP: Illinois BBCE — gross income limit 165% FPL, asset test waived (IDHS).
  // Households with an elderly (60+) or disabled member get a 200% FPL gross
  // ceiling; the federal net-income test at 100% FPL still binds and zeroes the
  // benefit first (~$32.2k/yr for a family of 4), so the 165% gross ceiling never
  // binds before it — same as the other BBCE states.
  // https://www.fns.usda.gov/snap/broad-based-categorical-eligibility
  // https://www.dhs.state.il.us/page.aspx?item=30357
  snap: {
    grossLimitFPL: 1.65,
  },
  // Medicaid: Illinois expanded 2014 (ACA). Adults 19-64 and parents eligible to
  // 138% FPL (133% + 5% income disregard) — ~$45,540/yr for a family of 4 (2026).
  // Children flow to All Kids (Illinois Medicaid + CHIP), subsidised to ~318% FPL
  // (one of the highest children's ceilings in the nation). Illinois HFS; KFF Jan 2026.
  // https://www.kff.org/affordable-care-act/state-indicator/medicaid-income-eligibility-limits-for-adults-as-a-percent-of-the-federal-poverty-level/
  // https://hfs.illinois.gov/medicalclients/allkids.html
  medicaid: {
    expanded: true,
    expansionFPL: 1.38, // 133% + 5% income disregard
    childrenFPL: 3.18, // All Kids (Medicaid/CHIP) subsidised ceiling (~318% FPL)
  },
  // ACA: Get Covered Illinois (state-based marketplace on the federal platform
  // for 2026). SLCSP anchored on the 2026 Illinois benchmark of $646/mo for a
  // single adult (age 40, KFF marketplace benchmark) × the app's household curve
  // [1, 2, 2.5, 3, 3.75, 4.5], since per-size SLCSP is not published. Chicago
  // metro is representative; downstate rating areas run modestly lower.
  // https://www.kff.org/affordable-care-act/state-indicator/marketplace-average-benchmark-premiums/
  aca: {
    slcspMonthly: { 1: 646, 2: 1292, 3: 1615, 4: 1938, 5: 2423, 6: 2907 },
  },
  // Illinois Child Care Assistance Program (CCAP) — IDHS (lead agency transfers
  // to the Illinois Dept. of Early Childhood 2026-07-01). Initial eligibility at
  // or below 225% FPL; families remain eligible through redetermination up to
  // 275% FPL (a graduated exit band above the entry ceiling). Copays are a low
  // sliding share of income (Smart Start capped family copays well under the
  // federal 7% CCDF ceiling); modelled at the 7% cap with a near-$0 copay for
  // households at/below FPL.
  // https://www.dhs.state.il.us/page.aspx?item=30355
  // https://www.dhs.state.il.us/page.aspx?item=173299
  childcare: {
    subsidyName: 'Child Care Assistance Program',
    entryFPL: 2.25, // 225% FPL initial eligibility
    exitFPL: 2.75, // 275% FPL redetermination ceiling
    coPayRate: 0.07, // federal CCDF cap; IL sliding band sits at/below this
    coPayFreeFPL: 1.0,
    valuePerChild: [0, 12000, 24000, 34000],
  },
  // Section 8 / HCV — HUD FY2026, Chicago-Joliet-Naperville, IL HUD Metro FMR
  // Area (METRO16980M16980; Cook, DuPage, Kane, Lake, McHenry, Will counties).
  // 3BR metro FMR $2,294/mo (FY2026 FMR Schedule) and the 50% Very-Low-Income
  // limit for a family of 4 ~$52,800/yr (Section 8 income limits — the VLI term
  // that gates vouchers). Metro-wide; the Chicago Housing Authority uses SAFMRs
  // by ZIP. Modelled as inactive unless the household holds a voucher.
  // https://www.huduser.gov/portal/datasets/fmr/fmr2026/FY2026_FMR_Schedule.pdf
  // https://www.huduser.gov/portal/datasets/il/il2026/summary?year=2026&reporttype=county&states=17&hmfa=METRO16980M16980
  housing: {
    incomeLimitAnnual: 52800, // 50% VLI, Chicago HUD Metro FMR Area, family of 4
    paymentStandardMonthly: 2294, // 3BR Chicago-Joliet-Naperville FMR (FY2026)
    tenantShareRate: 0.3,
  },
  // Illinois flat income tax — 4.95% of net income from the first taxable dollar
  // (IL DOR; 35 ILCS 5/201). Illinois has NO standard deduction but a per-person
  // personal exemption of $2,925 for tax year 2026 (IL-700-T withholding tables),
  // so a family of 4 shields 4 × $2,925 = $11,700 before the 4.95% rate applies —
  // modelled as the no-tax floor, mirroring how the other flat states fold their
  // deduction/credit floor. The Illinois EITC (20% of the federal credit) and the
  // new Illinois Child Tax Credit further reduce net liability above this floor
  // but are not separately modelled, so tax here is modestly conservative (a touch
  // high) for the lowest earners. Tax is a smooth cost — it does not create a
  // cliff — so this refines take-home level without changing the cliff geometry.
  // https://tax.illinois.gov/content/dam/soi/en/web/tax/forms/withholding/documents/currentyear/il-700-t.pdf
  incomeTax: {
    noTaxFloor: 11700, // 4 × $2,925 personal exemption (family of 4), TY2026
    flatRate: 0.0495,
  },
};
