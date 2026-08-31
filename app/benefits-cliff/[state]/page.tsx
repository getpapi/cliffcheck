/**
 * /benefits-cliff/[state] — Template A, the STATE HUB (pillar page).
 *
 * One hub per supported state, generated statically from the engine registry
 * (generateStaticParams → every state in getSupportedStates()). Adding a
 * states/XX.ts file mints another hub with zero change here — the flywheel.
 *
 * Every dollar, threshold, and date on this page is ENGINE-DERIVED at build time
 * (getCliffData / getEffectiveTakeHome / deriveResults / getStateSources). Nothing
 * financial is hand-typed; a grep for hardcoded dollars or gov URLs comes up clean.
 *
 * Register = the /methodology page's: a knowledgeable friend who tells you
 * straight, warm stone/amber, one dominant Display loss number as the hero, then
 * a scannable body. Motion is calm — the only moving part is the reused CliffChart
 * client island (≤200ms redraw, reduced-motion aware). Copy stays inside
 * PRODUCT.md's approved words (cliff, raise, take-home, safe exit, benefits); no
 * banned jargon, no em-dashes in authored strings.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getStateSources } from "@/lib/engine";
import { CliffChart } from "@/components/calculator/CliffChart";
import { fmtDollars } from "@/components/calculator/derive";
import { SourceChips, ConfidenceBadge } from "@/components/calculator/SourceChip";
import { AnswerBlock } from "@/components/seo/AnswerBlock";
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
  allStateParams,
  stateFromSlug,
  applicablePrograms,
  neighbourStates,
  buildHubModel,
  CANON_FAMILY_LABEL,
  type HubModel,
  type EssentialPlanCliff,
} from "@/lib/seo/states";

/** SSG: one static page per supported state. */
export function generateStaticParams() {
  return allStateParams();
}

type RouteParams = { state: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { state: slug } = await params;
  const state = stateFromSlug(slug);
  if (!state) return {};
  const m = buildHubModel(state);
  const path = `/benefits-cliff/${state.slug}`;
  // Title ≤60 chars, description ≤160 and containing the real engine number.
  const title = `Benefits cliff in ${state.label}`;
  const description =
    `A ${fmtDollars(m.raise)} raise at ${fmtDollars(m.currentIncome)} in ` +
    `${state.label} can cost a ${CANON_FAMILY_LABEL} ${fmtDollars(m.loss)} in ` +
    `take-home. See the cliff and your safe exit. Free, private.`;
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

export default async function StateHubPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { state: slug } = await params;
  const state = stateFromSlug(slug);
  if (!state) notFound();

  const model = buildHubModel(state);
  const programs = applicablePrograms(state.code);
  const neighbours = neighbourStates(state.code);
  const sources = getStateSources(state.code);
  const path = `/benefits-cliff/${state.slug}`;

  const faqEntries = buildHubFaq(model);
  const ld = jsonLdGraph(
    webApplicationLd(),
    organizationLd(),
    articleLd({
      headline: `Benefits cliff in ${state.label}`,
      description:
        `Where a raise triggers a benefits cliff in ${state.label}, the ` +
        `real take-home loss, and the safe exit income that clears it.`,
      path,
      dateModified: model.dateModified,
      image: `${path}/opengraph-image`,
    }),
    breadcrumbLd([
      { name: "CliffCheck", path: "/" },
      { name: `${state.label} benefits cliff`, path },
    ]),
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
          maxWidth: 900,
          margin: "0 auto",
          padding: "var(--space-xl) var(--space-md) var(--space-xxl)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-xxl)",
        }}
      >
        {/* ── HERO: the loss number is the single dominant element ─────────── */}
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
            {state.label} benefits cliff
          </p>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(1.75rem, 4.5vw, 2.75rem)",
              fontWeight: 800,
              lineHeight: 1.12,
              letterSpacing: "-0.02em",
              color: "var(--color-text-primary)",
              maxWidth: "18ch",
            }}
          >
            How much can you earn before a raise costs you in {state.label}?
          </h1>

          {/* Two-layer hero stat: muted label above, giant loss number below. */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              paddingTop: "var(--space-sm)",
            }}
          >
            <span
              style={{
                fontSize: "var(--type-subheading)",
                fontWeight: 600,
                color: "var(--color-text-secondary)",
              }}
            >
              A {fmtDollars(model.raise)} raise at {fmtDollars(model.currentIncome)}{" "}
              can cost a {CANON_FAMILY_LABEL}
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
              &minus;{fmtDollars(model.loss)}
              <span
                style={{
                  fontSize: "clamp(1rem, 2.5vw, 1.5rem)",
                  fontWeight: 700,
                  color: "var(--color-text-muted)",
                  letterSpacing: 0,
                }}
              >
                /yr
              </span>
            </span>
            <span
              style={{
                fontSize: "var(--type-caption)",
                color: "var(--color-text-muted)",
              }}
            >
              in real take-home ({fmtDollars(Math.round(model.loss / 12))}/mo),
              mostly {model.dominantCauseLabel}.
            </span>
          </div>

          {/* AnswerBlock: subordinate, body-size, the citable 40-60 word answer. */}
          <AnswerBlock spans={model.answerSpans} />

          {/* Primary action: the free tool. Single CTA intent per view. */}
          <div>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                minHeight: 48,
                padding: "0 24px",
                borderRadius: "var(--radius-lg)",
                backgroundColor: "var(--color-brand-amber)",
                color: "var(--color-text-primary)",
                fontSize: "var(--type-subheading)",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Check your own number
              <span aria-hidden>&rarr;</span>
            </Link>
          </div>
        </header>

        {/* ── THE CHART: reused client island, fed engine-derived results ───── */}
        <section
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-sm)",
          }}
        >
          <CliffChart
            results={model.results}
            currentIncome={model.currentIncome}
            offeredIncome={model.offeredIncome}
            stateLabel={state.label}
            familySize={model.familySize}
          />
        </section>

        {/* ── SECOND (ESSENTIAL-PLAN) CLIFF — NY only, engine-gated ──────────── */}
        {model.essentialPlanCliff && (
          <EssentialPlanCallout
            cliff={model.essentialPlanCliff}
            stateLabel={state.label}
          />
        )}

        {/* ── EARNINGS vs BENEFIT-DROP TABLE ────────────────────────────────── */}
        <section
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-md)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <h2
              style={{
                margin: 0,
                fontSize: "var(--type-heading)",
                fontWeight: 700,
                color: "var(--color-text-primary)",
              }}
            >
              What you can earn before each benefit drops
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
              For a {CANON_FAMILY_LABEL} in {state.label}. Each benefit falls away
              at a different income, and where several fall together is where the
              cliff bites.
            </p>
          </div>
          <BenefitDropTable rows={model.tableRows} />
        </section>

        {/* ── PROGRAM SPOKES: ranked by real drop, NOT a flat card row ──────── */}
        <section
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-md)",
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
            Look at one benefit at a time
          </h2>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {programs.map((p, i) => {
              const facts = model.programFacts[p.slug];
              return (
                <Link
                  key={p.slug}
                  href={`/benefits-cliff/${state.slug}/${p.slug}`}
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: "var(--space-md)",
                    paddingTop: "var(--space-md)",
                    paddingBottom: "var(--space-md)",
                    borderTop:
                      i === 0 ? "none" : "1px solid var(--color-border-stone)",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                    }}
                  >
                    <span
                      style={{
                        fontSize:
                          i === 0
                            ? "var(--type-heading)"
                            : "var(--type-subheading)",
                        fontWeight: 700,
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {p.shortName} in {state.label}
                    </span>
                    <span
                      style={{
                        fontSize: "var(--type-caption)",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {facts.endsAtIncome
                        ? `Falls away around ${fmtDollars(facts.endsAtIncome)}`
                        : "See where it falls away"}
                    </span>
                  </span>
                  <span
                    className="tabular-nums"
                    style={{
                      whiteSpace: "nowrap",
                      fontSize:
                        i === 0 ? "var(--type-heading)" : "var(--type-subheading)",
                      fontWeight: 700,
                      color: "var(--color-negative-delta)",
                    }}
                  >
                    &minus;{fmtDollars(facts.worstDrop)}
                    <span aria-hidden style={{ color: "var(--color-text-muted)" }}>
                      {"  →"}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── SOURCES + freshness ───────────────────────────────────────────── */}
        <section
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-sm)",
          }}
        >
          <SourceChips sources={sources} />
          <ConfidenceBadge sources={sources} />
        </section>

        {/* ── FAQ (feeds FAQPage schema) ────────────────────────────────────── */}
        <CliffFAQ entries={faqEntries} />

        {/* ── COMPARE ANOTHER STATE (answers "what about where I live/moved") ─ */}
        {neighbours.length > 0 && (
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
              Live somewhere else?
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {neighbours.map((n) => (
                <Link
                  key={n.code}
                  href={`/benefits-cliff/${n.slug}`}
                  style={{
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
                  }}
                >
                  {n.label}
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}

/* ── The second-cliff callout (Basic Health Program states, NY today) ─────────
   Surfaced only when the engine reports an Essential-Plan cliff distinct from the
   hero pick. Every number is engine-derived (drop, income, FPL ceiling); the
   250%→200% ceiling change and its date are the documented 2026 rule change, the
   timely reason this second cliff bites more households now. Warm amber-trust
   framing (not the red danger palette) — it informs, it does not alarm. */
function EssentialPlanCallout({
  cliff,
  stateLabel,
}: {
  cliff: EssentialPlanCliff;
  stateLabel: string;
}) {
  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-sm)",
        padding: "var(--space-lg)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--color-border-stone)",
        borderLeft: "4px solid var(--color-brand-amber)",
        backgroundColor: "var(--color-trust-surface)",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: "var(--type-caption)",
          fontWeight: 600,
          letterSpacing: "0.02em",
          textTransform: "uppercase",
          color: "var(--color-text-muted)",
        }}
      >
        A second cliff, only in {stateLabel}
      </p>
      <h2
        style={{
          margin: 0,
          fontSize: "var(--type-heading)",
          fontWeight: 700,
          color: "var(--color-text-primary)",
        }}
      >
        {stateLabel} families can hit the cliff twice
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
        Most states have a single steepest cliff. {stateLabel} has a second one.
        Its Essential Plan keeps health coverage almost free up to{" "}
        {cliff.maxFPLPercent}% of the federal poverty line. Earn one step past
        that and a {CANON_FAMILY_LABEL} moves to full marketplace premiums,
        cutting real take-home by about{" "}
        <span
          className="tabular-nums"
          style={{ fontWeight: 700, color: "var(--color-negative-delta)" }}
        >
          {fmtDollars(cliff.drop)}
        </span>{" "}
        a year at around {fmtDollars(cliff.atIncome)}.
      </p>
      <p
        style={{
          margin: 0,
          maxWidth: "62ch",
          fontSize: "var(--type-body)",
          lineHeight: 1.6,
          color: "var(--color-text-secondary)",
        }}
      >
        That ceiling fell from 250% to {cliff.maxFPLPercent}% of the poverty line
        on 1 July 2026, so more {stateLabel} families reach this second cliff now
        than did last month.
      </p>
    </section>
  );
}

/* ── Presentational: the earnings-vs-drop table ───────────────────────────────
   tabular-nums; the drop column reads in negative-delta so the loss is scannable
   without reading every cell (critique recommendation 2). Single surface level. */
function BenefitDropTable({
  rows,
}: {
  rows: HubModel["tableRows"];
}) {
  return (
    <div
      style={{
        border: "1px solid var(--color-border-stone)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        backgroundColor: "var(--color-surface-white)",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "var(--type-body)",
        }}
      >
        <thead>
          <tr>
            <Th align="left">Benefit</Th>
            <Th align="right">Falls away around</Th>
            <Th align="right">Biggest single drop</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.name}
              style={{
                borderTop:
                  i === 0 ? "none" : "1px solid var(--color-border-stone)",
              }}
            >
              <td
                style={{
                  padding: "var(--space-sm) var(--space-md)",
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                }}
              >
                {r.name}
              </td>
              <td
                className="tabular-nums"
                style={{
                  padding: "var(--space-sm) var(--space-md)",
                  textAlign: "right",
                  color: "var(--color-text-secondary)",
                }}
              >
                {r.endsAt ? fmtDollars(r.endsAt) : "stays flat"}
              </td>
              <td
                className="tabular-nums"
                style={{
                  padding: "var(--space-sm) var(--space-md)",
                  textAlign: "right",
                  fontWeight: 700,
                  color: "var(--color-negative-delta)",
                }}
              >
                &minus;{fmtDollars(r.worstDrop)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({
  children,
  align,
}: {
  children: React.ReactNode;
  align: "left" | "right";
}) {
  return (
    <th
      style={{
        padding: "var(--space-sm) var(--space-md)",
        textAlign: align,
        fontSize: "var(--type-caption)",
        fontWeight: 600,
        color: "var(--color-text-muted)",
        backgroundColor: "var(--color-trust-surface)",
        borderBottom: "1px solid var(--color-border-stone)",
      }}
    >
      {children}
    </th>
  );
}

/* ── FAQ content (engine-derived; shared with faqLd) ─────────────────────────
   Question-phrased as the search query. Every dollar comes from the model. */
function buildHubFaq(m: HubModel): FaqEntry[] {
  const entries: FaqEntry[] = [
    {
      question: `Can a raise really make you poorer in ${m.stateLabel}?`,
      answer:
        `Yes. For a ${CANON_FAMILY_LABEL} in ${m.stateLabel}, a ${fmtDollars(
          m.raise
        )} raise at ${fmtDollars(
          m.currentIncome
        )} can cut real take-home by about ${fmtDollars(
          m.loss
        )} a year, because benefits fall away faster than the extra pay comes in.`,
    },
    {
      question: `What is a benefits cliff?`,
      answer:
        `A benefits cliff is where a small raise triggers a large drop in ` +
        `benefits, so your total take-home goes down even though your pay went ` +
        `up. Several benefits can fall in the same narrow income band, which is ` +
        `what makes the drop so steep.`,
    },
  ];
  if (m.safeExit) {
    entries.push({
      question: `What income clears the cliff in ${m.stateLabel}?`,
      answer:
        `For a ${CANON_FAMILY_LABEL} in ${m.stateLabel}, take-home passes its ` +
        `earlier level again at about ${fmtDollars(
          m.safeExit
        )} a year. That is the safe exit: earn past it and the raise pays off ` +
        `for good.`,
    });
  }
  if (m.essentialPlanCliff) {
    const ep = m.essentialPlanCliff;
    // News-peg query: the literal question people search after the 2026-07-01 rule
    // change. Lead with the date + ceiling change (not the "second cliff" framing) so
    // Google does not collapse this against the evergreen explainer entry below.
    entries.push({
      question: `Is ${m.stateLabel}'s Essential Plan changing in July 2026?`,
      answer:
        `Yes. On 1 July 2026 the Essential Plan income ceiling fell from 250% to ` +
        `${ep.maxFPLPercent}% of the federal poverty line. A ${CANON_FAMILY_LABEL} ` +
        `earning past that now hits a second cliff, losing about ` +
        `${fmtDollars(ep.drop)} a year at around ${fmtDollars(
          ep.atIncome
        )}. Every figure here is calculated from the rules, not estimated.`,
    });
    entries.push({
      question: `Why does ${m.stateLabel} have a second benefits cliff?`,
      answer:
        `${m.stateLabel}'s Essential Plan keeps health coverage almost free up ` +
        `to ${ep.maxFPLPercent}% of the poverty line. Earn past that and a ` +
        `${CANON_FAMILY_LABEL} pays full marketplace premiums, cutting real ` +
        `take-home by about ${fmtDollars(ep.drop)} a year at around ` +
        `${fmtDollars(ep.atIncome)}. That ceiling fell from 250% to ` +
        `${ep.maxFPLPercent}% of the poverty line on 1 July 2026.`,
    });
  }
  entries.push({
    question: `Where do these ${m.stateLabel} numbers come from?`,
    answer:
      `Every figure is calculated from published government rules, SNAP from ` +
      `the USDA, Medicaid and the marketplace, HUD housing limits, and ` +
      `${m.stateLabel}'s own childcare and tax rules. Your inputs stay on your ` +
      `phone and are never sent anywhere.`,
  });
  return entries;
}
