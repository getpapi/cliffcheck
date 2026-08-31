/**
 * lib/seo/households.ts — the household SCENARIO-SPOKE tier (Template D).
 *
 * Sibling to the program spoke (states.ts), but the axis is the HOUSEHOLD, not the
 * program: one page per (state × household archetype), e.g. /benefits-cliff/ohio/
 * single-parent. Where the program spoke isolates one benefit's cliff, the
 * household spoke shows the FULL cliff a specific family shape hits in a state, so
 * the numbers are genuinely distinct from the canonical family-of-4 hub (a single
 * parent of two faces a much steeper drop than a two-earner couple).
 *
 * Same discipline as the rest of the cluster: every dollar is engine-derived at
 * build time (never hand-typed), and the SAME anti-thin gate applies — a
 * (state, household) combo only mints a page if the engine shows a real cliff for
 * that family. Pure + framework-free (no React, no next/*), so the page, metadata,
 * and any future OG route read the SAME model from here. Consumes the engine's
 * public API only; it never edits the engine.
 */
import { getCliffData, getStateSources, type StateCode, type Source } from "@/lib/engine";
import { deriveResults, type DerivedResults } from "@/components/calculator/derive";
import type { AnswerSpan } from "@/components/seo/AnswerBlock";
import type { FaqEntry } from "@/lib/seo/jsonld";
import {
  getSeoStates,
  stateFromSlug,
  latestRetrieved,
  type SeoState,
} from "@/lib/seo/states";

/** Materiality floor: a steepest drop below this is a gentle taper, not a cliff.
 *  Mirrors the private CLIFF_FLOOR in states.ts (the same $500 gate the program
 *  spokes use) so both tiers apply an identical anti-thin bar. */
const CLIFF_FLOOR = 500;

/* ── Household archetypes ──────────────────────────────────────────────────────
   The starter set (two), each a familySize / adultCount preset the engine already
   understands. childCount = familySize − adultCount is derived by the engine (it
   drives EITC, CTC, Medicaid, and childcare), so a preset is all the data a
   household needs. Deliberately only two until the tier proves out. */
export interface HouseholdArchetype {
  /** URL slug segment, e.g. "single-parent". Must never collide with a program slug. */
  slug: string;
  /** Plain-English label for copy (PRODUCT.md voice, no jargon), e.g. "single parent of two". */
  label: string;
  /** Short label for headings / compact lists, e.g. "Single parent". */
  shortLabel: string;
  familySize: number;
  adultCount: number;
}

export const HOUSEHOLDS: HouseholdArchetype[] = [
  {
    slug: "single-parent",
    label: "single parent of two",
    shortLabel: "Single parent",
    familySize: 3,
    adultCount: 1,
  },
  {
    slug: "two-earner",
    label: "two-earner family of four",
    shortLabel: "Two earners",
    familySize: 4,
    adultCount: 2,
  },
];

const HOUSEHOLD_BY_SLUG: Record<string, HouseholdArchetype> = Object.fromEntries(
  HOUSEHOLDS.map((h) => [h.slug, h])
);

/** The engine scenario options for a (state, household) pair. */
function householdOpts(code: StateCode, hh: HouseholdArchetype) {
  return { state: code, familySize: hh.familySize, adultCount: hh.adultCount };
}

/** Scan the engine curve for the steepest single-step drop in total effective
 *  take-home for this household — the raise-cliff the page is built around. */
function worstStep(code: StateCode, hh: HouseholdArchetype): {
  currentIncome: number;
  offeredIncome: number;
  drop: number;
} {
  const points = getCliffData(householdOpts(code, hh));
  let worstIdx = 0;
  let worstDy = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const dy = points[i + 1].totalEffective - points[i].totalEffective;
    if (dy < worstDy) {
      worstDy = dy;
      worstIdx = i;
    }
  }
  return {
    currentIncome: points[worstIdx].income,
    offeredIncome: points[worstIdx + 1].income,
    drop: Math.round(Math.abs(worstDy)),
  };
}

/** Anti-thin gate: a (state, household) combo earns a page only if the engine
 *  shows a real cliff for that family (steepest drop clears the materiality floor). */
export function householdHasCliff(code: StateCode, hh: HouseholdArchetype): boolean {
  return worstStep(code, hh).drop >= CLIFF_FLOOR;
}

/** Resolve a (state slug, household slug) pair to typed routing objects, or null if
 *  the state is unsupported, the household is unknown, OR the combo has no real
 *  cliff (anti-thin). The single gate both generateStaticParams and the page call. */
export function resolveHousehold(
  stateSlugParam: string,
  householdSlugParam: string
): { state: SeoState; household: HouseholdArchetype } | null {
  const state = stateFromSlug(stateSlugParam);
  const household = HOUSEHOLD_BY_SLUG[householdSlugParam];
  if (!state || !household) return null;
  if (!householdHasCliff(state.code, household)) return null;
  return { state, household };
}

/** All household route params: states × archetypes, anti-thin filtered. Adding a
 *  states/XX.ts file OR a HOUSEHOLDS entry grows this set with zero page-code change. */
export function allHouseholdParams(): { state: string; household: string }[] {
  return getSeoStates().flatMap((s) =>
    HOUSEHOLDS.filter((h) => householdHasCliff(s.code, h)).map((h) => ({
      state: s.slug,
      household: h.slug,
    }))
  );
}

/** Map the engine's dominant-cause code to PRODUCT.md-approved copy. */
function causeLabel(cause: string | null | undefined): string {
  switch (cause) {
    case "Childcare":
      return "lost childcare help";
    case "Medicaid":
      return "lost Medicaid";
    case "SNAP":
      return "lost SNAP";
    case "ACA":
      return "higher health costs";
    case "CSR":
      return "lost cost-sharing help";
    case "EITC":
      return "a smaller tax credit";
    default:
      return "lost benefits";
  }
}

/* ── The full household-spoke model (everything the page renders) ─────────────── */
export interface HouseholdModel {
  state: SeoState;
  household: HouseholdArchetype;
  familySize: number;
  adultCount: number;
  /** Income the raise-cliff starts from. */
  currentIncome: number;
  /** Income the raise-cliff lands at. */
  offeredIncome: number;
  /** offered − current (positive dollars). */
  raise: number;
  /** Real take-home lost across that raise (positive dollars). */
  worstDrop: number;
  /** First income past the cliffs where take-home beats today, or null. */
  safeExit: number | null;
  /** Dominant program behind the steepest drop, as copy. */
  dominantCauseLabel: string;
  /** DerivedResults for the reused CliffChart client island. */
  results: DerivedResults;
  /** ISO date the state's rules were last checked (for Article schema). */
  dateModified: string;
  /** Government sources for this state (chips + freshness). */
  sources: Source[];
}

export function buildHouseholdModel(
  state: SeoState,
  hh: HouseholdArchetype
): HouseholdModel {
  const opts = householdOpts(state.code, hh);
  const { currentIncome, offeredIncome } = worstStep(state.code, hh);
  // Single source of truth for the scenario facts — the same derivation the
  // calculator would show for this raise (loss, safe exit, dominant cause, chart).
  const results = deriveResults(opts, currentIncome, offeredIncome);
  const sources = getStateSources(state.code);
  return {
    state,
    household: hh,
    familySize: hh.familySize,
    adultCount: hh.adultCount,
    currentIncome,
    offeredIncome,
    raise: offeredIncome - currentIncome,
    worstDrop: Math.abs(Math.round(results.diff)),
    safeExit: results.safeExit,
    dominantCauseLabel: causeLabel(results.cliffAnnotation?.cause ?? null),
    results,
    dateModified: latestRetrieved(sources),
    sources,
  };
}

/** The other household archetypes for this state (onward links), anti-thin filtered. */
export function otherHouseholds(
  state: SeoState,
  current: HouseholdArchetype
): HouseholdArchetype[] {
  return HOUSEHOLDS.filter(
    (h) => h.slug !== current.slug && householdHasCliff(state.code, h)
  );
}

/** The citable 40-60 word answer for a household spoke, engine-derived. */
export function buildHouseholdAnswer(m: HouseholdModel): AnswerSpan[] {
  return [
    {
      text: `In ${m.state.label}, a ${m.household.label} can hit a benefits cliff where a ${fmtInt(
        m.raise
      )} raise around ${fmtInt(m.currentIncome)} cuts real take-home by `,
    },
    { text: `${fmtInt(m.worstDrop)} a year`, emphasis: "loss" },
    {
      text: `, mostly from ${m.dominantCauseLabel}. Past the cliff, take-home recovers and climbs again.`,
    },
  ];
}

/** Household-spoke FAQ, question-phrased as the search query. All dollars engine-derived. */
export function buildHouseholdFaq(m: HouseholdModel): FaqEntry[] {
  const entries: FaqEntry[] = [
    {
      question: `How much can a ${m.household.label} earn before a benefits cliff in ${m.state.label}?`,
      answer:
        `For a ${m.household.label} in ${m.state.label}, the steepest cliff lands around ${fmtInt(
          m.currentIncome
        )} a year, where a ${fmtInt(m.raise)} raise cuts real take-home by about ${fmtInt(
          m.worstDrop
        )}, mostly from ${m.dominantCauseLabel}. The exact point depends on your household, so check your own number.`,
    },
    {
      question: `Why is the cliff different for a ${m.household.shortLabel.toLowerCase()} household?`,
      answer:
        `Benefits depend on family size and how many adults are in the home, so a ${m.household.label} qualifies for a different mix of help than other households. That changes which benefits fall away and where, so the cliff lands at a different income and a different size than the standard family-of-four example.`,
    },
    {
      question: `What income clears the cliff for a ${m.household.label} in ${m.state.label}?`,
      answer: m.safeExit
        ? `Real take-home passes its earlier level again at about ${fmtInt(
            m.safeExit
          )} a year for this household. Earn past that safe exit and the raise pays off for good.`
        : `Once you are well past where the benefits fall away, more pay adds to take-home again. Check your own number to see your safe exit income.`,
    },
  ];
  return entries;
}

/** Local integer-dollar formatter (kept here so households.ts stays self-contained;
 *  mirrors components/calculator/derive.ts fmtDollars). No cents, en-US grouping. */
function fmtInt(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}
