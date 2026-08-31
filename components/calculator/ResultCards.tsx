"use client";

/**
 * BenefitBreakdown — the itemised detail behind the headline (DESIGN.md Cliff
 * Alert card, DESIGN-DIRECTION.md §13). The headline numbers (the cost, the safe
 * exit, today → after) live ONCE in the top answer band; this card never repeats
 * them. Its job is the itemisation: which benefits fall, and by how much per
 * month, so the loss is concrete and not just a single scary total.
 *
 * NEVER ships empty: when there's no cliff, a calm green line confirms the raise
 * genuinely improves total value (DESIGN.md fallback copy). No motion on numbers.
 */
import type { DerivedResults } from "./derive";
import { fmtMonthly } from "./derive";

export function ResultCards({ results }: { results: DerivedResults }) {
  const { diff, isWorse, breakdown } = results;

  // No cliff: a single tight reassurance line — never an empty surface.
  if (!isWorse) {
    return (
      <section
        aria-label="Benefit impact"
        style={{
          backgroundColor: "var(--color-safe-exit-bg)",
          border: "1.5px solid var(--color-safe-border-soft)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--elevation-card)",
          padding: "var(--space-md) var(--space-lg)",
        }}
      >
        <p style={{ margin: 0, ...headlineGreen }}>
          This raise leaves you better off. No cliff in your way.
        </p>
        <p style={bodyText}>
          Your benefits don&rsquo;t fall faster than the raise adds, so the offer
          is a real gain in total take-home.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label="Where the loss comes from"
      style={{
        backgroundColor: "var(--color-cliff-alert-bg)",
        border: "1.5px solid var(--color-cliff-border-soft)",
        borderRadius: "var(--radius-xl)",
        boxShadow: "var(--elevation-card)",
        padding: "var(--space-md) var(--space-lg)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: "var(--space-sm)",
          flexWrap: "wrap",
        }}
      >
        <h2 style={cardTitle}>Where the loss comes from</h2>
        <span style={{ ...bodyText, margin: 0, color: "var(--color-text-muted)" }}>
          Monthly change, offer vs today
        </span>
      </div>

      {breakdown.length > 0 ? (
        <ul style={list}>
          {breakdown.map((b) => {
            // A "loss" is a benefit falling (delta<0) or a cost rising (delta>0).
            const isLoss = b.isCost ? b.delta > 0 : b.delta < 0;
            const sign = b.delta < 0 ? "−" : "+";
            return (
              <li key={b.label} style={row}>
                <span style={{ fontWeight: 500, color: "var(--color-text-secondary)" }}>
                  {b.label}
                </span>
                <span
                  style={{
                    fontWeight: 700,
                    color: isLoss
                      ? "var(--color-negative-delta)"
                      : "var(--color-text-muted)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {sign}${Math.abs(b.delta).toLocaleString("en-US")}/mo
                </span>
              </li>
            );
          })}
          <li style={{ ...row, ...totalRow }}>
            <span style={{ fontWeight: 700, color: "var(--color-text-primary)" }}>
              Total hit
            </span>
            <span
              style={{
                fontWeight: 800,
                color: "var(--color-negative-delta)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              −{fmtMonthly(Math.abs(diff))}/mo
            </span>
          </li>
        </ul>
      ) : (
        <p style={bodyText}>
          Your benefits fade out across this income band, so the offer lands you
          behind on total take-home even though the wage is higher.
        </p>
      )}
    </section>
  );
}

const cardTitle: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--type-heading)",
  fontWeight: 700,
  color: "var(--color-text-primary)",
};

const list: React.CSSProperties = {
  margin: "var(--space-sm) 0 0",
  padding: 0,
  listStyle: "none",
  display: "flex",
  flexDirection: "column",
};

const row: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "var(--space-md)",
  padding: "8px 0",
  borderTop: "1px solid var(--color-cliff-border-soft)",
  fontSize: "var(--type-subheading)",
};

const totalRow: React.CSSProperties = {
  marginTop: 2,
  borderTop: "2px solid var(--color-cliff-border-soft)",
  paddingTop: 10,
};

const headlineGreen: React.CSSProperties = {
  fontSize: "var(--type-heading)",
  fontWeight: 700,
  color: "var(--color-positive-delta)",
};

const bodyText: React.CSSProperties = {
  margin: "var(--space-xs) 0 0",
  fontSize: "var(--type-body)",
  lineHeight: 1.55,
  color: "var(--color-text-secondary)",
};
