/**
 * components/calculator/derive.ts — pure derivations layered on the engine.
 *
 * The engine (@/lib/engine) is the source of truth for every dollar. This module
 * adds NO new money math — it only scans the engine's 201-point cliff curve to
 * derive the *scenario-level* facts the UI needs: the safe-exit income, the
 * steepest single-step cliff (and its dominant program cause), per-program
 * thresholds where a benefit ends, and the per-benefit monthly deltas between the
 * current and offered scenarios. Logic ported 1:1 from index.html (v1).
 *
 * Kept framework-free + typed so it can be unit-reasoned and reused.
 */
import {
  getEffectiveTakeHome,
  getCliffData,
  type TakeHomeInput,
  type TakeHomeBreakdown,
} from "@/lib/engine";

/** Engine options minus the income axis (the shared scenario knobs). */
export type ScenarioOpts = Omit<TakeHomeInput, "annualIncome">;

export type CliffPoint = { income: number } & TakeHomeBreakdown;

export interface CliffAnnotation {
  /** Income midpoint of the steepest drop step (for label placement). */
  midIncome: number;
  /** Effective take-home at the bottom of the drop. */
  bottomEffective: number;
  /** Signed step delta (negative for a drop). */
  dy: number;
  /** Absolute drop amount (rounded). */
  dropAmount: number;
  /** Dominant program responsible for the drop, or null. */
  cause: string | null;
}

export interface ProgramCliff {
  /** Income where the program drops to zero. */
  income: number;
  /** Human label ("SNAP ends"). */
  label: string;
}

export interface BenefitDelta {
  label: string;
  /** Monthly delta in dollars (offered − current). */
  delta: number;
  /** True if this line is a cost (ACA cost / state tax) where +delta = a loss. */
  isCost: boolean;
}

export interface DerivedResults {
  points: CliffPoint[];
  current: TakeHomeBreakdown;
  offered: TakeHomeBreakdown;
  /** Effective offered − effective current (signed; negative = a cliff). */
  diff: number;
  /** True when the offer leaves the household meaningfully worse off. */
  isWorse: boolean;
  /** True when the offer is meaningfully better. */
  isBetter: boolean;
  /** First income past ALL cliffs where effective permanently beats today, or null. */
  safeExit: number | null;
  /** Y-axis minimum for the chart (zoomed to the relevant band). */
  yMin: number;
  /** The steepest single-step drop across the curve, or null if monotonic. */
  cliffAnnotation: CliffAnnotation | null;
  /** Per-program income thresholds where a benefit ends. */
  programCliffs: ProgramCliff[];
  /** Per-benefit monthly deltas (only when worse; itemises the loss). */
  breakdown: BenefitDelta[];
  /** Total current benefit value (for the manager brief). */
  currentBenefitValue: number;
}

/**
 * Compute everything the calculator UI renders from a scenario. One pass over the
 * engine; presentational components consume this and never call the engine again.
 */
export function deriveResults(
  opts: ScenarioOpts,
  currentIncome: number,
  offeredIncome: number
): DerivedResults {
  const points = getCliffData(opts) as CliffPoint[];
  const current = getEffectiveTakeHome({ ...opts, annualIncome: currentIncome });
  const offered = getEffectiveTakeHome({ ...opts, annualIncome: offeredIncome });

  const diff = offered.totalEffective - current.totalEffective;
  const isWorse = diff < -500;
  const isBetter = diff > 500;

  // Safe exit = minimum income past ALL cliffs where effective permanently
  // exceeds today's baseline. Scan high→low: the last income below baseline is
  // the final cliff; safe exit is the next $1k step up (if it's above current).
  let safeExit: number | null = null;
  const baseline = current.totalEffective;
  for (let i = points.length - 1; i >= 0; i--) {
    if (points[i].totalEffective < baseline) {
      if (i + 1 < points.length && points[i + 1].income > currentIncome) {
        safeExit = points[i + 1].income;
      }
      break;
    }
  }

  // Y-axis min: zoom to the relevant band, floored to a clean $5k, never < 0.
  const minY = Math.min(...points.map((p) => p.totalEffective));
  const yMin = Math.max(0, Math.floor((minY - 6000) / 5000) * 5000);

  // Steepest single-step drop + dominant program cause.
  let cliffAnnotation: CliffAnnotation | null = null;
  for (let i = 0; i < points.length - 1; i++) {
    const dy = points[i + 1].totalEffective - points[i].totalEffective;
    if (!cliffAnnotation || dy < cliffAnnotation.dy) {
      const dSnap = points[i + 1].snapValue - points[i].snapValue;
      const dMedicaid = points[i + 1].medicaidValue - points[i].medicaidValue;
      const dCC = points[i + 1].childcareValue - points[i].childcareValue;
      const dACA = points[i].acaCost - points[i + 1].acaCost; // cost rises = benefit falls
      const dEITC = points[i + 1].eitcValue - points[i].eitcValue;
      const dCSR = points[i + 1].acaCSRValue - points[i].acaCSRValue;
      // EITC and CSR (ACA cost-sharing reduction) are candidate causes for
      // completeness. Both step down at benefit boundaries — EITC tapers gradually
      // (~$210 per $1k step); CSR drops at the 200%/250% FPL cost-sharing tiers.
      // Neither typically wins the steepest-drop sort at a real cliff (childcare/
      // Medicaid termination drop thousands in one step), so including them is
      // honest and non-noisy: each surfaces as the cause only where it genuinely
      // is the dominant single-step drop. (dACA above is the premium-cost rise; CSR
      // is the separate cost-sharing subsidy falling away — distinct ACA effects.)
      const candidates = [
        { name: "SNAP", delta: dSnap },
        { name: "Medicaid", delta: dMedicaid },
        { name: "Childcare", delta: dCC },
        { name: "ACA", delta: dACA },
        { name: "EITC", delta: dEITC },
        { name: "CSR", delta: dCSR },
      ]
        .filter((c) => c.delta < -200)
        .sort((a, b) => a.delta - b.delta);
      cliffAnnotation = {
        midIncome: (points[i].income + points[i + 1].income) / 2,
        bottomEffective: points[i + 1].totalEffective,
        dy,
        dropAmount: Math.round(Math.abs(dy)),
        cause: candidates[0]?.name ?? null,
      };
    }
  }
  // Only annotate a genuine cliff (a real drop), not gentle noise.
  if (cliffAnnotation && cliffAnnotation.dy >= -200) cliffAnnotation = null;

  // Per-program thresholds where a benefit ends (positive → zero).
  const programCliffs: ProgramCliff[] = [];
  const programs: Array<{ key: keyof TakeHomeBreakdown; label: string }> = [
    { key: "medicaidValue", label: "Medicaid ends" },
    { key: "snapValue", label: "SNAP ends" },
    { key: "childcareValue", label: "Childcare ends" },
  ];
  for (const { key, label } of programs) {
    for (let i = 0; i < points.length - 1; i++) {
      if (points[i][key] > 0 && points[i + 1][key] === 0) {
        programCliffs.push({ income: points[i + 1].income, label });
        break;
      }
    }
  }
  // Essential-Plan / free-coverage boundary. The loop above only sees a benefit
  // going positive→zero; the BHP cliff is the opposite — ACA premium cost leaps UP
  // from ~$0, so it is structurally invisible above. Detect the sharpest acaCost
  // rise coming off a ~$0-premium point, mirroring essentialPlanCliff() in
  // lib/seo/states.ts:411-421 (same CLIFF_FLOOR=500 gate on both the cost jump and
  // the take-home drop) so hub and calculator agree on the same boundary income.
  // Non-BHP states never sit at ~$0 premium below a ceiling, so no marker fires.
  const ACA_ZERO_FLOOR = 500;
  let epJump = 0;
  let epIncome = 0;
  let epDrop = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const jump = points[i + 1].acaCost - points[i].acaCost;
    if (points[i].acaCost < ACA_ZERO_FLOOR && jump > epJump) {
      epJump = jump;
      epIncome = points[i + 1].income;
      epDrop = points[i].totalEffective - points[i + 1].totalEffective;
    }
  }
  if (epJump >= ACA_ZERO_FLOOR && epDrop >= ACA_ZERO_FLOOR && epIncome > 0) {
    programCliffs.push({ income: epIncome, label: "Free health coverage ends" });
  }

  // Per-benefit monthly deltas — itemises the loss (only when worse).
  const employerHealthInsurance = !!opts.employerHealthInsurance;
  const hasVoucher = !!opts.hasVoucher;
  const matchRate = Number(opts.matchRate) || 0;
  const m = (a: number, b: number) => Math.round((a - b) / 12);
  const breakdown: BenefitDelta[] = isWorse
    ? [
        { label: "SNAP", delta: m(offered.snapValue, current.snapValue), isCost: false },
        { label: "Medicaid", delta: m(offered.medicaidValue, current.medicaidValue), isCost: false },
        ...(employerHealthInsurance
          ? []
          : [
              { label: "ACA cost", delta: m(offered.acaCost, current.acaCost), isCost: true },
              { label: "ACA savings", delta: m(offered.acaCSRValue, current.acaCSRValue), isCost: false },
            ]),
        { label: "Childcare", delta: m(offered.childcareValue, current.childcareValue), isCost: false },
        ...(hasVoucher
          ? [{ label: "Section 8", delta: m(offered.section8Value, current.section8Value), isCost: false }]
          : []),
        { label: "Earned Income Tax Credit", delta: m(offered.eitcValue, current.eitcValue), isCost: false },
        { label: "Child Tax Credit", delta: m(offered.ctcValue, current.ctcValue), isCost: false },
        { label: "FICA (Social Security + Medicare)", delta: m(offered.ficaOwed, current.ficaOwed), isCost: true },
        { label: "Federal income tax", delta: m(offered.federalTaxOwed, current.federalTaxOwed), isCost: true },
        { label: "State tax", delta: m(offered.stateTaxOwed, current.stateTaxOwed), isCost: true },
        ...(matchRate > 0
          ? [{ label: "401(k) match", delta: m(offered.matchValue, current.matchValue), isCost: false }]
          : []),
      ].filter((b) => b.delta !== 0)
    : [];

  const currentBenefitValue =
    current.snapValue +
    current.medicaidValue +
    current.section8Value +
    current.childcareValue +
    current.acaCSRValue -
    current.acaCost;

  return {
    points,
    current,
    offered,
    diff,
    isWorse,
    isBetter,
    safeExit,
    yMin,
    cliffAnnotation,
    programCliffs,
    breakdown,
    currentBenefitValue,
  };
}

/**
 * Dual-income ("should adult 2 work?") comparison — a UI derivation, NOT new math.
 *
 * Runs the SAME engine twice so the numbers never diverge from the main chart:
 *   both  = the full household (both adults working) at the offered income
 *   solo  = a single-earner household (adult 2 stays home) at the first earner's
 *           wages, i.e. the offered income minus the second earner's contribution.
 *
 * The second earner's wages are taken as the raise itself (offered − current):
 * this is the exact decision CliffCheck frames — is the *added* paycheck surviving
 * the cliff after childcare/benefit loss? `solo` keeps the WHOLE household
 * identical — same adults, same kids, same flags and levers — and changes only
 * the wages. (A stay-home adult is still a household member: dropping adultCount
 * would miscount them as an extra child in the EITC/Medicaid/childcare math and
 * flip a married couple's filing status to single.) The `delta` is what the
 * second earner's work is really worth after the benefit math — the number the
 * user came for.
 */
export interface DualIncomeResult {
  /** Effective take-home with both adults working (offered income). */
  bothEffective: number;
  /** Effective take-home with only the first earner working. */
  soloEffective: number;
  /** The first-earner (single-earner) household wages used for `solo`. */
  soloIncome: number;
  /** The second earner's gross wages (offered − current). */
  secondEarnerWages: number;
  /** What the second earner's work adds to effective take-home (both − solo). */
  delta: number;
  /** True when the second paycheck adds little relative to its gross wages. */
  eatenByCliff: boolean;
}

export function deriveDualIncome(
  opts: ScenarioOpts,
  currentIncome: number,
  offeredIncome: number
): DualIncomeResult {
  const secondEarnerWages = Math.max(0, offeredIncome - currentIncome);
  const soloIncome = Math.max(0, offeredIncome - secondEarnerWages);

  const both = getEffectiveTakeHome({ ...opts, annualIncome: offeredIncome });
  const solo = getEffectiveTakeHome({ ...opts, annualIncome: soloIncome });

  const delta = both.totalEffective - solo.totalEffective;
  // The paycheck is "eaten" when the second earner keeps under half their gross —
  // benefit loss has swallowed most of the added wages.
  const eatenByCliff =
    secondEarnerWages > 0 && delta < secondEarnerWages * 0.5;

  return {
    bothEffective: both.totalEffective,
    soloEffective: solo.totalEffective,
    soloIncome,
    secondEarnerWages,
    delta,
    eatenByCliff,
  };
}

/** Format an integer dollar amount as `$12,400` (no cents, en-US grouping). */
export function fmtDollars(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

/** Format a monthly figure from an annual amount, rounded to whole dollars. */
export function fmtMonthly(annual: number): string {
  return fmtDollars(annual / 12);
}
