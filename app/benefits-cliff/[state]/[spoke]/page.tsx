/**
 * /benefits-cliff/[state]/[program] — Template B, the PROGRAM SPOKE.
 *
 * The densest long-tail vein: one page per (state × applicable program), where
 * "applicable" means the engine shows that program genuinely falling off for that
 * state (the anti-thin gate in lib/seo/states). generateStaticParams returns the
 * cartesian product post-filter, so hollow combos (e.g. EITC, which only tapers)
 * never mint a page, and a new states/XX.ts file grows the set automatically.
 *
 * Targets the verbatim query, "how much can I earn before I lose SNAP in Texas",
 * "Texas Medicaid income limit family of 4". Every dollar/threshold/date is
 * engine-derived at build time. Copy stays inside PRODUCT.md approved words; no
 * banned jargon; no em-dashes in authored strings. Warm stone/amber, one dominant
 * loss number, calm register (the /methodology sibling). The only motion is the
 * reused CliffChart client island.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CliffChart } from "@/components/calculator/CliffChart";
import { fmtDollars } from "@/components/calculator/derive";
import { SourceChips, ConfidenceBadge } from "@/components/calculator/SourceChip";
import { AnswerBlock, type AnswerSpan } from "@/components/seo/AnswerBlock";
import { CliffFAQ } from "@/components/seo/CliffFAQ";
import {
  jsonLdGraph,
  serializeJsonLd,
  webApplicationLd,
  organizationLd,
  articleLd,
  faqLd,
  breadcrumbLd,
  type FaqEntry,
} from "@/lib/seo/jsonld";
import {
  allSpokeParams,
  resolveSpoke,
  buildSpokeModel,
  applicablePrograms,
  CANON_FAMILY_LABEL,
  type SpokeModel,
  type SeoState,
  type ProgramDef,
} from "@/lib/seo/states";
import {
  allHouseholdParams,
  resolveHousehold,
  buildHouseholdModel,
  otherHouseholds,
  buildHouseholdAnswer,
  buildHouseholdFaq,
  type HouseholdModel,
  type HouseholdArchetype,
} from "@/lib/seo/households";

/** SSG: the second segment is a SPOKE, either a program (states.ts, anti-thin
 *  filtered) OR a household archetype (households.ts, anti-thin filtered). Both
 *  live under one dynamic segment because Next.js forbids two differently-named
 *  dynamic siblings; program and household slugs never collide. */
export function generateStaticParams() {
  return [
    ...allSpokeParams().map(({ state, program }) => ({ state, spoke: program })),
    ...allHouseholdParams().map(({ state, household }) => ({ state, spoke: household })),
  ];
}

type RouteParams = { state: string; spoke: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { state: stateSlug, spoke: spokeSlug } = await params;

  const program = resolveSpoke(stateSlug, spokeSlug);
  if (program) {
    const model = buildSpokeModel(program.state, program.program);
    const path = `/benefits-cliff/${program.state.slug}/${program.program.slug}`;
    const title = `${program.program.shortName} cliff in ${program.state.label}`;
    const endsPart = model.endsAtIncome
      ? `falls away around ${fmtDollars(model.endsAtIncome)}`
      : `can drop as your pay rises`;
    const description =
      `${program.program.shortName} in ${program.state.label} ${endsPart} for a ` +
      `${CANON_FAMILY_LABEL}, a drop of up to ${fmtDollars(model.worstDrop)}. See ` +
      `the cliff and your safe exit. Free, private.`;
    return spokeMetadata(title, description, path);
  }

  const household = resolveHousehold(stateSlug, spokeSlug);
  if (household) {
    const model = buildHouseholdModel(household.state, household.household);
    const path = `/benefits-cliff/${household.state.slug}/${household.household.slug}`;
    const title = `${household.household.shortLabel} benefits cliff in ${household.state.label}`;
    const description =
      `A ${household.household.label} in ${household.state.label} can lose up to ` +
      `${fmtDollars(model.worstDrop)} a year to a benefits cliff. See where the cliff ` +
      `lands, what causes it, and your safe exit. Free, private.`;
    return spokeMetadata(title, description, path);
  }

  return {};
}

/** Shared metadata shape for both spoke kinds. */
function spokeMetadata(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} · CliffCheck`,
      description,
      url: path,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · CliffCheck`,
      description,
    },
  };
}

export default async function SpokePage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { state: stateSlug, spoke: spokeSlug } = await params;

  const program = resolveSpoke(stateSlug, spokeSlug);
  if (program) return renderProgramSpoke(program.state, program.program);

  const household = resolveHousehold(stateSlug, spokeSlug);
  if (household) return renderHouseholdSpoke(household.state, household.household);

  notFound();
}

function renderProgramSpoke(state: SeoState, program: ProgramDef) {
  const model = buildSpokeModel(state, program);
  const hubPath = `/benefits-cliff/${state.slug}`;
  const path = `${hubPath}/${program.slug}`;
  const siblings = otherSpokes(state, program);

  const faqEntries = buildSpokeFaq(model);
  const crumbs = [
    { name: "CliffCheck", path: "/" },
    { name: `${state.label} benefits cliff`, path: hubPath },
    { name: program.shortName, path },
  ];
  const ld = jsonLdGraph(
    webApplicationLd(),
    organizationLd(),
    articleLd({
      headline: `${program.shortName} cliff in ${state.label}`,
      description:
        `Where ${program.name} falls away in ${state.label}, the take-home it ` +
        `takes with it, and the safe exit income that clears the cliff.`,
      path,
      dateModified: model.dateModified,
      image: `${hubPath}/opengraph-image`,
    }),
    breadcrumbLd(crumbs),
    faqLd(faqEntries)
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(ld) }}
      />
      <article
        style={{
          maxWidth: 820,
          margin: "0 auto",
          padding: "var(--space-lg) var(--space-md) var(--space-xxl)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-xl)",
        }}
      >
        {/* ── BREADCRUMB (quiet wayfinding, mirrors BreadcrumbList schema) ──── */}
        <nav aria-label="Breadcrumb">
          <ol
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "6px",
              fontSize: "var(--type-caption)",
              color: "var(--color-text-muted)",
            }}
          >
            {crumbs.map((c, i) => {
              const isLast = i === crumbs.length - 1;
              return (
                <li
                  key={c.path}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  {isLast ? (
                    <span style={{ color: "var(--color-text-secondary)", fontWeight: 600 }}>
                      {c.name}
                    </span>
                  ) : (
                    <>
                      <Link
                        href={c.path}
                        style={{
                          color: "var(--color-text-muted)",
                          textDecoration: "none",
                        }}
                      >
                        {c.name}
                      </Link>
                      <span aria-hidden>/</span>
                    </>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        {/* ── HERO: the loss this benefit drives is the dominant element ────── */}
        <header
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-md)",
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
            {state.label} &middot; {program.shortName}
          </p>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
              fontWeight: 800,
              lineHeight: 1.14,
              letterSpacing: "-0.02em",
              color: "var(--color-text-primary)",
              maxWidth: "20ch",
            }}
          >
            {heroQuestion(program, state)}
          </h1>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              paddingTop: "var(--space-xs)",
            }}
          >
            <span
              style={{
                fontSize: "var(--type-subheading)",
                fontWeight: 600,
                color: "var(--color-text-secondary)",
              }}
            >
              Losing {program.name} here can cost a {CANON_FAMILY_LABEL}
            </span>
            <span
              className="tabular-nums"
              style={{
                fontSize: "var(--type-display)",
                fontWeight: 800,
                lineHeight: 1.02,
                letterSpacing: "-0.03em",
                color: "var(--color-negative-delta)",
              }}
            >
              &minus;{fmtDollars(model.worstDrop)}
            </span>
            <span
              style={{
                fontSize: "var(--type-caption)",
                color: "var(--color-text-muted)",
              }}
            >
              in a single step, the year it falls away.
            </span>
          </div>

          <AnswerBlock spans={buildSpokeAnswer(model)} />
        </header>

        {/* ── PROGRAM FUEL: two-layer facts (engine-derived) ────────────────── */}
        <section
          aria-label={`${program.shortName} facts for ${state.label}`}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
            gap: "var(--space-md)",
            padding: "var(--space-lg)",
            backgroundColor: "var(--color-surface-white)",
            border: "1px solid var(--color-border-stone)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          {model.facts.map((f) => (
            <div
              key={f.label}
              style={{ display: "flex", flexDirection: "column", gap: "2px" }}
            >
              <span
                style={{
                  fontSize: "var(--type-caption)",
                  color: "var(--color-text-muted)",
                }}
              >
                {f.label}
              </span>
              <span
                className="tabular-nums"
                style={{
                  fontSize: "var(--type-heading)",
                  fontWeight: 700,
                  lineHeight: 1.25,
                  color: "var(--color-text-primary)",
                }}
              >
                {f.value}
              </span>
            </div>
          ))}
        </section>

        {/* ── THE CHART: reused client island, anchored to THIS program's drop ─ */}
        <CliffChart
          results={model.results}
          currentIncome={model.currentIncome}
          offeredIncome={model.offeredIncome}
          stateLabel={state.label}
          familySize={model.familySize}
        />

        {/* ── SOURCES + freshness + back to the hub ─────────────────────────── */}
        <section
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-sm)",
          }}
        >
          <SourceChips sources={model.sources} />
          <ConfidenceBadge sources={model.sources} />
        </section>

        {/* ── FAQ (feeds FAQPage schema) ────────────────────────────────────── */}
        <CliffFAQ entries={faqEntries} />

        {/* ── OTHER BENEFITS IN THIS STATE (onward links, ranked) ───────────── */}
        {siblings.length > 0 && (
          <section
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-sm)",
              paddingTop: "var(--space-lg)",
              borderTop: "1px solid var(--color-border-stone)",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "var(--type-subheading)",
                fontWeight: 700,
                color: "var(--color-text-primary)",
              }}
            >
              Other benefits in {state.label}
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {siblings.map((s) => (
                <Link
                  key={s.slug}
                  href={`/benefits-cliff/${state.slug}/${s.slug}`}
                  style={pillStyle}
                >
                  {s.shortName}
                </Link>
              ))}
              <Link href={hubPath} style={pillStyle}>
                All of {state.label}
              </Link>
            </div>
          </section>
        )}
      </article>
    </>
  );
}

/* ── HOUSEHOLD SCENARIO SPOKE (Template D) ──────────────────────────────────────
   Same page furniture as the program spoke, but the axis is the family shape: the
   dominant element is the FULL cliff this household hits in the state, not one
   program. Every dollar is engine-derived via buildHouseholdModel. */
function renderHouseholdSpoke(state: SeoState, household: HouseholdArchetype) {
  const model = buildHouseholdModel(state, household);
  const hubPath = `/benefits-cliff/${state.slug}`;
  const path = `${hubPath}/${household.slug}`;
  const siblings = otherHouseholds(state, household);
  const childCount = Math.max(0, model.familySize - model.adultCount);

  const facts: Array<{ label: string; value: string }> = [
    { label: "Household", value: `${model.adultCount} adult${model.adultCount === 1 ? "" : "s"}, ${childCount} child${childCount === 1 ? "" : "ren"}` },
    { label: "Cliff lands around", value: fmtDollars(model.currentIncome) },
    { label: "Safe exit income", value: model.safeExit ? fmtDollars(model.safeExit) : "Past the cliff" },
  ];

  const faqEntries = buildHouseholdFaq(model);
  const crumbs = [
    { name: "CliffCheck", path: "/" },
    { name: `${state.label} benefits cliff`, path: hubPath },
    { name: household.shortLabel, path },
  ];
  const ld = jsonLdGraph(
    webApplicationLd(),
    organizationLd(),
    articleLd({
      headline: `${household.shortLabel} benefits cliff in ${state.label}`,
      description:
        `The benefits cliff a ${household.label} hits in ${state.label}, the ` +
        `take-home it costs, and the safe exit income that clears it.`,
      path,
      dateModified: model.dateModified,
      image: `${hubPath}/opengraph-image`,
    }),
    breadcrumbLd(crumbs),
    faqLd(faqEntries)
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(ld) }}
      />
      <article
        style={{
          maxWidth: 820,
          margin: "0 auto",
          padding: "var(--space-lg) var(--space-md) var(--space-xxl)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-xl)",
        }}
      >
        <nav aria-label="Breadcrumb">
          <ol
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "6px",
              fontSize: "var(--type-caption)",
              color: "var(--color-text-muted)",
            }}
          >
            {crumbs.map((c, i) => {
              const isLast = i === crumbs.length - 1;
              return (
                <li key={c.path} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  {isLast ? (
                    <span style={{ color: "var(--color-text-secondary)", fontWeight: 600 }}>{c.name}</span>
                  ) : (
                    <>
                      <Link href={c.path} style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>
                        {c.name}
                      </Link>
                      <span aria-hidden>/</span>
                    </>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        <header style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
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
            {state.label} &middot; {household.shortLabel}
          </p>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
              fontWeight: 800,
              lineHeight: 1.14,
              letterSpacing: "-0.02em",
              color: "var(--color-text-primary)",
              maxWidth: "20ch",
            }}
          >
            The benefits cliff for a {household.label} in {state.label}
          </h1>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px", paddingTop: "var(--space-xs)" }}>
            <span style={{ fontSize: "var(--type-subheading)", fontWeight: 600, color: "var(--color-text-secondary)" }}>
              A raise on the cliff can cost this household
            </span>
            <span
              className="tabular-nums"
              style={{
                fontSize: "var(--type-display)",
                fontWeight: 800,
                lineHeight: 1.02,
                letterSpacing: "-0.03em",
                color: "var(--color-negative-delta)",
              }}
            >
              &minus;{fmtDollars(model.worstDrop)}
            </span>
            <span style={{ fontSize: "var(--type-caption)", color: "var(--color-text-muted)" }}>
              a year, mostly from {model.dominantCauseLabel}.
            </span>
          </div>

          <AnswerBlock spans={buildHouseholdAnswer(model)} />
        </header>

        <section
          aria-label={`${household.shortLabel} cliff facts for ${state.label}`}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
            gap: "var(--space-md)",
            padding: "var(--space-lg)",
            backgroundColor: "var(--color-surface-white)",
            border: "1px solid var(--color-border-stone)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          {facts.map((f) => (
            <div key={f.label} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ fontSize: "var(--type-caption)", color: "var(--color-text-muted)" }}>{f.label}</span>
              <span
                className="tabular-nums"
                style={{
                  fontSize: "var(--type-heading)",
                  fontWeight: 700,
                  lineHeight: 1.25,
                  color: "var(--color-text-primary)",
                }}
              >
                {f.value}
              </span>
            </div>
          ))}
        </section>

        <CliffChart
          results={model.results}
          currentIncome={model.currentIncome}
          offeredIncome={model.offeredIncome}
          stateLabel={state.label}
          familySize={model.familySize}
        />

        <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
          <SourceChips sources={model.sources} />
          <ConfidenceBadge sources={model.sources} />
        </section>

        <CliffFAQ entries={faqEntries} />

        {siblings.length > 0 && (
          <section
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-sm)",
              paddingTop: "var(--space-lg)",
              borderTop: "1px solid var(--color-border-stone)",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "var(--type-subheading)", fontWeight: 700, color: "var(--color-text-primary)" }}>
              Other households in {state.label}
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {siblings.map((s) => (
                <Link key={s.slug} href={`/benefits-cliff/${state.slug}/${s.slug}`} style={pillStyle}>
                  {s.shortLabel}
                </Link>
              ))}
              <Link href={hubPath} style={pillStyle}>
                All of {state.label}
              </Link>
            </div>
          </section>
        )}
      </article>
    </>
  );
}

const pillStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 40,
  padding: "0 16px",
  borderRadius: "999px",
  border: "1px solid var(--color-border-stone)",
  backgroundColor: "var(--color-surface-white)",
  color: "var(--color-text-primary)",
  fontSize: "var(--type-subheading)",
  fontWeight: 600,
  textDecoration: "none",
};

/** The other applicable spokes for this state (for onward links). */
function otherSpokes(state: SeoState, current: ProgramDef): ProgramDef[] {
  return applicablePrograms(state.code).filter((p) => p.slug !== current.slug);
}

/** The H1 question, phrased as the search query, per program (no jargon). */
function heroQuestion(program: ProgramDef, state: SeoState): string {
  switch (program.slug) {
    case "medicaid":
      return `How much can you earn before you lose Medicaid in ${state.label}?`;
    case "snap":
      return `How much can you earn before you lose SNAP in ${state.label}?`;
    case "childcare":
      return `How much can you earn before you lose childcare help in ${state.label}?`;
    case "housing":
      return `How much can you earn before you lose Section 8 in ${state.label}?`;
    default:
      return `How much can you earn before you lose ${program.name} in ${state.label}?`;
  }
}

/** The citable answer for a spoke (40-60 words), engine-derived. */
function buildSpokeAnswer(m: SpokeModel): AnswerSpan[] {
  const ends = m.endsAtIncome ? fmtDollars(m.endsAtIncome) : null;
  const spans: AnswerSpan[] = [
    { text: `In ${m.state.label}, ${m.program.name} for a ${CANON_FAMILY_LABEL} ` },
  ];
  if (ends) {
    spans.push({ text: `falls away around ` });
    spans.push({ text: ends });
    spans.push({ text: ` a year. Crossing that can cut real take-home by ` });
  } else {
    spans.push({ text: `can drop as pay rises, cutting real take-home by ` });
  }
  spans.push({ text: `${fmtDollars(m.worstDrop)}`, emphasis: "loss" });
  spans.push({
    text: ` in one step, so a small raise can leave the household behind until pay climbs well past it.`,
  });
  return spans;
}

/** Spoke FAQ, question-phrased as the query. All dollars from the model. */
function buildSpokeFaq(m: SpokeModel): FaqEntry[] {
  const ends = m.endsAtIncome ? fmtDollars(m.endsAtIncome) : null;
  const entries: FaqEntry[] = [];

  entries.push({
    question: `How much can you earn before you lose ${m.program.name} in ${m.state.label}?`,
    answer: ends
      ? `For a ${CANON_FAMILY_LABEL} in ${m.state.label}, ${m.program.name} ` +
        `falls away around ${ends} a year. The exact point depends on your ` +
        `household, so check your own number, but that is where the drop hits ` +
        `for a typical ${CANON_FAMILY_LABEL}.`
      : `For a ${CANON_FAMILY_LABEL} in ${m.state.label}, ${m.program.name} ` +
        `tapers as your pay rises. Check your own number to see the exact point ` +
        `for your household.`,
  });

  if (m.program.slug === "medicaid") {
    entries.push({
      question: `Did ${m.state.label} expand Medicaid?`,
      answer: m.medicaidExpanded
        ? `Yes. ${m.state.label} expanded Medicaid, so adults keep coverage up to ` +
          `a higher income before it ends. That single clean edge is where the ` +
          `coverage cliff lands.`
        : `No. ${m.state.label} did not expand Medicaid, so adult coverage ends ` +
          `at a very low income, far sooner than most people expect. Above that, ` +
          `adults move to the marketplace and health costs jump.`,
    });
  }
  if (m.program.slug === "childcare") {
    entries.push({
      question: `What is the ${m.state.label} childcare subsidy called?`,
      answer:
        `${m.state.label}'s childcare help is called ${m.childcareSubsidyName}. ` +
        `It is one of the steepest cliffs, because the whole subsidy can fall away ` +
        `in a single income step, taking a large amount of take-home with it.`,
    });
  }
  if (m.program.slug === "snap") {
    entries.push({
      question: `Does SNAP count my pay before or after tax in ${m.state.label}?`,
      answer:
        `SNAP looks at your gross pay, the amount before tax, not your take-home. ` +
        `That is why a raise can push you over the line even though your ` +
        `after-tax pay barely moved.`,
    });
  }

  entries.push({
    question: `What income clears the cliff in ${m.state.label}?`,
    answer: m.results.safeExit
      ? `For a ${CANON_FAMILY_LABEL} in ${m.state.label}, real take-home passes ` +
        `its earlier level again at about ${fmtDollars(m.results.safeExit)} a ` +
        `year. Earn past that safe exit and the raise pays off for good.`
      : `Once you are well past where the benefits fall away, more pay adds to ` +
        `take-home again. Check your own number to see your safe exit income.`,
  });

  return entries;
}
