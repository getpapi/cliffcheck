"use client";

/**
 * DualIncomePanel — the "should adult 2 work?" comparison (task-93).
 *
 * A single quiet toggle available ONLY when the household has two adults. When on,
 * it runs the SAME engine as the main chart (via deriveDualIncome) to answer one
 * question: after childcare and benefit loss, how much of the second earner's
 * paycheck actually survives? This is a secondary readout — it never competes with
 * the hero delta. It lives in the input rail.
 *
 * The on/off state is a controlled profile field (`dualIncomeOn`, task-140) owned
 * by Calculator's reducer and round-tripped through the URL hash, so a shared
 * link restores the panel open — same as the other scenario inputs.
 *
 * Voice + palette follow PRODUCT.md / DESIGN.md: name the system (the cliff eats
 * the paycheck, the person isn't failing), concrete dollars, negative-delta red
 * only when the second wage is largely lost, positive-green when it survives. No
 * motion on numbers.
 */
import { useId } from "react";
import type { ScenarioOpts } from "./derive";
import { deriveDualIncome, fmtDollars } from "./derive";
import { Switch } from "@/components/ui/switch";

export function DualIncomePanel({
  opts,
  currentIncome,
  offeredIncome,
  adultCount,
  on,
  onToggle,
}: {
  opts: ScenarioOpts;
  currentIncome: number;
  offeredIncome: number;
  adultCount: number;
  on: boolean;
  onToggle: (on: boolean) => void;
}) {
  const switchId = useId();
  // Gated: only meaningful with two adults. Absent (not a disabled placeholder)
  // when there's only one adult — nothing to compare.
  if (adultCount < 2) return null;

  const result = deriveDualIncome(opts, currentIncome, offeredIncome);
  const { secondEarnerWages, delta, eatenByCliff } = result;
  // With no raise there's no distinct second-earner wage to test.
  const hasSecondWage = secondEarnerWages > 0;

  // `delta` can be NEGATIVE: the second paycheck can cost the household more in
  // lost benefits (childcare, Medicaid) than it adds in wages — a real, common
  // cliff outcome. Format the headline as a signed dollar (−$X) and adapt the copy.
  const keptPct = hasSecondWage
    ? Math.round((delta / secondEarnerWages) * 100)
    : 0;
  const lost = Math.max(0, secondEarnerWages - delta);
  const netLoss = delta < 0; // the second earner working leaves the household behind
  const sign = delta < 0 ? "−" : "";
  const deltaColor = eatenByCliff
    ? "var(--color-negative-delta)"
    : "var(--color-positive-delta)";

  return (
    <section
      aria-label="Should the second adult work?"
      className="cc-ord-dual"
      style={{
        backgroundColor: "var(--color-surface-white)",
        border: "1.5px solid var(--color-border-stone)",
        borderRadius: "var(--radius-xl)",
        boxShadow: "var(--elevation-card)",
        padding: "var(--space-lg)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "var(--space-sm)",
          minHeight: 44,
        }}
      >
        <label
          htmlFor={switchId}
          style={{
            fontSize: "var(--type-subheading)",
            fontWeight: 600,
            color: "var(--color-text-secondary)",
            lineHeight: 1.4,
            cursor: "pointer",
          }}
        >
          Should the second adult work?
          <span
            style={{
              display: "block",
              fontSize: "var(--type-caption)",
              fontWeight: 400,
              color: "var(--color-text-muted)",
              marginTop: 2,
            }}
          >
            See how much of the second paycheck survives the cliff.
          </span>
        </label>
        <Switch
          id={switchId}
          checked={on}
          onCheckedChange={onToggle}
          className="mt-0.5 shrink-0"
        />
      </div>

      {on && (
        <div
          style={{
            marginTop: "var(--space-md)",
            paddingTop: "var(--space-md)",
            borderTop: "1px solid var(--color-border-stone)",
          }}
        >
          {hasSecondWage ? (
            <div
              style={{
                borderLeft: `3px solid ${deltaColor}`,
                paddingLeft: "var(--space-md)",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "var(--type-caption)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  color: "var(--color-text-muted)",
                }}
              >
                {netLoss ? "Second paycheck costs you" : "Second paycheck kept"}
              </p>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: "clamp(1.6rem, 6vw, 2rem)",
                  fontWeight: 800,
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                  color: deltaColor,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {sign}
                {fmtDollars(Math.abs(delta))}
                <span
                  style={{
                    fontSize: "0.42em",
                    fontWeight: 600,
                    color: "var(--color-text-muted)",
                    marginLeft: "0.3em",
                  }}
                >
                  {netLoss ? "vs" : "of"} {fmtDollars(secondEarnerWages)}/yr earned
                </span>
              </p>
              <p
                style={{
                  margin: "8px 0 0",
                  fontSize: "var(--type-body)",
                  lineHeight: 1.55,
                  color: "var(--color-text-secondary)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {netLoss
                  ? `Earning ${fmtDollars(
                      secondEarnerWages
                    )}/yr leaves your household ${fmtDollars(
                      Math.abs(delta)
                    )}/yr behind. The lost childcare and benefits cost more than the second wage brings in.`
                  : eatenByCliff
                    ? `The cliff eats ${fmtDollars(
                        lost
                      )}/yr of the second wage. That paycheck adds only ${keptPct}% to your real take-home.`
                    : `The second paycheck holds up. ${keptPct}% of it reaches your real take-home after benefit changes.`}
              </p>
            </div>
          ) : (
            <p
              style={{
                margin: 0,
                fontSize: "var(--type-body)",
                lineHeight: 1.55,
                color: "var(--color-text-secondary)",
              }}
            >
              Set the new wages above the current wages first. The gap is the second
              earner&rsquo;s pay, and that&rsquo;s what this tests against the cliff.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
