/**
 * /methodology — CliffCheck's citation moat.
 *
 * Every dollar the calculator shows traces to a named government source; this
 * page proves it. It is the inbound-link target for press/policy and a skeptic's
 * "is this made up?" check, so the register is a knowledgeable friend who tells
 * you straight — NOT a government form (dense tables, official blue, legalese are
 * the explicit anti-reference in PRODUCT.md).
 *
 * Server component: zero user data, zero client JS. Everything renders from the
 * provenance layer in @/lib/engine (task-113) — PROGRAM_PROVENANCE (federal),
 * STATE_PROGRAM_PROVENANCE + collectSources (state-specific). No gov URL, dollar
 * value, or retrieved date is hand-typed here; a grep-clean of hardcoded gov
 * URLs/values is an acceptance criterion.
 *
 * Information architecture (the load-bearing call): the federal sources —
 * SNAP, Medicaid, ACA, EITC, poverty guidelines, Section 8 — are IDENTICAL
 * across all supported states, so they are shown ONCE. Only what actually varies
 * by state (the childcare subsidy, the state income tax, Medicaid expansion
 * status) is repeated per state. Showing the federal set once instead of 7×
 * turns a 40-row wall of repetition (a government form) into a scannable
 * reference.
 *
 * Design canon applied (see the pre-build design-critique verdict):
 *  1. The promise is the dominant hero (display claim + an engine-derived
 *     proof-stat rail), the single squint-test focal point above the fold.
 *  2. Per-card typographic hierarchy: program name dominates; source, citation,
 *     and retrieved date are muted supporting text; the gov link is the only
 *     accent.
 *  3. One surface level in the state section — a plain state heading over a group
 *     of program rows, never a card nested inside a per-state card.
 *  4. No signal green/red and no "verified" checkmarks (green/red carry
 *     cliff/safe meaning product-wide; a citations page has neither). The link
 *     accent is amber + ↗ only, matching the calculator's SourceChip.
 *  5. No em-dashes in authored strings. The two source-less `note` strings come
 *     straight from the engine data and are rendered verbatim (data is out of
 *     scope) even though they contain em-dashes.
 *  6. No monospace: URLs render as normal link text, dates as tabular-nums sans.
 */
import type { Metadata } from "next";
import {
  PROGRAM_PROVENANCE,
  STATE_PROGRAM_PROVENANCE,
  collectSources,
  getSupportedStates,
  isGovSource,
  type Provenance,
  type Source,
} from "@/lib/engine";

export const metadata: Metadata = {
  // title.template in app/layout suffixes " · CliffCheck".
  title: "How CliffCheck knows the numbers",
  description:
    "Every dollar CliffCheck shows traces to a named government source: SNAP, Medicaid, ACA, EITC, HUD, and each state's childcare and income-tax rules. See the source, the citation, the government link, and the date we checked it.",
  alternates: { canonical: "/methodology" },
};

/* ── Editorial layer ──────────────────────────────────────────────────────────
   The provenance FACTS (source name, url, citation, retrieved date, note) all
   come from the engine. The two things authored here are (a) the human-readable
   jargon expansions the brief requires on first use, and (b) a one-line
   plain-English "what it is" so a non-expert reader knows what each program
   means. Neither is source data; both are copy. No dollar values, no URLs. */

/** Federal program keys in the order they should read (importance + familiarity). */
const FEDERAL_ORDER = [
  "snap",
  "medicaid",
  "aca",
  "eitc",
  "ctc",
  "fica",
  "fedIncomeTax",
  "fpl",
  "housing",
] as const;

/** Human name + plain-English gloss for each federal program (copy, not data). */
const FEDERAL_COPY: Record<
  string,
  { name: string; plain: string }
> = {
  snap: {
    name: "SNAP (food assistance)",
    plain:
      "Food benefits, once called food stamps. Most supported states use broad-based categorical eligibility, or BBCE, which raises the income limit above the federal default.",
  },
  medicaid: {
    name: "Medicaid",
    plain:
      "Public health coverage. Whether a state expanded Medicaid changes who qualifies, so the expansion status is listed per state below.",
  },
  aca: {
    name: "ACA marketplace savings",
    plain:
      "Premium savings on the Affordable Care Act (ACA) marketplace, measured against the second-lowest-cost Silver plan, the SLCSP, the benchmark the savings are calculated from.",
  },
  eitc: {
    name: "Earned Income Tax Credit (EITC)",
    plain:
      "A refundable tax credit for working households. It rises with earnings, then tapers, and is part of your effective take-home.",
  },
  ctc: {
    name: "Child Tax Credit (CTC)",
    plain:
      "A federal tax credit of up to $2,000 per child. Part of it wipes out federal income tax you owe; up to $1,700 per child can come back as a refund even when you owe little tax.",
  },
  fica: {
    name: "FICA (Social Security and Medicare tax)",
    plain:
      "The payroll tax on every paycheck: 6.2% for Social Security plus 1.45% for Medicare. We subtract it from your number, so what you see matches what a payslip shows.",
  },
  fedIncomeTax: {
    name: "Federal income tax",
    plain:
      "Federal tax on your wages after the standard deduction, using the current IRS brackets for your household type. Subtracted from your number, with the EITC and CTC counted against it so nothing is double counted.",
  },
  fpl: {
    name: "Federal poverty guidelines (FPL)",
    plain:
      "The federal poverty level, or FPL, is the yearly income figure most program limits are measured against. It scales every calculation on the site.",
  },
  housing: {
    name: "Section 8 housing (Housing Choice Voucher)",
    plain:
      "Rental assistance through the Housing Choice Voucher program, valued from HUD's local fair market rents.",
  },
};

/** Plain-English label for the two state-specific program keys (copy, not data). */
const STATE_PROGRAM_COPY: Record<string, string> = {
  childcare: "Childcare subsidy",
  incomeTax: "State income tax",
};

/* ── Derived counts for the hero proof-stat (all from the engine) ──────────── */

/** A state program enriched with the two fields collectSources drops but the
 *  page needs: the human source NAME and the source-less `note`. Both are read
 *  back from STATE_PROGRAM_PROVENANCE at build time, keyed by (state, program),
 *  so a source-less program renders its real explanation verbatim. */
type StateProgram = Source & {
  sourceName?: string;
  note?: string;
};

type StateEntry = {
  code: string;
  label: string;
  /** Only the programs that vary by state: childcare + income tax. */
  specific: StateProgram[];
  /** Medicaid expansion status, read off the engine's own label. */
  medicaidStatus: string | null;
};

/** Read Medicaid expansion status out of the engine-built label, e.g.
 *  "Medicaid (expansion)" → "expansion". Returns null if not present. */
function medicaidStatusFrom(sources: Source[]): string | null {
  const m = sources.find((s) => s.program === "medicaid");
  if (!m) return null;
  const match = m.label.match(/\(([^)]+)\)/);
  return match ? match[1] : null;
}

function buildStateEntries(): StateEntry[] {
  return getSupportedStates().map(({ code, label }) => {
    const all = collectSources(code);
    const specific: StateProgram[] = all
      .filter((s) => s.program === "childcare" || s.program === "incomeTax")
      .map((s) => {
        // Read the source NAME and the source-less `note` back from the
        // provenance map for THIS (state, program) — collectSources carries
        // neither. The note is rendered verbatim (it contains an em-dash by
        // design; the engine data is out of scope for rewriting).
        const prov = STATE_PROGRAM_PROVENANCE[code]?.[s.program];
        return {
          ...s,
          sourceName: prov?.source,
          note: s.url ? undefined : prov?.note,
        };
      });
    return {
      code,
      label,
      specific,
      medicaidStatus: medicaidStatusFrom(all),
    };
  });
}

/** Count every distinct rendered program + how many carry a live .gov link, so
 *  the hero stat and the honest-gap line are both derived, never asserted. */
function computeStats(federal: Provenance[], states: StateEntry[]) {
  const stateSpecificCount = states.reduce(
    (n, s) => n + s.specific.length,
    0
  );
  const totalPrograms = federal.length + stateSpecificCount;

  const federalLive = federal.filter(
    (p) => p.url && isGovSource(p.url)
  ).length;
  const stateLive = states.reduce(
    (n, s) => n + s.specific.filter((x) => x.url && isGovSource(x.url)).length,
    0
  );
  const liveGovLinks = federalLive + stateLive;

  return {
    totalPrograms,
    liveGovLinks,
    withNote: totalPrograms - liveGovLinks,
    stateCount: states.length,
  };
}

/* ── Small presentational helpers ─────────────────────────────────────────── */

/** Human-readable retrieved date, e.g. "2026-04-25" → "25 Apr 2026". Kept as a
 *  plain sans string (tabular-nums), never monospace. Falls back to the raw
 *  string if it is not an ISO date. */
function fmtRetrieved(iso: string | undefined): string | null {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** The single accent on the page: a gov source link, matching SourceChip's ↗. */
function GovLink({ url }: { url: string }) {
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    host = url;
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        minHeight: 32,
        alignSelf: "flex-start",
        color: "var(--color-cta-hover-amber)",
        fontSize: "var(--type-caption)",
        fontWeight: 600,
        textDecoration: "none",
        wordBreak: "break-word",
      }}
    >
      {host}
      <span aria-hidden="true">↗</span>
    </a>
  );
}

/** A calm "no gov link yet" tag for a source-less program. Stone, not red: this
 *  is rigor (we will not fake a citation), not an error. */
function NoLinkTag() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        minHeight: 24,
        padding: "2px 10px",
        borderRadius: "999px",
        border: "1px solid var(--color-border-stone)",
        backgroundColor: "var(--color-trust-surface)",
        color: "var(--color-text-muted)",
        fontSize: "var(--type-caption)",
        fontWeight: 600,
      }}
    >
      No gov link yet
    </span>
  );
}

/** The provenance detail shared by every program row: source, citation,
 *  retrieved date, and either the gov link or the source-less note. Program
 *  name is rendered by the caller (it owns the heading level), so this is the
 *  muted supporting layer. */
function ProvenanceDetail({
  source,
  citation,
  url,
  retrieved,
  note,
}: {
  source?: string;
  citation?: string;
  url?: string;
  retrieved?: string;
  note?: string;
}) {
  const retrievedLabel = fmtRetrieved(retrieved);
  return (
    <>
      {source && (
        <p
          style={{
            margin: 0,
            fontSize: "var(--type-subheading)",
            fontWeight: 600,
            color: "var(--color-text-secondary)",
          }}
        >
          {source}
        </p>
      )}
      {citation && (
        <p
          style={{
            margin: 0,
            fontSize: "var(--type-caption)",
            lineHeight: 1.5,
            color: "var(--color-text-muted)",
          }}
        >
          {citation}
        </p>
      )}

      {url ? (
        <GovLink url={url} />
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-xs)",
            padding: "var(--space-sm)",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--color-trust-surface)",
            border: "1px solid var(--color-border-stone)",
          }}
        >
          <NoLinkTag />
          {note && (
            <p
              style={{
                margin: 0,
                fontSize: "var(--type-caption)",
                lineHeight: 1.5,
                color: "var(--color-text-secondary)",
              }}
            >
              {note}
            </p>
          )}
        </div>
      )}

      {retrievedLabel && (
        <p
          className="tabular-nums"
          style={{
            margin: 0,
            fontSize: "var(--type-caption)",
            color: "var(--color-text-muted)",
          }}
        >
          Checked {retrievedLabel}
        </p>
      )}
    </>
  );
}

/** One federal program card. Program name is the scan target (heading); the
 *  plain-English gloss sits under it; provenance is the muted supporting layer. */
function FederalCard({
  programKey,
  prov,
}: {
  programKey: string;
  prov: Provenance;
}) {
  const copy = FEDERAL_COPY[programKey];
  return (
    <article
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-sm)",
        padding: "var(--space-lg)",
        backgroundColor: "var(--color-surface-white)",
        border: "1px solid var(--color-border-stone)",
        borderRadius: "var(--radius-lg)",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <h3
          style={{
            margin: 0,
            fontSize: "var(--type-heading)",
            fontWeight: 700,
            lineHeight: 1.3,
            color: "var(--color-text-primary)",
          }}
        >
          {copy?.name ?? programKey}
        </h3>
        {copy?.plain && (
          <p
            style={{
              margin: 0,
              fontSize: "var(--type-body)",
              lineHeight: 1.6,
              color: "var(--color-text-secondary)",
            }}
          >
            {copy.plain}
          </p>
        )}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-xs)",
          paddingTop: "var(--space-sm)",
          borderTop: "1px solid var(--color-border-stone)",
        }}
      >
        <ProvenanceDetail
          source={prov.source}
          citation={prov.citation}
          url={prov.url}
          retrieved={prov.retrieved}
          note={prov.note}
        />
      </div>
    </article>
  );
}

/** One state-specific program row. Single surface level: this is a row on the
 *  page background (no card), grouped under a plain state heading, so the state
 *  section never nests a card inside a card. */
function StateProgramRow({ program }: { program: StateProgram }) {
  // The engine specialises the label (e.g. "Childcare subsidy (PFCC)"); keep
  // that, falling back to the plain copy label.
  const name =
    program.label && program.label.length > 0
      ? program.label
      : STATE_PROGRAM_COPY[program.program] ?? program.program;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-xs)",
        paddingTop: "var(--space-md)",
        borderTop: "1px solid var(--color-border-stone)",
      }}
    >
      <h4
        style={{
          margin: 0,
          fontSize: "var(--type-subheading)",
          fontWeight: 700,
          color: "var(--color-text-primary)",
        }}
      >
        {name}
      </h4>
      <ProvenanceDetail
        source={program.sourceName}
        citation={program.citation}
        url={program.url}
        retrieved={program.retrieved}
        note={program.note}
      />
    </div>
  );
}

export default function MethodologyPage() {
  const federal: Array<{ key: string; prov: Provenance }> = FEDERAL_ORDER.map(
    (key) => ({ key, prov: PROGRAM_PROVENANCE[key] })
  ).filter((f) => f.prov);

  const states = buildStateEntries();
  const stats = computeStats(
    federal.map((f) => f.prov),
    states
  );

  return (
    <div
      style={{
        maxWidth: 820,
        margin: "0 auto",
        padding: "var(--space-xl) var(--space-md) var(--space-xxl)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-xxl)",
      }}
    >
      {/* ── HERO: the promise is the single dominant element ──────────────── */}
      <header
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-lg)",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "var(--type-subheading)",
            fontWeight: 600,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
            color: "var(--color-text-muted)",
          }}
        >
          Methodology
        </p>
        <h1
          style={{
            margin: 0,
            fontSize: "var(--type-display)",
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            color: "var(--color-text-primary)",
          }}
        >
          Every number here comes from a government source.
        </h1>
        <p
          style={{
            margin: 0,
            maxWidth: "60ch",
            fontSize: "var(--type-body)",
            lineHeight: 1.6,
            color: "var(--color-text-secondary)",
          }}
        >
          CliffCheck doesn&rsquo;t guess. Behind every dollar on the chart is a
          published rule from a federal agency or your state. Here is each one,
          with the source, the citation, a link to the government page, and the
          date we last checked it. If a rule doesn&rsquo;t trace to a government
          link yet, we say so plainly rather than paper over it.
        </p>

        {/* Engine-derived proof-stat rail: two-layer metric pattern, value
            over label, value dominant. Numbers are all computed above. */}
        <dl
          style={{
            margin: 0,
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "var(--space-md)",
            paddingTop: "var(--space-lg)",
            borderTop: "1px solid var(--color-border-stone)",
          }}
        >
          <Stat value={stats.totalPrograms} label="programs modelled" />
          <Stat value={stats.stateCount} label="states covered" />
          <Stat value={stats.liveGovLinks} label="live .gov links" />
        </dl>
      </header>

      {/* ── FEDERAL: shown once, shared by every state ────────────────────── */}
      <section
        aria-labelledby="federal-heading"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-lg)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <h2
            id="federal-heading"
            style={{
              margin: 0,
              fontSize: "var(--type-heading)",
              fontWeight: 700,
              color: "var(--color-text-primary)",
            }}
          >
            Federal rules, the same in every state
          </h2>
          <p
            style={{
              margin: 0,
              maxWidth: "62ch",
              fontSize: "var(--type-body)",
              lineHeight: 1.6,
              color: "var(--color-text-secondary)",
            }}
          >
            These programs run on national rules, so the source is the same
            wherever you live. We list them once here instead of repeating them
            for all {stats.stateCount} states.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
            gap: "var(--space-md)",
          }}
        >
          {federal.map(({ key, prov }) => (
            <FederalCard key={key} programKey={key} prov={prov} />
          ))}
        </div>
      </section>

      {/* ── STATE-SPECIFIC: only what changes by state ────────────────────── */}
      <section
        aria-labelledby="state-heading"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-lg)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <h2
            id="state-heading"
            style={{
              margin: 0,
              fontSize: "var(--type-heading)",
              fontWeight: 700,
              color: "var(--color-text-primary)",
            }}
          >
            What changes by state
          </h2>
          <p
            style={{
              margin: 0,
              maxWidth: "62ch",
              fontSize: "var(--type-body)",
              lineHeight: 1.6,
              color: "var(--color-text-secondary)",
            }}
          >
            Two things differ from state to state: the childcare subsidy and the
            state income tax. Whether the state expanded Medicaid is noted too,
            since it changes who qualifies. Everything else uses the federal
            rules above.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
            gap: "var(--space-md)",
          }}
        >
          {states.map((s) => (
            <StateGroup key={s.code} entry={s} />
          ))}
        </div>
      </section>

      {/* ── MODELLING ASSUMPTIONS: prose ──────────────────────────────────── */}
      <section
        aria-labelledby="assumptions-heading"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-md)",
        }}
      >
        <h2
          id="assumptions-heading"
          style={{
            margin: 0,
            fontSize: "var(--type-heading)",
            fontWeight: 700,
            color: "var(--color-text-primary)",
          }}
        >
          How we turn these rules into your number
        </h2>

        <Assumption title="Federal rules are uniform; two things are local.">
          SNAP, Medicaid coverage rules, ACA marketplace savings, the Earned
          Income Tax Credit, the Child Tax Credit, FICA, federal income tax,
          the poverty guidelines, and Section 8 all run on national rules, so
          they read the same in every state. The childcare subsidy and the
          state income tax are set by each state, so those are the two we list
          per state. Whether a state expanded Medicaid also shifts who
          qualifies, so we track that alongside them.
        </Assumption>

        <Assumption title="Your number is after all taxes.">
          The take-home figure subtracts FICA (Social Security and Medicare),
          federal income tax, and state income tax before adding the benefits
          you qualify for. The EITC and Child Tax Credit are counted against
          federal tax the way the IRS applies them, so a credit never gets
          added on top of tax it already erased. What you see is what your
          household actually keeps: pay plus benefits, after every tax.
        </Assumption>

        <Assumption title="Benefits taper smoothly, not all at once.">
          A benefit rarely switches off the moment you cross a line. Most fall
          away gradually as income rises, so the chart models each one as a
          continuous slope rather than a single on/off step. That is what lets
          the cliff show up where the combined drop actually bites, instead of
          at one artificial line.
        </Assumption>

        <Assumption title="Where a government link doesn't exist yet, we show a note.">
          Two rules are transcribed from sources that aren&rsquo;t on a
          government (.gov) site: Ohio&rsquo;s flat income tax, which we read
          from independent policy analyses, and Florida&rsquo;s childcare
          program, documented on a .org site rather than .gov. In both cases the
          number is still in the model and disclosed above, but we mark it &ldquo;no
          gov link yet&rdquo; rather than invent one. When a government page
          becomes available, it replaces the note.
        </Assumption>
      </section>

      {/* ── COLOPHON: one quiet PAPI line, no plum, no CTA ────────────────── */}
      <footer
        style={{
          paddingTop: "var(--space-lg)",
          borderTop: "1px solid var(--color-border-stone)",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "var(--type-caption)",
            lineHeight: 1.6,
            color: "var(--color-text-muted)",
          }}
        >
          Planned, built, and reviewed with{" "}
          <a
            href="https://getpapi.ai"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "var(--color-text-secondary)",
              textDecoration: "underline",
              textUnderlineOffset: "2px",
            }}
          >
            PAPI
          </a>
          . The process is as verifiable as the numbers.
        </p>
      </footer>
    </div>
  );
}

/** Two-layer proof stat: big tabular value over a muted label. */
function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      <dd
        className="tabular-nums"
        style={{
          margin: 0,
          fontSize: "clamp(1.75rem, 6vw, 2.25rem)",
          fontWeight: 800,
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          color: "var(--color-text-primary)",
        }}
      >
        {value}
      </dd>
      <dt
        style={{
          fontSize: "var(--type-caption)",
          color: "var(--color-text-muted)",
        }}
      >
        {label}
      </dt>
    </div>
  );
}

/** A state's group: a plain heading (with a deep-link anchor for press) over its
 *  program rows, all on the page background. Single surface level — no card
 *  inside a card. The whole group sits in one surface-white panel; its rows are
 *  dividers, not nested cards. */
function StateGroup({ entry }: { entry: StateEntry }) {
  const anchor = entry.label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <section
      id={anchor}
      aria-label={`${entry.label} sources`}
      style={{
        scrollMarginTop: "72px",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-sm)",
        padding: "var(--space-lg)",
        backgroundColor: "var(--color-surface-white)",
        border: "1px solid var(--color-border-stone)",
        borderRadius: "var(--radius-lg)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: "var(--space-sm)",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "var(--type-heading)",
            fontWeight: 700,
            color: "var(--color-text-primary)",
          }}
        >
          {entry.label}
        </h3>
        {entry.medicaidStatus && (
          <span
            style={{
              fontSize: "var(--type-caption)",
              color: "var(--color-text-muted)",
            }}
          >
            Medicaid: {entry.medicaidStatus}
          </span>
        )}
      </div>

      {entry.specific.length === 0 ? (
        <p
          style={{
            margin: 0,
            fontSize: "var(--type-caption)",
            color: "var(--color-text-muted)",
          }}
        >
          Uses the federal rules above, with no separate state childcare or
          income-tax rule modelled.
        </p>
      ) : (
        entry.specific.map((prog) => (
          <StateProgramRow key={prog.program} program={prog} />
        ))
      )}
    </section>
  );
}

/** One modelling-assumption block: bold lead sentence, prose under it. */
function Assumption({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <h3
        style={{
          margin: 0,
          fontSize: "var(--type-subheading)",
          fontWeight: 700,
          color: "var(--color-text-primary)",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          margin: 0,
          maxWidth: "68ch",
          fontSize: "var(--type-body)",
          lineHeight: 1.6,
          color: "var(--color-text-secondary)",
        }}
      >
        {children}
      </p>
    </div>
  );
}
