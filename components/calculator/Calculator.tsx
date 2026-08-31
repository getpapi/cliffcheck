"use client";

/**
 * Calculator — the root client island for the CliffCheck tool (task-118).
 *
 * Owns the scenario profile via useReducer, syncs it to/from the URL hash
 * (debounced) so a scenario is shareable by link, and computes results from the
 * engine on EVERY change — live, no submit button (DESIGN.md). Financial inputs
 * never leave the device: there is no fetch, no server action, no API. The URL
 * hash carries only non-identifying scenario shape (state, incomes, family size,
 * flags) — share-a-scenario, not data egress.
 *
 * Layout (DESIGN-DIRECTION.md §13/§14, owner brief): a compact tool header
 * (one tight title line), then the hero delta band, then a two-pane working area
 * where the inputs and the cliff chart sit side by side and BOTH fit in one
 * desktop viewport (move a slider, see the delta + chart change together, no
 * scroll). The itemised breakdown, sources and manager brief live below the
 * fold. On mobile it collapses to one column with the delta + chart near the
 * top. Calm motion only — results are instant and never animate (no tickers).
 */
import { useEffect, useMemo, useReducer, useRef } from "react";
import {
  isSupportedState,
  getStateSources,
  getSupportedStates,
  type Source,
} from "@/lib/engine";
import {
  type Profile,
  DEFAULT_PROFILE,
  parseProfileHash,
  encodeProfileHash,
} from "@/lib/profile-url";
import { deriveResults, type ScenarioOpts } from "./derive";
import { IncomeSlidersCard, SituationCard } from "./InputForm";
import { DualIncomePanel } from "./DualIncomePanel";
import { HeroDelta, MobileAnswerBar } from "./LiveSummaryStrip";
import { CliffChart } from "./CliffChart";
import { ResultCards } from "./ResultCards";
import { ManagerBrief } from "./ManagerBrief";
import { SourceChips, ConfidenceBadge } from "./SourceChip";
import { TipJar } from "./TipJar";

// ── Reducer ────────────────────────────────────────────────────────────────
type Action =
  | { type: "set"; field: keyof Profile; value: Profile[keyof Profile] }
  | { type: "replace"; profile: Profile };

function reducer(state: Profile, action: Action): Profile {
  switch (action.type) {
    case "set": {
      const next = { ...state, [action.field]: action.value } as Profile;
      // Coherence: adults can never exceed family size.
      if (next.adultCount > next.familySize) {
        next.adultCount = Math.min(2, next.familySize);
      }
      // Childcare flag is meaningless with no children — clear it.
      if (next.familySize - next.adultCount <= 0) {
        next.pfccEnrolled = false;
      }
      // Dual-income comparison needs two adults — clear it if we drop below.
      if (next.adultCount < 2) {
        next.dualIncomeOn = false;
      }
      return next;
    }
    case "replace":
      return action.profile;
    default:
      return state;
  }
}

export function Calculator() {
  // Initialise from defaults on the server; hydrate from the URL hash on mount
  // (the hash is only available client-side — keeps server/client markup stable).
  const [profile, dispatch] = useReducer(reducer, DEFAULT_PROFILE);
  const hydrated = useRef(false);

  // Hydrate from the URL hash once, on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const parsed = parseProfileHash(window.location.hash);
    dispatch({ type: "replace", profile: parsed });
    hydrated.current = true;
  }, []);

  // Sync profile → URL hash, debounced (250ms). replaceState avoids polluting
  // history on every keypress. Skipped until after first hydration so we never
  // clobber an inbound shared link.
  useEffect(() => {
    if (typeof window === "undefined" || !hydrated.current) return;
    const id = window.setTimeout(() => {
      const hash = encodeProfileHash(profile);
      const url = `${window.location.pathname}${window.location.search}#${hash}`;
      window.history.replaceState(null, "", url);
    }, 250);
    return () => window.clearTimeout(id);
  }, [profile]);

  const supported = isSupportedState(profile.state);

  // Engine options derived from the profile (income axis handled per-call).
  const opts: ScenarioOpts = useMemo(
    () => ({
      state: profile.state,
      familySize: profile.familySize,
      adultCount: profile.adultCount,
      hasVoucher: profile.hasVoucher,
      pfccEnrolled: profile.pfccEnrolled,
      employerHealthInsurance: profile.employerHealthInsurance,
      matchRate: profile.matchRate,
      hsaContribution: profile.hsaContribution,
      pretax401k: profile.pretax401k,
      dependentCareFsa: profile.dependentCareFsa,
    }),
    [profile]
  );

  // Live results — recomputed on every profile change (the whole point: instant).
  const results = useMemo(
    () =>
      supported
        ? deriveResults(opts, profile.currentIncome, profile.offeredIncome)
        : null,
    [opts, profile.currentIncome, profile.offeredIncome, supported]
  );

  const sources: Source[] = useMemo(
    () => (supported ? getStateSources(profile.state) : []),
    [profile.state, supported]
  );

  const set = <K extends keyof Profile>(field: K, value: Profile[K]) =>
    dispatch({ type: "set", field, value });

  return (
    <div
      className="cc-container"
      style={{
        paddingTop: "var(--space-md)",
        paddingBottom: "var(--space-xxl)",
      }}
    >
      {supported && results ? (
        <>
          {/* Phone-only compact answer bar: slides in when the hero band
              scrolls off, so the delta is ALWAYS visible while moving a
              slider anywhere on the page (round-2 mobile fix). */}
          <MobileAnswerBar results={results} />

          {/* On phones the rail/out wrappers dissolve (display: contents) and
              the cards interleave: answer → sliders → chart → situation →
              dual income. On desktop: inputs left, sticky answer+chart right. */}
          <div className="cc-tool">
            <div className="cc-tool-rail">
              <IncomeSlidersCard profile={profile} set={set} />
              <SituationCard profile={profile} set={set} supported={supported} />
              <DualIncomePanel
                opts={opts}
                currentIncome={profile.currentIncome}
                offeredIncome={profile.offeredIncome}
                adultCount={profile.adultCount}
                on={profile.dualIncomeOn}
                onToggle={(v) => set("dualIncomeOn", v)}
              />
            </div>

            {/* The answer band + chart, STICKY on desktop — so changing any
                lever (even deep in the advanced levers) updates a chart/number
                that's still on screen. This is the core loop: input → visible
                impact. */}
            <div className="cc-tool-out">
              <HeroDelta
                results={results}
                stateLabel={stateLabel(profile.state)}
                familySize={profile.familySize}
              />
              <CliffChart
                results={results}
                currentIncome={profile.currentIncome}
                offeredIncome={profile.offeredIncome}
                stateLabel={stateLabel(profile.state)}
                familySize={profile.familySize}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="cc-tool">
          <div className="cc-tool-rail">
            <SituationCard profile={profile} set={set} supported={supported} />
          </div>
          <div
            className="cc-tool-out"
            style={{ alignSelf: "start" }}
          >
            <div
              className="cc-ord-hero"
              style={{
                border: "1.5px solid var(--color-border-stone)",
                borderRadius: "var(--radius-xl)",
                backgroundColor: "var(--color-surface-white)",
                boxShadow: "var(--elevation-card)",
                padding: "var(--space-lg)",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "var(--type-heading)",
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                }}
              >
                We don&rsquo;t cover this state yet
              </h2>
              <p
                style={{
                  margin: "var(--space-xs) 0 0",
                  maxWidth: "58ch",
                  fontSize: "var(--type-body)",
                  lineHeight: 1.6,
                  color: "var(--color-text-secondary)",
                }}
              >
                Pick a covered state to see your cliff. CliffCheck covers{" "}
                {getSupportedStates()
                  .map(({ label }) => label)
                  .join(", ")}{" "}
                today, with more on the way.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail below the tool: itemised breakdown + provenance on the left,
           the manager brief (the act-on-it artifact) on the right, and the
           optional support ask spanning below. One designed band, no orphaned
           centre column. ── */}
      {supported && results && (
        <div className="cc-detail">
          <div className="cc-detail-stack">
            <ResultCards results={results} />
            <SourceChips sources={sources} />
            <ConfidenceBadge sources={sources} />
          </div>
          <ManagerBrief profile={profile} results={results} />
          <div className="cc-detail-full">
            <TipJar />
          </div>
        </div>
      )}
    </div>
  );
}

// Resolve the supported-state label for chart/answer-band copy from the engine
// registry, so new states auto-track (the old hand-kept map went stale at 4
// states). Falls back to the raw code for unsupported deeplinks.
const STATE_LABELS: Record<string, string> = Object.fromEntries(
  getSupportedStates().map(({ code, label }) => [code, label])
);
function stateLabel(code: string): string {
  return STATE_LABELS[code] ?? code;
}
