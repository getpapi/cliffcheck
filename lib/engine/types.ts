/**
 * lib/engine/types.ts — public type contract for the CliffCheck benefit engine.
 *
 * Extracted verbatim from the v1 single-file build (_archive/index.html).
 * Types only — no calculation logic. See docs/replatform/PLAN.md §"Engine extraction".
 */

/** Two-letter state code for a supported (or candidate) state. */
export type StateCode = string;

/**
 * Input to the take-home orchestrator. Options-object signature (the documented
 * contract). `annualIncome`, `familySize`, and `state` are required; the rest are
 * optional knobs that default to the same values the original orchestrator used.
 */
export interface TakeHomeInput {
  /** Annual gross wages in dollars. */
  annualIncome: number;
  /** Total household size (adults + children). */
  familySize: number;
  /** Two-letter state code (e.g. 'OH'). */
  state: StateCode;
  /** Number of adults in the household. Default 2. */
  adultCount?: number;
  /** Whether the family is enrolled in the state childcare subsidy (continuation eligibility). */
  pfccEnrolled?: boolean;
  /** Whether the household holds a Section 8 / Housing Choice Voucher. */
  hasVoucher?: boolean;
  /** Whether the household has employer-sponsored health insurance (short-circuits ACA). */
  employerHealthInsurance?: boolean;
  /** Employer 401(k) match rate as a percent of salary. */
  matchRate?: number;
  /** Annual HSA contribution (reduces MAGI). */
  hsaContribution?: number;
  /** Annual pre-tax 401(k) contribution (reduces MAGI). */
  pretax401k?: number;
  /**
   * Annual dependent-care FSA election (pre-tax). Reduces MAGI for ACA and
   * Medicaid only, exactly like HSA / pre-tax 401(k). Federal cap $5,000 —
   * clamped to [0, 5000] in the orchestrator. Does NOT touch the childcare
   * subsidy (that is a fixed per-child value minus an income-based copay and has
   * no user-entered expense base, so there is no double-count).
   */
  dependentCareFsa?: number;
}

/**
 * Full 16-field breakdown returned by getEffectiveTakeHome. All dollar values are
 * annual integers. `acaCost`, `stateTaxOwed`, `ficaOwed`, and `federalTaxOwed`
 * are positive amounts subtracted from totalEffective; everything else is
 * additive. `federalTaxOwed` is the GROSS bracket tax — `ctcValue` is the
 * DELIVERED credit (non-refundable offset + capped refundable ACTC), so adding
 * ctcValue while subtracting federalTaxOwed nets to the family's true position
 * without double-counting (task-181; see lib/engine/fedTax.ts).
 */
export interface TakeHomeBreakdown {
  grossWages: number;
  magi: number;
  magiReduction: number;
  snapValue: number;
  medicaidValue: number;
  acaCost: number;
  acaCSRValue: number;
  section8Value: number;
  childcareValue: number;
  eitcValue: number;
  ctcValue: number;
  stateTaxOwed: number;
  ficaOwed: number;
  federalTaxOwed: number;
  matchValue: number;
  totalEffective: number;
}

/**
 * Provenance metadata for a gov-sourced rule value. Populated and consumed today:
 * the structured records live in lib/engine/provenance.ts (PROGRAM_PROVENANCE +
 * STATE_PROGRAM_PROVENANCE), are surfaced per-state via collectSources(), rendered
 * on /methodology, and gov-host-guarded by __tests__/provenance.test.ts.
 *
 * Granularity is PER-PROGRAM (one record per program/source), not per scalar
 * constant — a deliberate design choice (provenance.ts header explains why: this
 * is transcription of the citation comments, not per-value research). The dollar
 * figures still live in the FED table / per-state rule objects.
 */
export interface Provenance {
  source: string;
  url: string;
  citation?: string;
  retrieved: string;
  note?: string;
}

/**
 * A rule value paired with its provenance — an available wrapper for a possible
 * future PER-VALUE provenance layer. Currently UNUSED: provenance is attached at
 * program granularity (see Provenance above / provenance.ts), which is what the
 * methodology page and the per-state confidence badge read. Kept as scaffolding
 * for a later cycle that needs per-constant sourcing; wire it in then, not now.
 */
export interface Rule<T> {
  value: T;
  prov: Provenance;
}

// ── State rule shapes ───────────────────────────────────────────────────────

export interface StateSnapRules {
  grossLimitFPL: number;
}

export interface StateMedicaidRules {
  expanded: boolean;
  /** Expansion-state adult eligibility ceiling (FPL fraction). */
  expansionFPL?: number;
  /** Children eligibility ceiling (FPL fraction). */
  childrenFPL?: number;
  /** Non-expansion: parent eligibility ceiling (FPL fraction). */
  parentFPL?: number;
  /** Non-expansion: childless-adult eligibility ceiling (FPL fraction). */
  childlessAdultFPL?: number;
}

/**
 * A state's Basic Health Program (ACA §1331) tier — currently only New York's
 * Essential Plan. Sits between Medicaid (≤ expansion FPL) and the full
 * marketplace: near-$0-premium coverage up to `maxFPL`, above which the
 * household ages into marketplace PTC premiums. That transition is a second
 * benefits cliff distinct from the standard program-loss cliff. Optional on
 * StateAcaRules — undefined for every state without a BHP, whose ACA behaviour
 * is therefore unchanged.
 */
export interface StateEssentialPlanRules {
  /** Upper FPL bound of eligibility (e.g. 2.5 = 250% FPL). Above it the
   *  household falls through to normal marketplace PTC — the second cliff. */
  maxFPL: number;
  /** Flat monthly premium paid while enrolled (NY 2026: 0 for all tiers).
   *  Annualised as monthlyPremium × 12 in calcACAPremium. */
  monthlyPremium: number;
}

export interface StateAcaRules {
  /** Second-lowest-cost Silver plan monthly premium by household size (1–6). */
  slcspMonthly: Record<number, number>;
  /** Optional Basic Health Program tier (NY Essential Plan). Present only for
   *  states that run a §1331 BHP; undefined leaves ACA math unchanged. */
  essentialPlan?: StateEssentialPlanRules;
}

export interface StateChildcareRules {
  subsidyName: string;
  entryFPL: number;
  exitFPL: number;
  coPayRate: number;
  coPayFreeFPL: number;
  /** Annual gross childcare value indexed by number of children (0..3+). */
  valuePerChild: number[];
}

export interface StateHousingRules {
  incomeLimitAnnual: number;
  paymentStandardMonthly: number;
  tenantShareRate: number;
}

/** One marginal bracket in a progressive state income-tax schedule. `upTo` is
 *  the bracket's upper bound expressed on the POST-FLOOR taxable base
 *  (income − noTaxFloor), NOT on gross; the final (top) bracket uses upTo: null. */
export interface StateTaxBracket {
  upTo: number | null;
  rate: number;
}

export interface StateIncomeTaxRules {
  noTaxFloor: number;
  flatRate: number;
  /** Optional progressive marginal schedule applied to (income − noTaxFloor).
   *  When present it SUPERSEDES flatRate (flat states omit it). Each bracket's
   *  `upTo` is on the same post-floor taxable base; entries are ascending and the
   *  last one is the open-ended top bracket (upTo: null). See calcStateIncomeTax. */
  brackets?: StateTaxBracket[];
}

/** Shape of a single state's rule object (a slice of the original STATES table). */
export interface StateRules {
  supported: boolean;
  label: string;
  snap: StateSnapRules;
  medicaid: StateMedicaidRules;
  aca: StateAcaRules;
  childcare: StateChildcareRules;
  housing: StateHousingRules;
  /** Optional — present only for states with a modelled (flat) income tax. */
  incomeTax?: StateIncomeTaxRules;
}

/** A gov source entry surfaced by getStateSources / collectSources. */
export interface Source {
  /** Program key (e.g. 'snap', 'medicaid', 'aca', 'childcare', 'housing', 'incomeTax'). */
  program: string;
  /** Human label for the source. */
  label: string;
  /** Gov URL. Omitted when a program's only source is non-gov (e.g. OH income tax). */
  url?: string;
  /** Inline citation text, where available. */
  citation?: string;
  /** ISO date the source was retrieved/transcribed, where available. */
  retrieved?: string;
}

/** Options shared by the per-program calc functions (internal positional opts). */
export interface CalcOpts {
  stateCode?: StateCode;
  pfccEnrolled?: boolean;
  hasVoucher?: boolean;
  adultCount?: number;
  employerHealthInsurance?: boolean;
  matchRate?: number;
  hsaContribution?: number;
  pretax401k?: number;
  /** Annual dependent-care FSA election (pre-tax, reduces MAGI; cap $5,000). */
  dependentCareFsa?: number;
}

// NOTE: there is no engine-level HeroScenario type. Per-state hero scenarios are
// owned by lib/seo/states.ts (heroScenario(), state-parameterised and engine-
// derived), which every OG card / hero surface consumes. The old lib/engine
// scenarios.ts + getHeroScenarios were an unused, superseded duplicate (a hard-
// coded 4-state SEEDS list feeding no live surface) and were deleted in task-171.
