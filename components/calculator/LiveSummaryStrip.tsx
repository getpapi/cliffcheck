"use client";

/**
 * HeroDelta — the single answer band at the top of the tool, the ONLY place the
 * headline numbers live (DESIGN.md "Live summary strip" elevated to the hero,
 * DESIGN-DIRECTION.md §13/§14 "Oh Shit" standard). It carries the whole story on
 * one dense row: today → after → the cost of taking the offer → the safe exit
 * that clears the cliff. Nothing here is repeated below the fold.
 *
 * The cost delta is the dominant number (huge, negative-delta red when the offer
 * leaves the household worse, positive-delta green when it helps). The safe exit
 * sits beside it in safe-green. The from→to totals are the quiet support. Every
 * value is bigger and bolder than its label; tabular-nums throughout. Numbers are
 * static and instant. NEVER a count-up ticker (DESIGN.md trust promise).
 */
import { useEffect, useState } from "react";
import type { DerivedResults } from "./derive";
import { fmtDollars, fmtMonthly } from "./derive";

export function HeroDelta({
  results,
  stateLabel,
  familySize,
}: {
  results: DerivedResults;
  stateLabel: string;
  familySize: number;
}) {
  const { current, offered, diff, isWorse, isBetter, safeExit } = results;
  const deltaColor = isWorse
    ? "var(--color-negative-delta)"
    : isBetter
      ? "var(--color-positive-delta)"
      : "var(--color-text-secondary)";
  const sign = diff < 0 ? "−" : "+";
  const verb = isWorse ? "costs you" : isBetter ? "gains you" : "barely changes";

  return (
    <section
      id="cc-hero"
      aria-label="What the offer does to your take-home: pay plus benefits, after all taxes"
      className="cc-hero cc-ord-hero"
      style={{
        position: "relative",
        overflow: "hidden",
        backgroundColor: "var(--color-surface-white)",
        // Round-2 definition: the answer band is unmistakably THE surface —
        // 2px structural border + a signal-coloured rule across the top edge
        // (red when the offer costs, green when it gains: the colour is the
        // verdict, never decoration).
        border: "2px solid var(--color-border-strong)",
        borderRadius: "var(--radius-xl)",
        // The one raised surface on the page — the answer dominates (DESIGN.md
        // elevation: every other card rests on elevation-card).
        boxShadow: "var(--elevation-raised)",
        padding: "calc(var(--space-md) + 5px) var(--space-lg) var(--space-md)",
      }}
    >
      {/* The verdict rule: a flat signal-coloured strip clipped by the card's
          radius (absolute, so it stays out of the .cc-hero grid flow). */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 5,
          backgroundColor: deltaColor,
        }}
      />
      {/* The dominant number: the cost (or gain) of taking the offer. */}
      <div className="cc-hero-cost">
        <p style={labelRow}>
          Taking this offer{" "}
          <span style={{ color: deltaColor, fontWeight: 700 }}>{verb}</span>
        </p>
        <p
          id="cc-hero-delta"
          style={{
            margin: "2px 0 0",
            fontSize: "clamp(2.5rem, 7vw, 3.5rem)",
            fontWeight: 800,
            lineHeight: 0.9,
            letterSpacing: "-0.035em",
            color: deltaColor,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {/* One unbreakable figure: browsers treat U+2212 as a break
              opportunity, so a wide (5-digit) delta wrapped the sign onto its
              own line. nowrap keeps sign + amount + unit as a single unit. */}
          <span style={{ whiteSpace: "nowrap" }}>
            {sign}
            {fmtDollars(Math.abs(diff))}
            <span style={perYr}>/yr</span>
          </span>
        </p>
        <p style={subNote}>
          {sign}
          {fmtMonthly(Math.abs(diff))}/mo. {stateLabel}, household of {familySize}.
        </p>
      </div>

      {/* Supporting metrics: today → after (→ safe exit). A 3-row grid so every
          label shares the top row, every value shares one baseline, and the
          optional note shares the bottom row — an engineered row, not a stack. */}
      <div
        className="cc-hero-rail"
        data-cols={isWorse && safeExit !== null ? 3 : 2}
      >
        {/* task-181: the figure is an honest all-in number (pay + benefits,
            after FICA + federal + state tax) — the note says so at the source. */}
        <Metric
          label="Take-home today"
          value={current.totalEffective}
          note="pay + benefits, after all taxes"
        />
        <Metric
          label="After the offer"
          value={offered.totalEffective}
          valueColor={deltaColor}
        />
        {isWorse && safeExit !== null && (
          <Metric
            label="Safe exit"
            value={safeExit}
            valueColor="var(--color-positive-delta)"
            note="clears every cliff"
          />
        )}
      </div>
    </section>
  );
}

/**
 * MobileAnswerBar — the phone-only fix for the scroll loop. A compact bar fixed
 * to the top edge that slides in once the hero band scrolls off, so moving an
 * income slider anywhere on the page ALWAYS shows the delta changing. Purely a
 * visual echo of the hero (aria-hidden); desktop never renders it (CSS).
 */
export function MobileAnswerBar({ results }: { results: DerivedResults }) {
  const [show, setShow] = useState(false);
  const { diff, isWorse, isBetter, safeExit, offered } = results;

  useEffect(() => {
    // Watch the big delta number itself, not the whole hero card: the moment
    // ANY of the number is clipped off the top, the bar takes over — so the
    // delta is readable at every scroll position (the no-scroll-loop contract).
    const target =
      document.getElementById("cc-hero-delta") ??
      document.getElementById("cc-hero");
    if (!target || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) =>
        setShow(
          entry.intersectionRatio < 0.98 && entry.boundingClientRect.top < 0
        ),
      { threshold: [0, 0.98, 1] }
    );
    io.observe(target);
    return () => io.disconnect();
  }, []);

  const deltaColor = isWorse
    ? "var(--color-negative-delta)"
    : isBetter
      ? "var(--color-positive-delta)"
      : "var(--color-text-secondary)";
  const sign = diff < 0 ? "−" : "+";

  return (
    <div className="cc-answer-bar" data-show={show} aria-hidden="true">
      <span style={{ minWidth: 0 }}>
        <span style={barLabel}>
          {isWorse ? "This offer costs you" : isBetter ? "This offer gains you" : "This offer changes"}
        </span>
        <span
          className="tabular-nums"
          style={{
            display: "block",
            fontSize: "22px",
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            color: deltaColor,
            whiteSpace: "nowrap",
          }}
        >
          {sign}
          {fmtDollars(Math.abs(diff))}
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-muted)" }}>
            /yr
          </span>
        </span>
      </span>
      {isWorse && safeExit !== null ? (
        <span style={{ textAlign: "right", flexShrink: 0 }}>
          <span style={barLabel}>Safe exit</span>
          <span
            className="tabular-nums"
            style={{
              display: "block",
              fontSize: "17px",
              fontWeight: 700,
              lineHeight: 1.1,
              color: "var(--color-positive-delta)",
            }}
          >
            {fmtDollars(safeExit)}
          </span>
        </span>
      ) : (
        <span style={{ textAlign: "right", flexShrink: 0 }}>
          <span style={barLabel}>After the offer</span>
          <span
            className="tabular-nums"
            style={{
              display: "block",
              fontSize: "17px",
              fontWeight: 700,
              lineHeight: 1.1,
              color: "var(--color-text-primary)",
            }}
          >
            {fmtDollars(offered.totalEffective)}
          </span>
        </span>
      )}
    </div>
  );
}

const barLabel: React.CSSProperties = {
  display: "block",
  fontSize: "10.5px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "var(--color-text-muted)",
  lineHeight: 1.2,
};

function Metric({
  label,
  value,
  valueColor = "var(--color-text-primary)",
  note,
}: {
  label: string;
  value: number;
  valueColor?: string;
  note?: string;
}) {
  // Each metric spans all three grid rows so labels/values/notes align across
  // siblings (display: contents lets the children participate in the parent grid).
  return (
    <div className="cc-hero-metric">
      <p style={metricLabel}>{label}</p>
      <p
        style={{
          margin: 0,
          fontSize: "clamp(1.15rem, 3.4vw, 1.5rem)",
          fontWeight: 700,
          lineHeight: 1.05,
          color: valueColor,
          fontVariantNumeric: "tabular-nums",
          whiteSpace: "nowrap",
        }}
      >
        {fmtDollars(value)}
        <span style={{ fontSize: "0.6em", fontWeight: 500, color: "var(--color-text-muted)" }}>
          /yr
        </span>
      </p>
      <p style={metricNote}>{note ?? ""}</p>
    </div>
  );
}

const labelRow: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--type-subheading)",
  fontWeight: 600,
  color: "var(--color-text-secondary)",
};

const perYr: React.CSSProperties = {
  fontSize: "0.3em",
  fontWeight: 600,
  letterSpacing: 0,
  color: "var(--color-text-muted)",
  marginLeft: "0.15em",
};

const subNote: React.CSSProperties = {
  margin: "6px 0 0",
  fontSize: "var(--type-caption)",
  color: "var(--color-text-muted)",
  fontVariantNumeric: "tabular-nums",
};

const metricLabel: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--type-caption)",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  color: "var(--color-text-muted)",
  lineHeight: 1.1,
};

const metricNote: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--type-caption)",
  color: "var(--color-text-muted)",
  lineHeight: 1.2,
  minHeight: "1em",
};
