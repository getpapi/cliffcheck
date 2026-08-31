/**
 * lib/webmcp/tools.ts — WebMCP tool definitions over the CliffCheck engine.
 *
 * Pure and framework-free (same rule as lib/engine/*). Builds the tool list an
 * in-browser agent can call; `lib/webmcp/register.ts` is the only thing that
 * touches `document`. Every tool is read-only and runs the same on-device math
 * as the human UI — no network, no financial input leaves the page.
 *
 * The engine contract used here is the documented public barrel `@/lib/engine`:
 *   getEffectiveTakeHome(input: TakeHomeInput): TakeHomeBreakdown
 *   getCliffData(input: Omit<TakeHomeInput,'annualIncome'>): Array<{income} & TakeHomeBreakdown>
 *   getSupportedStates(): Array<{ code, label }>
 */

import {
  getEffectiveTakeHome,
  getCliffData,
  getSupportedStates,
  isSupportedState,
  type TakeHomeInput,
  type TakeHomeBreakdown,
} from "@/lib/engine";
import type { WebMcpTool } from "./types";

type Scenario = Omit<TakeHomeInput, "annualIncome">;
type CurvePoint = { income: number } & TakeHomeBreakdown;

const MAX_INCOME = 500_000;

const clampInt = (v: unknown, lo: number, hi: number, fallback: number): number => {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(hi, Math.max(lo, Math.round(n)));
};

const asBool = (v: unknown): boolean | undefined =>
  v === undefined || v === null ? undefined : Boolean(v);

/** Normalise a two-letter state code; throws a clean message the agent can relay. */
function normaliseState(raw: unknown): string {
  const code = String(raw ?? "").trim().toUpperCase();
  if (!isSupportedState(code)) {
    const supported = getSupportedStates()
      .map((s) => s.code)
      .join(", ");
    throw new Error(
      `State "${code || raw}" is not supported. Supported states: ${supported}.`,
    );
  }
  return code;
}

/** Build the shared household scenario (everything except the income being swept). */
function buildScenario(args: Record<string, unknown>): Scenario {
  return {
    state: normaliseState(args.state),
    familySize: clampInt(args.familySize, 1, 12, 3),
    adultCount: clampInt(args.adultCount, 1, 2, 2),
    pfccEnrolled: asBool(args.pfccEnrolled),
    hasVoucher: asBool(args.hasVoucher),
    employerHealthInsurance: asBool(args.employerHealthInsurance),
  };
}

const round = (n: number) => Math.round(n);

/** JSON Schema fragment shared by every household-shaped tool. */
const householdProps = {
  state: {
    type: "string",
    description: "Two-letter US state code. Must be a supported state.",
  },
  familySize: {
    type: "integer",
    minimum: 1,
    maximum: 12,
    description: "Total household size (adults + children).",
  },
  adultCount: {
    type: "integer",
    minimum: 1,
    maximum: 2,
    description: "Number of adults in the household. Default 2.",
  },
  pfccEnrolled: {
    type: "boolean",
    description: "Household is already enrolled in the state childcare subsidy (affects continuation eligibility).",
  },
  hasVoucher: {
    type: "boolean",
    description: "Household holds a Section 8 / Housing Choice Voucher.",
  },
  employerHealthInsurance: {
    type: "boolean",
    description: "Household has employer-sponsored health insurance (short-circuits ACA marketplace math).",
  },
} as const;

function verdict(deltaAnnual: number, raiseAnnual: number): string {
  const raise = `$${round(raiseAnnual).toLocaleString()}`;
  if (deltaAnnual < -500) {
    return `Taking the ${raise} raise leaves this household about $${round(
      Math.abs(deltaAnnual),
    ).toLocaleString()} worse off per year once lost benefits and higher taxes are counted. This is a benefits cliff.`;
  }
  if (deltaAnnual > 500) {
    return `Taking the ${raise} raise leaves this household about $${round(
      deltaAnnual,
    ).toLocaleString()} better off per year after benefit and tax changes. No cliff at this step.`;
  }
  return `Taking the ${raise} raise leaves this household roughly where it started (within $500/yr of today's effective income). The raise is nearly cancelled out by lost benefits and higher taxes.`;
}

/** Steepest single-$1k drop across the curve, with a best-guess dominant cause. */
function steepestDrop(points: CurvePoint[]) {
  let worst: { fromIncome: number; toIncome: number; drop: number; cause: string } | null = null;
  for (let i = 0; i < points.length - 1; i++) {
    const dy = points[i + 1].totalEffective - points[i].totalEffective;
    if (dy >= 0) continue;
    if (worst && dy >= -Math.abs(worst.drop)) continue;
    const causes = [
      { name: "SNAP", delta: points[i + 1].snapValue - points[i].snapValue },
      { name: "Medicaid", delta: points[i + 1].medicaidValue - points[i].medicaidValue },
      { name: "childcare subsidy", delta: points[i + 1].childcareValue - points[i].childcareValue },
      { name: "ACA premium rise", delta: points[i].acaCost - points[i + 1].acaCost },
      { name: "EITC", delta: points[i + 1].eitcValue - points[i].eitcValue },
    ]
      .filter((c) => c.delta < -100)
      .sort((a, b) => a.delta - b.delta);
    worst = {
      fromIncome: points[i].income,
      toIncome: points[i + 1].income,
      drop: round(dy),
      cause: causes[0]?.name ?? "combined benefit and tax changes",
    };
  }
  return worst;
}

export function buildTools(): WebMcpTool[] {
  return [
    {
      name: "list_supported_states",
      description:
        "List the US states CliffCheck has live benefit-rule data for. Call this first if you are unsure whether a state is supported.",
      inputSchema: { type: "object", properties: {} },
      annotations: { readOnlyHint: true },
      execute: async () =>
        JSON.stringify({ states: getSupportedStates(), count: getSupportedStates().length }),
    },

    {
      name: "calculate_cliff",
      description:
        "Given a household and a current vs. offered annual income, calculate the all-in effective take-home (wages + benefits - taxes) at each income and the net change. Reveals whether a raise triggers a benefits cliff that leaves the household poorer.",
      inputSchema: {
        type: "object",
        properties: {
          ...householdProps,
          currentIncome: {
            type: "number",
            minimum: 0,
            maximum: MAX_INCOME,
            description: "Current annual gross wages, in dollars.",
          },
          offeredIncome: {
            type: "number",
            minimum: 0,
            maximum: MAX_INCOME,
            description: "Offered / prospective annual gross wages, in dollars.",
          },
        },
        required: ["state", "familySize", "currentIncome", "offeredIncome"],
      },
      annotations: { readOnlyHint: true },
      execute: async (args) => {
        const scenario = buildScenario(args);
        const currentIncome = clampInt(args.currentIncome, 0, MAX_INCOME, 0);
        const offeredIncome = clampInt(args.offeredIncome, 0, MAX_INCOME, 0);
        const before = getEffectiveTakeHome({ ...scenario, annualIncome: currentIncome });
        const after = getEffectiveTakeHome({ ...scenario, annualIncome: offeredIncome });
        const delta = after.totalEffective - before.totalEffective;
        return JSON.stringify({
          state: scenario.state,
          familySize: scenario.familySize,
          adultCount: scenario.adultCount,
          currentIncome,
          offeredIncome,
          raiseAmount: offeredIncome - currentIncome,
          effectiveTakeHomeNow: round(before.totalEffective),
          effectiveTakeHomeAfter: round(after.totalEffective),
          netChange: round(delta),
          isCliff: delta < -500,
          verdict: verdict(delta, offeredIncome - currentIncome),
          breakdownNow: before,
          breakdownAfter: after,
        });
      },
    },

    {
      name: "get_cliff_curve",
      description:
        "Return the full effective-take-home curve for a household from $0 to $200,000 of annual wages (in $1,000 steps), plus the single steepest drop and its likely cause. Use this to chart the cliff or to find every income where the household goes backwards.",
      inputSchema: {
        type: "object",
        properties: householdProps,
        required: ["state", "familySize"],
      },
      annotations: { readOnlyHint: true },
      execute: async (args) => {
        const scenario = buildScenario(args);
        const raw = getCliffData(scenario) as CurvePoint[];
        const points = raw.map((p) => ({
          income: p.income,
          effectiveTakeHome: round(p.totalEffective),
        }));
        return JSON.stringify({
          state: scenario.state,
          familySize: scenario.familySize,
          adultCount: scenario.adultCount,
          stepDollars: 1000,
          points,
          steepestDrop: steepestDrop(raw),
        });
      },
    },

    {
      name: "get_safe_exit",
      description:
        "Given a household and its current income, return the lowest annual wage where effective take-home clears today's level for good (past every cliff). This is the income target a worker needs to negotiate to so a raise actually pays.",
      inputSchema: {
        type: "object",
        properties: {
          ...householdProps,
          currentIncome: {
            type: "number",
            minimum: 0,
            maximum: MAX_INCOME,
            description: "Current annual gross wages, in dollars.",
          },
        },
        required: ["state", "familySize", "currentIncome"],
      },
      annotations: { readOnlyHint: true },
      execute: async (args) => {
        const scenario = buildScenario(args);
        const currentIncome = clampInt(args.currentIncome, 0, MAX_INCOME, 0);
        const baseline = getEffectiveTakeHome({ ...scenario, annualIncome: currentIncome })
          .totalEffective;
        const points = getCliffData(scenario) as CurvePoint[];
        // Scan high->low: the last income below baseline is the final cliff;
        // safe exit is the next $1k step up, if it is above current income.
        let safeExitIncome: number | null = null;
        for (let i = points.length - 1; i >= 0; i--) {
          if (points[i].totalEffective < baseline) {
            if (i + 1 < points.length && points[i + 1].income > currentIncome) {
              safeExitIncome = points[i + 1].income;
            }
            break;
          }
        }
        return JSON.stringify({
          state: scenario.state,
          currentIncome,
          effectiveTakeHomeNow: round(baseline),
          safeExitIncome,
          note:
            safeExitIncome === null
              ? "No cliff ahead on the modelled range — effective take-home never drops below today's level as wages rise."
              : `The household needs about $${safeExitIncome.toLocaleString()}/yr in wages before a raise reliably leaves it better off than today.`,
        });
      },
    },
  ];
}
