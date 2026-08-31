"use client";

/**
 * Input surface, round-2 (10-07-2026): split in two so the interactive core
 * sits next to the answer instead of at the bottom of one huge form.
 *
 * - IncomeSlidersCard — the two income sliders, the levers users actually move.
 *   Lives directly under the answer band on phones (cc-ord-sliders) and at the
 *   top of the input rail on desktop.
 * - SituationCard — the set-once facts (state, family, adults, benefit flags,
 *   401(k) match, advanced levers) collapsed into a compact summary strip
 *   ("Ohio · 4 people · 2 adults — Edit") that expands on tap. Forced open when
 *   the selected state isn't covered, so the state picker is never hidden.
 *
 * Every control updates the scenario live (no submit button). Labels sit above
 * inputs (never placeholder-only); focus rings are amber (theme --ring), never
 * blue. 48px controls, 44px+ tap targets, single column at 375px. Controls are
 * shadcn/ui themed to the warm canon — zero native default controls.
 */
import { useId, useState } from "react";
import { ChevronRight } from "lucide-react";
import { getSupportedStates, isSupportedState, getState } from "@/lib/engine";
import type { Profile } from "@/lib/profile-url";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

/** Field label — 13px/600 secondary, sits above every control. */
function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <Label
      htmlFor={htmlFor}
      className="mb-1.5 block text-[13px] font-semibold text-text-secondary"
    >
      {children}
    </Label>
  );
}

function Helper({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1.5 text-xs leading-relaxed text-text-muted">{children}</p>
  );
}

/** One consistent section break inside the situation card. */
function SectionBreak({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-5 border-t border-border-stone pt-5">{children}</div>
  );
}

/** Shared card shell — resting surface with the round-2 definition system. */
const cardShell =
  "rounded-2xl border-[1.5px] border-border-stone bg-surface-white";

// ── The income sliders: the levers users actually move ──────────────────────
// task-176: two entry modes for the same annual values. "Annual" is the classic
// sliders; "Hourly" takes $/hr + hours/week (how the target user is actually
// paid) and derives annual = rate × hours × 52, rounded to the slider's $1,000
// step, feeding the SAME profile fields. Hourly inputs are display/entry
// convenience only — component state, never the profile, hash, or storage.
type IncomeMode = "annual" | "hourly";

/** Derive annual wages from an hourly rate, snapped to the $1,000 slider step. */
function annualFromHourly(rate: number, hoursPerWeek: number): number {
  const raw = rate * hoursPerWeek * 52;
  return clamp(Math.round(raw / 1000) * 1000, 0, 200000);
}

/** Seed an hourly rate from annual wages (2 decimals, e.g. $21.15/hr). */
function hourlyFromAnnual(annual: number, hoursPerWeek: number): number {
  if (hoursPerWeek <= 0) return 0;
  return Math.round((annual / (hoursPerWeek * 52)) * 100) / 100;
}

export function IncomeSlidersCard({
  profile,
  set,
}: {
  profile: Profile;
  set: <K extends keyof Profile>(field: K, value: Profile[K]) => void;
}) {
  const currentId = useId();
  const offeredId = useId();
  const hoursId = useId();
  const [mode, setMode] = useState<IncomeMode>("annual");
  const [hoursPerWeek, setHoursPerWeek] = useState(40);
  // Hourly rates are seeded from the profile's annual values on mode switch and
  // kept locally after — the annual profile stays the single source of truth.
  const [currentRate, setCurrentRate] = useState(0);
  const [offeredRate, setOfferedRate] = useState(0);

  const handleModeChange = (next: IncomeMode) => {
    if (next === mode) return;
    if (next === "hourly") {
      // Seed rates from today's annual values so the toggle never jumps the math.
      setCurrentRate(hourlyFromAnnual(profile.currentIncome, hoursPerWeek));
      setOfferedRate(hourlyFromAnnual(profile.offeredIncome, hoursPerWeek));
    }
    // Hourly → Annual keeps the derived annual values already in the profile.
    setMode(next);
  };

  const handleRate = (which: "current" | "offered", rate: number) => {
    const r = clamp(rate, 0, 500);
    if (which === "current") {
      setCurrentRate(r);
      set("currentIncome", annualFromHourly(r, hoursPerWeek));
    } else {
      setOfferedRate(r);
      set("offeredIncome", annualFromHourly(r, hoursPerWeek));
    }
  };

  const handleHours = (h: number) => {
    const hours = clamp(h, 1, 80);
    setHoursPerWeek(hours);
    // Hours reshape both annual values — rates are what the user typed.
    set("currentIncome", annualFromHourly(currentRate, hours));
    set("offeredIncome", annualFromHourly(offeredRate, hours));
  };

  // The per-hour raise, derived from the PROFILE annuals (post-rounding) so the
  // figure always matches the engine's inputs exactly.
  const raisePerHour =
    (profile.offeredIncome - profile.currentIncome) / (hoursPerWeek * 52);

  return (
    <section
      aria-label="Your income"
      className={`cc-ord-sliders ${cardShell} p-5 md:p-6`}
      style={{ boxShadow: "var(--elevation-card)" }}
    >
      {/* Entry-mode toggle — same segmented pattern as "Adults in household". */}
      <div className="mb-4">
        <div
          role="group"
          aria-label="How your pay is quoted"
          className="grid grid-cols-2 gap-1 rounded-lg bg-trust-surface p-1"
        >
          {(
            [
              ["annual", "Annual salary"],
              ["hourly", "Hourly pay"],
            ] as const
          ).map(([value, label]) => {
            const active = mode === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => handleModeChange(value)}
                className={
                  active
                    ? "h-10 cursor-pointer rounded-md border border-border-stone bg-surface-white text-sm font-bold text-text-primary shadow-xs"
                    : "h-10 cursor-pointer rounded-md border border-transparent text-sm font-semibold text-text-secondary hover:text-text-primary"
                }
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {mode === "annual" ? (
        <>
          <IncomeField
            id={currentId}
            label="Current household wages"
            hint="Gross pay for every working adult, before tax."
            value={profile.currentIncome}
            onChange={(v) => set("currentIncome", v)}
          />
          <IncomeField
            id={offeredId}
            label="New household wages after the raise"
            value={profile.offeredIncome}
            onChange={(v) => set("offeredIncome", v)}
            last
          />
        </>
      ) : (
        <>
          <HourlyField
            id={currentId}
            label="Current pay per hour"
            hint="Gross pay for every working adult, before tax."
            rate={currentRate}
            annual={profile.currentIncome}
            onChange={(r) => handleRate("current", r)}
          />
          <HourlyField
            id={offeredId}
            label="New pay per hour after the raise"
            rate={offeredRate}
            annual={profile.offeredIncome}
            onChange={(r) => handleRate("offered", r)}
          />
          <div className="mb-4">
            <FieldLabel htmlFor={hoursId}>Hours per week</FieldLabel>
            <Input
              id={hoursId}
              type="number"
              inputMode="numeric"
              min={1}
              max={80}
              step={1}
              value={hoursPerWeek}
              onChange={(e) => handleHours(Number(e.target.value))}
              className="h-12 rounded-lg px-3 text-base tabular-nums"
            />
            <Helper>Most full-time jobs are 40. We count 52 weeks a year.</Helper>
          </div>
          {/* The raise in the user's own unit — the visceral framing. */}
          <p
            className="m-0 rounded-md bg-trust-surface p-3 text-sm font-semibold text-text-primary tabular-nums"
            aria-live="polite"
          >
            Your raise is{" "}
            <span
              style={{
                color:
                  raisePerHour >= 0
                    ? "var(--color-positive-delta)"
                    : "var(--color-negative-delta)",
              }}
            >
              {raisePerHour >= 0 ? "+" : "−"}$
              {Math.abs(raisePerHour).toFixed(2)}/hr
            </span>
          </p>
        </>
      )}
    </section>
  );
}

// ── Hourly field: $/hr input + live derived annual readout ───────────────────
function HourlyField({
  id,
  label,
  hint,
  rate,
  annual,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  rate: number;
  annual: number;
  onChange: (r: number) => void;
}) {
  return (
    <div className="mb-5">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <Label
          htmlFor={id}
          className="text-[13px] font-semibold text-text-secondary"
        >
          {label}
        </Label>
        {/* The derived annual the engine actually uses — always visible so the
            hourly entry never hides the number the math runs on. */}
        <span className="shrink-0 text-lg font-bold text-text-primary tabular-nums">
          ${annual.toLocaleString("en-US")}
          <span className="text-xs font-normal text-text-muted">/yr</span>
        </span>
      </div>
      <div className="relative">
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-base text-text-muted"
        >
          $
        </span>
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          min={0}
          max={500}
          step={0.25}
          value={rate}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-12 rounded-lg pr-14 pl-7 text-base tabular-nums"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-text-muted"
        >
          /hr
        </span>
      </div>
      {hint ? <Helper>{hint}</Helper> : null}
    </div>
  );
}

// ── The situation: set-once facts behind a compact summary strip ────────────
export function SituationCard({
  profile,
  set,
  supported,
}: {
  profile: Profile;
  set: <K extends keyof Profile>(field: K, value: Profile[K]) => void;
  supported: boolean;
}) {
  // The core filters (state, family size, adults) AND the three benefit flags
  // are ALWAYS visible (task-177): the flags decide whether major benefits are
  // even in play, so hiding them meant users under-reported and got a wrong
  // cliff. Only the optimisation levers (401(k) match, HSA, pre-tax 401(k),
  // dependent-care FSA) fold behind "Advanced levers", opening by default when
  // any is active (e.g. an inbound shared link).
  const [showLevers, setShowLevers] = useState(
    profile.matchRate > 0 ||
      profile.hsaContribution > 0 ||
      profile.pretax401k > 0 ||
      profile.dependentCareFsa > 0
  );
  const states = getSupportedStates();
  const kids = Math.max(0, profile.familySize - profile.adultCount);
  // The real, gov-sourced program name from the engine (single source of truth,
  // same value shown on /methodology and the source chips). Every supported
  // state carries subsidyName, so all 8 show their real name and future states
  // auto-populate. Falls back only for an unsupported/deeplinked state code.
  const ccName = isSupportedState(profile.state)
    ? getState(profile.state).childcare.subsidyName
    : "a childcare subsidy";
  const stateId = useId();
  const familyId = useId();
  const matchId = useId();
  const hsaId = useId();
  const k401Id = useId();
  const fsaId = useId();

  return (
    <section
      aria-label="Your situation"
      className={`cc-ord-situation ${cardShell}`}
      style={{ boxShadow: "var(--elevation-card)" }}
    >
      <div className="p-5 md:p-6">
        <h2 className="mb-4 text-[15px] font-bold text-text-primary">
          Your situation
        </h2>
        <div>
            {/* State + family size share a row where space allows. */}
            <div className="mb-4 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2">
              <div>
                <FieldLabel htmlFor={stateId}>State</FieldLabel>
                <Select
                  value={profile.state}
                  onValueChange={(v) => set("state", v)}
                >
                  <SelectTrigger
                    id={stateId}
                    className="h-12 w-full px-3 text-base"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {!supported && (
                      <SelectItem value={profile.state}>
                        {profile.state} (not yet covered)
                      </SelectItem>
                    )}
                    {states.map(({ code, label }) => (
                      <SelectItem key={code} value={code}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!supported && (
                  <p className="mt-1.5 text-xs leading-relaxed text-cta-hover-amber">
                    We don&apos;t cover this state yet. Pick a covered state to
                    see your cliff.
                  </p>
                )}
              </div>

              <div>
                <FieldLabel htmlFor={familyId}>Family size</FieldLabel>
                <Select
                  value={String(profile.familySize)}
                  onValueChange={(v) => set("familySize", Number(v))}
                >
                  <SelectTrigger
                    id={familyId}
                    className="h-12 w-full px-3 text-base"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} {n === 1 ? "person" : "people"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Adults — segmented control, not two loose buttons. */}
            <div className="mb-4">
              <FieldLabel>Adults in household</FieldLabel>
              <div
                role="group"
                aria-label="Adults in household"
                className="grid grid-cols-2 gap-1 rounded-lg bg-trust-surface p-1"
              >
                {[1, 2].map((n) => {
                  const active = profile.adultCount === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      aria-pressed={active}
                      onClick={() => set("adultCount", n)}
                      className={
                        active
                          ? "h-10 cursor-pointer rounded-md border border-border-stone bg-surface-white text-sm font-bold text-text-primary shadow-xs"
                          : "h-10 cursor-pointer rounded-md border border-transparent text-sm font-semibold text-text-secondary hover:text-text-primary"
                      }
                    >
                      {n === 1 ? "1 adult" : "2 adults"}
                    </button>
                  );
                })}
              </div>
              <Helper>
                Children = family size − adults
                {kids === 0
                  ? " (no children)"
                  : kids === 1
                    ? " (1 child)"
                    : ` (${kids} children)`}
              </Helper>
            </div>

            {/* The three benefit flags — first-class, always visible (task-177):
                each decides whether a whole program is in play, so they must
                never hide behind a fold. */}
            <SectionBreak>
              <FieldLabel>Benefits you have now</FieldLabel>
              <div className="flex flex-col gap-1">
                <CheckboxRow
                  checked={profile.hasVoucher}
                  onChange={(c) => set("hasVoucher", c)}
                  label="I have a Section 8 / Housing Choice Voucher"
                />
                <CheckboxRow
                  checked={profile.employerHealthInsurance}
                  onChange={(c) => set("employerHealthInsurance", c)}
                  label="I have employer health insurance"
                  helper="ACA premium and savings don't apply when you have qualifying employer coverage."
                />
                {kids > 0 && (
                  <CheckboxRow
                    checked={profile.pfccEnrolled}
                    onChange={(c) => set("pfccEnrolled", c)}
                    label={`Already enrolled in subsidised childcare (${ccName})`}
                  />
                )}
              </div>
            </SectionBreak>

            {/* Advanced levers — collapsible. Holds the OPTIMISATION levers
                (401(k) match moved here in task-177: it tunes the outcome, it
                does not gate a benefit). */}
            <SectionBreak>
              <Collapsible open={showLevers} onOpenChange={setShowLevers}>
                <CollapsibleTrigger className="flex min-h-11 w-full cursor-pointer items-center gap-2 text-left">
                  <ChevronRight
                    aria-hidden
                    className={`size-4 shrink-0 text-cta-hover-amber transition-transform ${
                      showLevers ? "rotate-90" : ""
                    }`}
                  />
                  <span className="shrink-0 text-sm font-semibold whitespace-nowrap text-text-secondary">
                    Advanced levers
                  </span>
                  <span className="min-w-0 truncate text-xs text-text-muted">
                    401(k) match, HSA &amp; pre-tax levers
                  </span>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="mt-3 flex flex-col gap-4">
                    <p className="m-0 text-xs leading-relaxed text-text-secondary">
                      HSA, traditional 401(k), and dependent-care FSA
                      contributions lower the income figure used for ACA savings
                      and Medicaid, which can restore benefits if you&apos;re
                      just over a cliff. SNAP uses gross wages regardless.
                    </p>

                    <div>
                      <FieldLabel htmlFor={matchId}>
                        Employer 401(k) match (% of salary)
                      </FieldLabel>
                      <Input
                        id={matchId}
                        type="number"
                        inputMode="decimal"
                        min={0}
                        max={20}
                        step={0.5}
                        value={profile.matchRate}
                        onChange={(e) =>
                          set("matchRate", clamp(Number(e.target.value), 0, 20))
                        }
                        className="h-12 rounded-lg px-3 text-base tabular-nums"
                      />
                      <Helper>
                        Optional. Enter the rate (e.g. 4 for 4%). Match scales
                        with salary, so a higher offer gains more. Default 0
                        (off).
                      </Helper>
                    </div>

                    <div>
                      <FieldLabel htmlFor={hsaId}>
                        Annual HSA contribution ($)
                      </FieldLabel>
                      <Input
                        id={hsaId}
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={9000}
                        step={100}
                        value={profile.hsaContribution}
                        onChange={(e) =>
                          set(
                            "hsaContribution",
                            clamp(Number(e.target.value), 0, 9000)
                          )
                        }
                        className="h-12 rounded-lg px-3 text-base tabular-nums"
                      />
                      <Helper>2026 limit: $4,300 (self) / $8,550 (family).</Helper>
                    </div>

                    <div>
                      <FieldLabel htmlFor={k401Id}>
                        Annual pre-tax 401(k) contribution ($)
                      </FieldLabel>
                      <Input
                        id={k401Id}
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={24000}
                        step={500}
                        value={profile.pretax401k}
                        onChange={(e) =>
                          set(
                            "pretax401k",
                            clamp(Number(e.target.value), 0, 24000)
                          )
                        }
                        className="h-12 rounded-lg px-3 text-base tabular-nums"
                      />
                      <Helper>2026 limit: $23,500. Pre-tax, not Roth.</Helper>
                    </div>

                    <div>
                      <FieldLabel htmlFor={fsaId}>
                        Annual dependent-care FSA ($)
                      </FieldLabel>
                      <Input
                        id={fsaId}
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={5000}
                        step={250}
                        value={profile.dependentCareFsa}
                        onChange={(e) =>
                          set(
                            "dependentCareFsa",
                            clamp(Number(e.target.value), 0, 5000)
                          )
                        }
                        className="h-12 rounded-lg px-3 text-base tabular-nums"
                      />
                      <Helper>
                        2026 limit: $5,000. Pre-tax pay set aside for childcare
                        or dependent care.
                      </Helper>
                    </div>

                    {(profile.hsaContribution > 0 ||
                      profile.pretax401k > 0 ||
                      profile.dependentCareFsa > 0) && (
                      <p className="m-0 rounded-md bg-[var(--color-chart-transition-fill)] p-3 text-xs leading-relaxed text-cta-hover-amber tabular-nums">
                        Taxable income reduced by $
                        {(
                          profile.hsaContribution +
                          profile.pretax401k +
                          profile.dependentCareFsa
                        ).toLocaleString("en-US")}
                        /yr. ACA savings and Medicaid reflect this. SNAP and
                        other benefits use gross wages.
                      </p>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </SectionBreak>
        </div>
      </div>
    </section>
  );
}

// ── Income field: a slider + a live number readout (both edit the same value) ─
function IncomeField({
  id,
  label,
  hint,
  value,
  onChange,
  last,
}: {
  id: string;
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  last?: boolean;
}) {
  return (
    <div className={last ? undefined : "mb-5"}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <Label
          htmlFor={id}
          className="text-[13px] font-semibold text-text-secondary"
        >
          {label}
        </Label>
        <span className="shrink-0 text-lg font-bold text-text-primary tabular-nums">
          ${value.toLocaleString("en-US")}
          <span className="text-xs font-normal text-text-muted">/yr</span>
        </span>
      </div>
      <Slider
        id={id}
        aria-label={label}
        min={0}
        max={200000}
        step={1000}
        value={[value]}
        onValueChange={(vals) => onChange(vals[0] ?? 0)}
        className="py-2.5"
      />
      {hint ? <Helper>{hint}</Helper> : null}
    </div>
  );
}

// ── Checkbox row ─────────────────────────────────────────────────────────────
function CheckboxRow({
  checked,
  onChange,
  label,
  helper,
}: {
  checked: boolean;
  onChange: (c: boolean) => void;
  label: string;
  helper?: string;
}) {
  const id = useId();
  return (
    <div className="flex min-h-11 items-start gap-3 py-1.5">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(c) => onChange(c === true)}
        className="mt-0.5 size-5 rounded-[6px]"
      />
      <Label
        htmlFor={id}
        className="block cursor-pointer text-sm leading-snug font-medium text-text-secondary"
      >
        {label}
        {helper && (
          <span className="mt-0.5 block text-xs font-normal text-text-muted">
            {helper}
          </span>
        )}
      </Label>
    </div>
  );
}

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}
