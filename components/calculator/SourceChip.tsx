"use client";

/**
 * SourceChips — quiet provenance captions beside the benefit math (DESIGN.md
 * "Source chips", DESIGN-DIRECTION.md §13). Minimal this cycle: each chip names a
 * program + its government source from getStateSources, linking out where a URL
 * exists. The differentiator is calm credibility — "every number comes from a
 * gov source" — so the chips are muted, never loud.
 */
import Link from "next/link";
import type { Source } from "@/lib/engine";

/**
 * Short human date ("6 Jul 2026") from the latest source `retrieved` date across
 * a state's sources. Kept local so this client component stays dependency-free
 * (imports only the Source type), mirroring lib/seo/states.ts freshnessLabel —
 * the same rationale states.ts gives for its own local fmtMoney.
 */
function freshnessFromSources(sources: Source[]): string | null {
  const dates = sources
    .map((s) => s.retrieved)
    .filter((d): d is string => !!d)
    .sort();
  if (dates.length === 0) return null;
  const d = new Date(`${dates[dates.length - 1]}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * ConfidenceBadge — the per-state data-confidence signal (task-161). Turns the
 * accuracy caveat into a credibility signal rather than buried fine print: a
 * quiet "verified" pill with the real capture date, plus an honest note that
 * SLCSP and childcare figures are documented approximations. Everything is
 * derived from `sources` (registry/provenance-driven via getStateSources), so a
 * future state auto-populates with zero page-code changes. Renders nothing when
 * a state has no sources (unsupported / not yet filled).
 */
export function ConfidenceBadge({ sources }: { sources: Source[] }) {
  if (sources.length === 0) return null;
  const checked = freshnessFromSources(sources);

  return (
    <section
      aria-label="Data confidence"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-xs)",
      }}
    >
      {checked && (
        <span
          className="tabular-nums"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            alignSelf: "flex-start",
            minHeight: 30,
            padding: "4px 12px",
            fontSize: "var(--type-caption)",
            fontWeight: 600,
            color: "var(--color-safe-green)",
            backgroundColor: "var(--color-safe-exit-bg)",
            border: "1px solid var(--color-safe-border-soft)",
            borderRadius: "999px",
          }}
        >
          <span
            aria-hidden
            style={{
              width: 7,
              height: 7,
              borderRadius: "999px",
              backgroundColor: "var(--color-safe-green)",
            }}
          />
          Data checked {checked}
        </span>
      )}
      <p
        style={{
          margin: 0,
          fontSize: "var(--type-caption)",
          lineHeight: 1.5,
          color: "var(--color-text-muted)",
        }}
      >
        Each figure is drawn from the primary government source shown above. Two
        values are close approximations, not filing-grade quotes: the ACA
        benchmark (SLCSP) uses each state&rsquo;s largest metro as a stand-in, and
        childcare help varies by county — both land within roughly 10%.{" "}
        <Link
          href="/methodology"
          style={{
            color: "var(--color-cta-hover-amber)",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          See how CliffCheck knows the numbers
        </Link>
      </p>
    </section>
  );
}

export function SourceChips({ sources }: { sources: Source[] }) {
  if (sources.length === 0) return null;

  return (
    <section
      aria-label="Data sources"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-xs)",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: "var(--type-caption)",
          fontWeight: 600,
          color: "var(--color-text-muted)",
        }}
      >
        Every number comes from a government source
      </p>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        {sources.map((s) => (
          <Chip key={s.program} source={s} />
        ))}
      </div>
    </section>
  );
}

function Chip({ source }: { source: Source }) {
  const content = (
    <>
      {source.label}
      {source.url && (
        <span aria-hidden style={{ color: "var(--color-text-muted)" }}>
          {" ↗"}
        </span>
      )}
    </>
  );

  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 30,
    padding: "4px 12px",
    fontSize: "var(--type-caption)",
    fontWeight: 500,
    color: "var(--color-text-secondary)",
    backgroundColor: "var(--color-surface-white)",
    border: "1px solid var(--color-border-stone)",
    borderRadius: "999px",
    boxShadow: "var(--elevation-card)",
    textDecoration: "none",
  };

  if (source.url) {
    return (
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        style={base}
      >
        {content}
      </a>
    );
  }
  return <span style={base}>{content}</span>;
}
