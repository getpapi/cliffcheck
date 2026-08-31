/**
 * lib/seo/states.ts — the routing + fuel backbone for the programmatic-SEO pages.
 *
 * Everything the /benefits-cliff/* routes need to enumerate themselves lives here
 * and is DERIVED FROM THE ENGINE, never hand-typed:
 *
 *   • slug ↔ StateCode   — the full lowercase-hyphenated state NAME in the URL
 *                          (e.g. "texas", "north-carolina"), built from the
 *                          engine's own state labels so page supply auto-tracks
 *                          engine coverage. Add a states/XX.ts file and its hub +
 *                          spokes mint themselves with zero page-code change.
 *   • program list       — which benefit programs each state actually models,
 *                          read off the engine's StateRules (getState).
 *   • the ANTI-THIN filter — the load-bearing part. A (state, program) combo is
 *                          only a page if the engine's 121-point cliff curve shows
 *                          that program genuinely dropping (a real cliff). Programs
 *                          that only taper gently (EITC) are omitted, so no hollow
 *                          page is ever generated.
 *
 * Pure (no React components, no next/* imports) so it is safe on the Node build
 * AND the edge OG runtime; the page, its metadata, and its OG image all read the
 * SAME engine-derived model from here, so no number can drift between them.
 * Consumes the engine's public API only — it does not edit the engine.
 */
import {
  getSupportedStates,
  isSupportedState,
  getCliffData,
  getStateSources,
  type StateCode,
  type StateRules,
  type Source,
} from "@/lib/engine";
// getState resolves a StateCode → StateRules. It lives in the engine registry and
// is part of the engine's public surface (per the task's engine contract); we
// import it at its module path since the barrel re-exports the lookups but not
// getState itself. We only READ from it — the engine is never edited.
import { getState } from "@/lib/engine/registry";
import { deriveResults, type DerivedResults } from "@/components/calculator/derive";
import type { AnswerSpan } from "@/components/seo/AnswerBlock";

/* ── The canonical scenario every SEO page is anchored to ─────────────────────
   Programmatic-SEO pages need ONE deterministic household so every generated
   page has a stable, comparable, engine-true number. We use the plan doc's
   canonical lens: a family of 4, 2 adults. The steepest raise-cliff for THAT
   household is what the hero, table, OG image, and metadata all quote — computed
   live from the engine, identical wherever it is read. */
export const CANON_FAMILY_SIZE = 4;
export const CANON_ADULT_COUNT = 2;

/** The plain-English household label used in copy (PRODUCT.md voice, no jargon). */
export const CANON_FAMILY_LABEL = `family of ${CANON_FAMILY_SIZE}`;

/* ── Programs modelled as spoke pages ─────────────────────────────────────────
   The engine models more programs than we spoke (EITC, ACA, state tax), but a
   spoke only earns a page if that specific program produces a CLIFF for the state
   (see hasCliff below). These five are the candidate long-tail veins; the filter
   decides which actually ship. Order = display priority when several apply. */
export interface ProgramDef {
  /** URL slug segment, e.g. "medicaid". */
  slug: string;
  /** Human program name for copy/headings (no jargon — PRODUCT.md approved). */
  name: string;
  /** Short label for compact link lists. */
  shortName: string;
  /** The TakeHomeBreakdown value column this program lives in. */
  valueKey:
    | "snapValue"
    | "medicaidValue"
    | "childcareValue"
    | "section8Value";
  /** Whether modelling this program's value requires a housing voucher scenario. */
  requiresVoucher?: boolean;
}

/** Candidate program definitions, in display-priority order. */
export const PROGRAM_DEFS: ProgramDef[] = [
  {
    slug: "childcare",
    name: "childcare help",
    shortName: "Childcare",
    valueKey: "childcareValue",
  },
  {
    slug: "medicaid",
    name: "Medicaid",
    shortName: "Medicaid",
    valueKey: "medicaidValue",
  },
  {
    slug: "snap",
    name: "SNAP food help",
    shortName: "SNAP",
    valueKey: "snapValue",
  },
  {
    slug: "housing",
    name: "Section 8 housing",
    shortName: "Section 8",
    valueKey: "section8Value",
    requiresVoucher: true,
  },
];

const PROGRAM_BY_SLUG: Record<string, ProgramDef> = Object.fromEntries(
  PROGRAM_DEFS.map((p) => [p.slug, p])
);

/** A materiality floor: a drop smaller than this is a gentle taper, not a cliff.
 *  Tuned against the engine — EITC's worst step is about -$211, real cliffs are
 *  thousands — so it cleanly separates hollow pages from real ones. */
const CLIFF_FLOOR = 500;

/* ── slug ↔ state ─────────────────────────────────────────────────────────── */

/** Turn a state label into its URL slug: "North Carolina" → "north-carolina". */
export function stateSlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export interface SeoState {
  /** Two-letter engine code, e.g. "TX". */
  code: StateCode;
  /** Human label, e.g. "Texas". */
  label: string;
  /** URL slug, e.g. "texas". */
  slug: string;
}

/** All supported states as SEO routing rows, ordered by label (stable menu). */
export function getSeoStates(): SeoState[] {
  return getSupportedStates().map(({ code, label }) => ({
    code,
    label,
    slug: stateSlug(label),
  }));
}

const STATE_BY_SLUG: Record<string, SeoState> = Object.fromEntries(
  getSeoStates().map((s) => [s.slug, s])
);

/** Resolve a URL slug back to its state, or null if it is not a supported state. */
export function stateFromSlug(slug: string): SeoState | null {
  const s = STATE_BY_SLUG[slug];
  if (!s || !isSupportedState(s.code)) return null;
  return s;
}

/* ── The anti-thin cliff test ─────────────────────────────────────────────────
   Scans the engine's 121-point curve for the canonical household and reports the
   steepest single-step DROP in a program's value. `hasCliff` is the gate: a combo
   is only a page when the program genuinely falls off. This is what structurally
   prevents thin/doorway pages — a program that never drops never mints a URL. */

/** The scenario options the SEO pages anchor to (income axis added per point). */
export function canonScenario(code: StateCode, program?: ProgramDef) {
  return {
    state: code,
    familySize: CANON_FAMILY_SIZE,
    adultCount: CANON_ADULT_COUNT,
    // Section 8 value is zero unless the household holds a voucher, so the housing
    // spoke models the voucher scenario to expose its real cliff.
    hasVoucher: program?.requiresVoucher ? true : false,
  };
}

export interface ProgramCliffFacts {
  /** Steepest single-step drop in this program's value (a positive dollar amount). */
  worstDrop: number;
  /** Income the drop lands at (the step's upper income). */
  atIncome: number;
  /** Income where the program falls to zero entirely, if it does. */
  endsAtIncome: number | null;
  /** Whether the drop clears the materiality floor (a genuine cliff). */
  hasCliff: boolean;
}

/** Read a program's cliff facts for a state straight off the engine curve. */
export function programCliffFacts(
  code: StateCode,
  program: ProgramDef
): ProgramCliffFacts {
  const points = getCliffData(canonScenario(code, program));
  let worst = 0;
  let atIncome = 0;
  let endsAtIncome: number | null = null;
  let sawPositive = false;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i][program.valueKey];
    const b = points[i + 1][program.valueKey];
    if (a > 0) sawPositive = true;
    const step = b - a; // negative = a drop
    if (step < worst) {
      worst = step;
      atIncome = points[i + 1].income;
    }
    if (endsAtIncome === null && a > 0 && b === 0) {
      endsAtIncome = points[i + 1].income;
    }
  }
  const worstDrop = Math.round(Math.abs(worst));
  return {
    worstDrop,
    atIncome,
    endsAtIncome,
    hasCliff: sawPositive && worstDrop >= CLIFF_FLOOR,
  };
}

/** The applicable spoke programs for a state: modelled by the engine AND passing
 *  the anti-thin cliff test, in display-priority order. */
export function applicablePrograms(code: StateCode): ProgramDef[] {
  if (!isSupportedState(code)) return [];
  const rules: StateRules = getState(code);
  return PROGRAM_DEFS.filter((p) => {
    // The program must exist in the state's rule table at all.
    const modelled =
      (p.valueKey === "snapValue" && !!rules.snap) ||
      (p.valueKey === "medicaidValue" && !!rules.medicaid) ||
      (p.valueKey === "childcareValue" && !!rules.childcare) ||
      (p.valueKey === "section8Value" && !!rules.housing);
    if (!modelled) return false;
    // …and it must actually produce a cliff for this state (anti-thin gate).
    return programCliffFacts(code, p).hasCliff;
  });
}

/** Resolve a (state slug, program slug) pair to typed routing objects, or null if
 *  the state is unsupported OR the program does not earn a page for that state
 *  (anti-thin). This is the single gate both generateStaticParams and the page
 *  component call, so an invalid or thin combo can never render. */
export function resolveSpoke(
  stateSlugParam: string,
  programSlugParam: string
): { state: SeoState; program: ProgramDef } | null {
  const state = stateFromSlug(stateSlugParam);
  const program = PROGRAM_BY_SLUG[programSlugParam];
  if (!state || !program) return null;
  if (!applicablePrograms(state.code).some((p) => p.slug === program.slug)) {
    return null;
  }
  return { state, program };
}

/* ── Static-params helpers (the flywheel) ─────────────────────────────────────
   generateStaticParams for the hub = every supported state. For the spokes = the
   cartesian product of states × their applicable (cliff-passing) programs. Adding
   a state file grows both automatically. */

/** All hub route params: one per supported state. */
export function allStateParams(): { state: string }[] {
  return getSeoStates().map((s) => ({ state: s.slug }));
}

/** All spoke route params: states × applicable programs (anti-thin filtered). */
export function allSpokeParams(): { state: string; program: string }[] {
  return getSeoStates().flatMap((s) =>
    applicablePrograms(s.code).map((p) => ({ state: s.slug, program: p.slug }))
  );
}

/* ── Neighbours (compare-another-state affordance) ───────────────────────────
   A small, curated adjacency so the "see a different state" block answers a real
   question (a user who moved, or is comparing) without becoming a wall of links.
   Only supported neighbours are surfaced; falls back to the next states by label
   so every hub has a couple of onward links. */
const ADJACENCY: Record<string, StateCode[]> = {
  TX: ["GA", "FL"],
  FL: ["GA", "TX"],
  GA: ["FL", "NC"],
  NC: ["GA", "PA"],
  PA: ["NY", "OH"], // PA borders both NY and OH (NY added, reciprocal with NY below)
  OH: ["MI", "PA"],
  MI: ["OH", "PA"],
  NY: ["PA", "OH"], // PA is a true border; OH the nearest supported state after it
};

/** Up to two neighbouring supported states to compare against, as routing rows. */
export function neighbourStates(code: StateCode): SeoState[] {
  const all = getSeoStates();
  const byCode = Object.fromEntries(all.map((s) => [s.code, s]));
  const picks = (ADJACENCY[code] ?? [])
    .filter((c) => isSupportedState(c) && c !== code)
    .map((c) => byCode[c])
    .filter(Boolean) as SeoState[];
  if (picks.length >= 2) return picks.slice(0, 2);
  // Fallback: fill from the remaining states by label order.
  const fill = all.filter((s) => s.code !== code && !picks.includes(s));
  return [...picks, ...fill].slice(0, 2);
}

/* ── The canonical hero scenario (the number every hub/OG/metadata quotes) ────
   Scan the engine curve for the canonical household, find the steepest single
   raise-cliff (the largest one-step drop in total effective take-home), and frame
   it as a believable raise: a rounded "current" income just below the drop and an
   "offered" income just past it. The LOSS is the drop over that raise, computed
   live — never hand-typed. Deterministic per state, identical wherever it is read. */
export interface HeroScenario {
  code: StateCode;
  stateLabel: string;
  familySize: number;
  familyLabel: string;
  /** Income the raise starts from. */
  currentIncome: number;
  /** Income the raise lands at. */
  offeredIncome: number;
  /** offered - current (a positive dollar amount). */
  raise: number;
  /** Real take-home lost across the raise (a positive dollar amount). */
  loss: number;
  /** First income past all cliffs where take-home beats today, or null. */
  safeExit: number | null;
  /** Dominant program behind the steepest drop (label for copy), or null. */
  dominantCauseLabel: string | null;
}

/** Map the engine's dominant-cause code to PRODUCT.md-approved copy. */
function causeLabel(cause: string | null): string | null {
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
      return null;
  }
}

export function heroScenario(state: SeoState): HeroScenario {
  const opts = {
    state: state.code,
    familySize: CANON_FAMILY_SIZE,
    adultCount: CANON_ADULT_COUNT,
  };
  const points = getCliffData(opts);

  // Steepest single-step drop in total effective take-home.
  let worstIdx = 0;
  let worstDy = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const dy = points[i + 1].totalEffective - points[i].totalEffective;
    if (dy < worstDy) {
      worstDy = dy;
      worstIdx = i;
    }
  }
  const currentIncome = points[worstIdx].income;
  const offeredIncome = points[worstIdx + 1].income;

  // Reuse the calculator's derivation for the exact loss + safe exit + cause it
  // would show for this raise (single source of truth for the scenario facts).
  const derived = deriveResults(opts, currentIncome, offeredIncome);

  return {
    code: state.code,
    stateLabel: state.label,
    familySize: CANON_FAMILY_SIZE,
    familyLabel: CANON_FAMILY_LABEL,
    currentIncome,
    offeredIncome,
    raise: offeredIncome - currentIncome,
    loss: Math.abs(Math.round(derived.diff)),
    safeExit: derived.safeExit,
    dominantCauseLabel:
      causeLabel(derived.cliffAnnotation?.cause ?? null) ?? "lost benefits",
  };
}

/* ── The Essential-Plan second cliff (NY only, today) ─────────────────────────
   Most states have one steepest cliff. New York has a SECOND one the hero pick
   never lands on: its Basic Health Program (the Essential Plan) gives $0-premium
   coverage up to a hard FPL ceiling, above which the household falls through to
   full marketplace premiums in a single step. That transition is engine-modelled
   (states/ny.ts aca.essentialPlan + the calcACAPremium branch), so we detect it
   straight off the curve — the step where ACA cost first leaps from ~$0 to a full
   premium — rather than hand-typing the number. Gated on the state actually
   running a BHP, so it returns null for every state except NY. */
export interface EssentialPlanCliff {
  /** Real take-home lost in the single step where $0 coverage ends (positive $). */
  drop: number;
  /** Income the step lands at (its upper income) — where coverage falls away. */
  atIncome: number;
  /** The BHP eligibility ceiling as an FPL percent (e.g. 200), engine-derived. */
  maxFPLPercent: number;
}

export function essentialPlanCliff(code: StateCode): EssentialPlanCliff | null {
  if (!isSupportedState(code)) return null;
  const ep = getState(code).aca.essentialPlan;
  if (!ep) return null;
  const points = getCliffData({
    state: code,
    familySize: CANON_FAMILY_SIZE,
    adultCount: CANON_ADULT_COUNT,
  });
  let atIncome = 0;
  let drop = 0;
  let biggestJump = 0;
  for (let i = 0; i < points.length - 1; i++) {
    // The EP→marketplace transition is the sharpest rise in ACA cost coming off a
    // ~$0-premium point (below the ceiling EP is free, so acaCost sits at 0).
    const jump = points[i + 1].acaCost - points[i].acaCost;
    if (points[i].acaCost < CLIFF_FLOOR && jump > biggestJump) {
      biggestJump = jump;
      atIncome = points[i + 1].income;
      drop = Math.round(points[i].totalEffective - points[i + 1].totalEffective);
    }
  }
  if (biggestJump < CLIFF_FLOOR || drop < CLIFF_FLOOR) return null;
  return { drop, atIncome, maxFPLPercent: Math.round(ep.maxFPL * 100) };
}

/* ── The full hub model (page-only; adds chart results, answer, table, dates) ─
   Everything the state hub renders, in one build-time pass. Not used by the OG
   route (which only needs heroScenario), so the heavier derivation stays off the
   edge bundle. */
export interface HubTableRow {
  name: string;
  /** Income the benefit falls to zero, if it does. */
  endsAt: number | null;
  /** Steepest single drop in that benefit's value (positive dollars). */
  worstDrop: number;
}

export interface HubModel extends HeroScenario {
  /** DerivedResults for the reused CliffChart client island. */
  results: DerivedResults;
  /** The citable 40-60 word answer as styled spans. */
  answerSpans: AnswerSpan[];
  /** Per-benefit rows for the earnings-vs-drop table (applicable programs). */
  tableRows: HubTableRow[];
  /** Per-program cliff facts keyed by program slug (for the ranked spoke links). */
  programFacts: Record<string, ProgramCliffFacts>;
  /** ISO date the underlying rules were last checked (for Article schema). */
  dateModified: string;
  /** Government sources for this state (for chips + freshness). */
  sources: Source[];
  /** A second, Basic-Health-Program cliff distinct from the hero pick (NY only). */
  essentialPlanCliff: EssentialPlanCliff | null;
}

export function buildHubModel(state: SeoState): HubModel {
  const hero = heroScenario(state);
  const opts = {
    state: state.code,
    familySize: CANON_FAMILY_SIZE,
    adultCount: CANON_ADULT_COUNT,
  };
  const results = deriveResults(opts, hero.currentIncome, hero.offeredIncome);
  const programs = applicablePrograms(state.code);

  const programFacts: Record<string, ProgramCliffFacts> = {};
  for (const p of programs) programFacts[p.slug] = programCliffFacts(state.code, p);

  const tableRows: HubTableRow[] = programs.map((p) => ({
    name: p.shortName,
    endsAt: programFacts[p.slug].endsAtIncome,
    worstDrop: programFacts[p.slug].worstDrop,
  }));

  const sources = getStateSources(state.code);

  // Citable answer (40-60 words), assembled from engine facts. Emphasis spans
  // carry financial colour on the load-bearing figures.
  const answerSpans: AnswerSpan[] = [
    { text: `In ${state.label}, a ${fmtMoney(hero.raise)} raise at ` },
    { text: `${fmtMoney(hero.currentIncome)}` },
    { text: ` can cut a ${CANON_FAMILY_LABEL}'s real take-home by ` },
    { text: `${fmtMoney(hero.loss)} a year`, emphasis: "loss" },
    {
      text: hero.safeExit
        ? `, because benefits fall away faster than the raise. Take-home recovers past `
        : `, because benefits fall away faster than the raise comes in.`,
    },
    ...(hero.safeExit
      ? ([
          { text: `${fmtMoney(hero.safeExit)}`, emphasis: "gain" as const },
          { text: `, the safe exit.` },
        ] as AnswerSpan[])
      : []),
  ];

  return {
    ...hero,
    results,
    answerSpans,
    tableRows,
    programFacts,
    dateModified: latestRetrieved(sources),
    sources,
    essentialPlanCliff: essentialPlanCliff(state.code),
  };
}

/** Latest `retrieved` ISO date across a state's sources (engine provenance), for
 *  the Article `dateModified`. Falls back to today if none is present. */
export function latestRetrieved(sources: Source[]): string {
  const dates = sources
    .map((s) => s.retrieved)
    .filter((d): d is string => !!d)
    .sort();
  return dates.length > 0 ? dates[dates.length - 1] : new Date().toISOString().slice(0, 10);
}

/** Human "Checked 4 Jul 2026" from the latest source date, or null. Plain sans
 *  tabular-nums (never monospace). */
export function freshnessLabel(sources: Source[]): string | null {
  const iso = latestRetrieved(sources);
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Local integer-dollar formatter (kept here so states.ts stays self-contained
 *  and edge-safe; mirrors components/calculator/derive.ts fmtDollars). */
function fmtMoney(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

/* ── The program-spoke model (Template B) ─────────────────────────────────────
   Per (state, program): the engine-true income where that benefit falls away,
   its steepest drop, the canonical scenario's loss + safe exit, plus the small
   set of program-specific facts the spoke leads with (Medicaid expansion, the
   childcare subsidy name, whether the household needs a voucher). All engine-
   derived. Only ever called for a combo that passed the anti-thin gate. */
export interface SpokeFact {
  label: string;
  value: string;
}

export interface SpokeModel {
  state: SeoState;
  program: ProgramDef;
  familyLabel: string;
  /** DerivedResults for the reused CliffChart (canonical voucher-aware scenario). */
  results: DerivedResults;
  currentIncome: number;
  offeredIncome: number;
  familySize: number;
  /** This program's steepest drop (positive dollars). */
  worstDrop: number;
  /** Income the benefit falls away, engine-true, or null. */
  endsAtIncome: number | null;
  /** Whether the state expanded Medicaid (relevant to the Medicaid spoke). */
  medicaidExpanded: boolean;
  /** The state's childcare subsidy program name (relevant to the childcare spoke). */
  childcareSubsidyName: string;
  /** Program-specific fuel facts to surface at the top of the spoke. */
  facts: SpokeFact[];
  /** ISO date the underlying rules were last checked. */
  dateModified: string;
  sources: Source[];
}

export function buildSpokeModel(state: SeoState, program: ProgramDef): SpokeModel {
  const rules = getState(state.code);
  const facts = programCliffFacts(state.code, program);
  const scenarioOpts = canonScenario(state.code, program);

  // Anchor the chart to the raise that straddles THIS program's steepest drop,
  // so the spoke's chart visibly shows the program falling away.
  const points = getCliffData(scenarioOpts);
  let atIdx = 0;
  let worst = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const step = points[i + 1][program.valueKey] - points[i][program.valueKey];
    if (step < worst) {
      worst = step;
      atIdx = i;
    }
  }
  const currentIncome = points[atIdx].income;
  const offeredIncome = points[atIdx + 1].income;
  const results = deriveResults(scenarioOpts, currentIncome, offeredIncome);
  const sources = getStateSources(state.code);

  const spokeFacts = buildSpokeFacts(state, program, rules, facts);

  return {
    state,
    program,
    familyLabel: CANON_FAMILY_LABEL,
    results,
    currentIncome,
    offeredIncome,
    familySize: CANON_FAMILY_SIZE,
    worstDrop: facts.worstDrop,
    endsAtIncome: facts.endsAtIncome,
    medicaidExpanded: rules.medicaid.expanded,
    childcareSubsidyName: rules.childcare.subsidyName,
    facts: spokeFacts,
    dateModified: latestRetrieved(sources),
    sources,
  };
}

/** Program-specific fuel facts, engine-derived, in a two-layer label/value shape.
 *  These are the "SNAP gross limit / Medicaid expansion flag / childcare entry+exit
 *  / housing standard" fuel the spoke leads with. Incomes come from the engine
 *  curve (endsAtIncome) so they are true, not nominal. */
function buildSpokeFacts(
  state: SeoState,
  program: ProgramDef,
  rules: StateRules,
  facts: ProgramCliffFacts
): SpokeFact[] {
  const endsAt = facts.endsAtIncome ? fmtMoney(facts.endsAtIncome) : null;
  const out: SpokeFact[] = [];

  if (endsAt) {
    out.push({ label: "Falls away around", value: `${endsAt}/yr` });
  }
  out.push({ label: "Biggest single drop", value: `${fmtMoney(facts.worstDrop)}` });

  if (program.slug === "medicaid") {
    out.push({
      label: "Coverage type",
      value: rules.medicaid.expanded
        ? "Expanded, adults covered to a higher income"
        : "Not expanded, adult coverage ends early",
    });
  }
  if (program.slug === "childcare") {
    out.push({ label: "Program", value: rules.childcare.subsidyName });
  }
  if (program.slug === "housing") {
    out.push({
      label: "Local rent covered up to",
      value: `${fmtMoney(rules.housing.paymentStandardMonthly)}/mo`,
    });
  }
  if (program.slug === "snap") {
    out.push({
      label: "Counts your pay before tax",
      value: "Gross wages, not take-home",
    });
  }
  return out;
}
