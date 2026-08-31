/**
 * /guide/[topic] — Template C, the NATIONAL GLOSSARY (top-of-funnel definitions).
 *
 * One page per curated topic (generateStaticParams → every slug in GUIDE_TOPICS).
 * Unlike the state hub (Template A) and the program spoke (Template B), a topic is
 * national, not state-scoped: it DEFINES a concept ("what is a benefits cliff",
 * "will a raise make me poorer") for a searcher at the very top of the funnel, then
 * links DOWN to every state hub and ACROSS to /why. It is the strongest AI-citation
 * target in the cluster, so it leads with a standalone-citable answer.
 *
 * Design canon applied (pre-build design-critique, must-fixes addressed):
 *  - ONE dominant hero: the H1 QUESTION plus the short plain-English answer. The
 *    engine-worked example is PROOF, so its dollar figure renders at heading scale
 *    inside a clearly subordinate two-layer stat, never at Display scale. This is
 *    what differentiates a glossary page from the state hub (whose hero IS a giant
 *    Display loss number). Squint test resolves to "a question is being answered".
 *  - Down-links to state hubs are a hairline-separated list (like the hub's program
 *    spoke links), NOT identical cards in a uniform row.
 *  - One surface level; amber only on the CTA + onward accents; negative-delta ink
 *    only on the load-bearing loss figure (earned financial meaning). No motion,
 *    no client JS, no chart. No em-dashes in authored strings; no banned jargon.
 *
 * Every dollar is ENGINE-DERIVED at build time via buildTopicModel → heroScenario
 * (the same Ohio scenario /why and the Ohio hub quote), so no number is hand-typed
 * and no figure can drift across the site. A grep for hardcoded dollars is clean.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { fmtDollars } from "@/components/calculator/derive";
import { getSeoStates } from "@/lib/seo/states";
import {
  allTopicParams,
  topicFromSlug,
  buildTopicModel,
  otherTopics,
} from "@/lib/seo/guide";
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
} from "@/lib/seo/jsonld";

/** SSG: one static page per curated topic. */
export function generateStaticParams() {
  return allTopicParams();
}

type RouteParams = { topic: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { topic: slug } = await params;
  const topic = topicFromSlug(slug);
  if (!topic) return {};
  const m = buildTopicModel(topic);
  const path = `/guide/${topic.slug}`;
  return {
    title: m.metaTitle,
    description: m.metaDescription,
    alternates: { canonical: path },
    openGraph: {
      title: `${m.metaTitle} · CliffCheck`,
      description: m.metaDescription,
      url: path,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${m.metaTitle} · CliffCheck`,
      description: m.metaDescription,
    },
  };
}

export default async function GuideTopicPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { topic: slug } = await params;
  const topic = topicFromSlug(slug);
  if (!topic) notFound();

  const m = buildTopicModel(topic);
  const states = getSeoStates();
  const onward = otherTopics(topic.slug);
  const path = `/guide/${topic.slug}`;
  const ex = m.example;

  const ld = jsonLdGraph(
    webApplicationLd(),
    organizationLd(),
    articleLd({
      headline: m.question,
      description: m.metaDescription,
      path,
      dateModified: m.dateModified,
    }),
    breadcrumbLd([
      { name: "CliffCheck", path: "/" },
      { name: m.question, path },
    ]),
    faqLd(m.faq)
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(ld) }}
      />
      <article
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "var(--space-xl) var(--space-md) var(--space-xxl)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-xl)",
        }}
      >
        {/* ── HERO: the QUESTION is the single dominant element ────────────────── */}
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
              fontSize: "var(--type-caption)",
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: "var(--color-text-muted)",
            }}
          >
            {m.eyebrow}
          </p>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(1.9rem, 5vw, 2.9rem)",
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "var(--color-text-primary)",
              maxWidth: "18ch",
            }}
          >
            {m.question}
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: "var(--type-subheading)",
              fontWeight: 600,
              color: "var(--color-text-secondary)",
            }}
          >
            {m.kicker}
          </p>

          {/* AnswerBlock: the citable 40-60 word plain-English answer. This plus the
              H1 is the hero; the emphasised dollar inside it is engine-derived. */}
          <AnswerBlock spans={m.answerSpans} />

          {/* Single primary action for this view: check your own number. */}
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

        {/* ── THE DEFINITION (the substance) ───────────────────────────────────── */}
        <section
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-md)",
          }}
        >
          {m.definition.map((para, i) => (
            <P key={i}>{para}</P>
          ))}
        </section>

        {/* ── THE WORKED EXAMPLE (proof: subordinate two-layer stat, not a 2nd hero) */}
        <section
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-md)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-sm)",
              padding: "var(--space-lg)",
              backgroundColor: "var(--color-trust-surface)",
              border: "1px solid var(--color-border-stone)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "var(--type-caption)",
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: "var(--color-text-muted)",
              }}
            >
              A worked example
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "var(--type-subheading)",
                fontWeight: 600,
                color: "var(--color-text-secondary)",
              }}
            >
              {m.exampleLead}
            </p>

            <MathRow
              label={`The raise, at ${fmtDollars(ex.currentIncome)} before tax`}
              value={`+${fmtDollars(ex.raise)}`}
            />
            <MathRow
              label="Benefits and extra costs it triggers"
              value={`−${fmtDollars(ex.loss)}`}
              tone="loss"
            />
            <div
              style={{
                height: 1,
                backgroundColor: "var(--color-border-stone)",
                margin: "2px 0",
              }}
            />
            <MathRow
              label="What the family actually keeps"
              value={
                m.keptOfRaise > 0
                  ? `+${fmtDollars(m.keptOfRaise)}`
                  : `−${fmtDollars(ex.loss - ex.raise)}`
              }
              tone={m.keptOfRaise > 0 ? "gain" : "loss"}
              strong
            />
            <p
              style={{
                margin: 0,
                fontSize: "var(--type-caption)",
                lineHeight: 1.6,
                color: "var(--color-text-muted)",
              }}
            >
              Calculated live from published government rules for a {ex.familyLabel}{" "}
              in {ex.stateLabel}, the same engine behind the calculator.
            </p>
          </div>

          {m.afterExample.map((para, i) => (
            <P key={i}>{para}</P>
          ))}
        </section>

        {/* ── DOWN-LINKS: the cliff in your state (hairline list, not a card grid) */}
        <section
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-sm)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <h2
              style={{
                margin: 0,
                fontSize: "var(--type-heading)",
                fontWeight: 700,
                color: "var(--color-text-primary)",
              }}
            >
              See the cliff where you live
            </h2>
            <p
              style={{
                margin: 0,
                maxWidth: "60ch",
                fontSize: "var(--type-body)",
                lineHeight: 1.6,
                color: "var(--color-text-secondary)",
              }}
            >
              The band where benefits fall away is different in every state. Pick
              yours to see the real number for a family like yours.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {states.map((s, i) => (
              <Link
                key={s.code}
                href={`/benefits-cliff/${s.slug}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "var(--space-md)",
                  minHeight: 48,
                  paddingTop: "var(--space-sm)",
                  paddingBottom: "var(--space-sm)",
                  borderTop:
                    i === 0 ? "none" : "1px solid var(--color-border-stone)",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <span
                  style={{
                    fontSize: "var(--type-subheading)",
                    fontWeight: 700,
                    color: "var(--color-text-primary)",
                  }}
                >
                  Benefits cliff in {s.label}
                </span>
                <span
                  aria-hidden
                  style={{
                    color: "var(--color-cta-hover-amber)",
                    fontWeight: 700,
                  }}
                >
                  &rarr;
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── FAQ (feeds FAQPage schema; same entries as faqLd) ─────────────────── */}
        <CliffFAQ entries={m.faq} />

        {/* ── ONWARD: across to /why + other glossary topics (quiet pills) ──────── */}
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
            Keep reading
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            <OnwardLink href="/why">Why this happens at all</OnwardLink>
            {onward.map((t) => (
              <OnwardLink key={t.slug} href={`/guide/${t.slug}`}>
                {t.question}
              </OnwardLink>
            ))}
          </div>
        </section>
      </article>
    </>
  );
}

/* ── Presentational helpers (read tokens; no second surface level) ────────────── */

/** Body paragraph: generous line-height, capped measure for readability. */
function P({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        margin: 0,
        maxWidth: "64ch",
        fontSize: "var(--type-body)",
        lineHeight: 1.7,
        color: "var(--color-text-secondary)",
      }}
    >
      {children}
    </p>
  );
}

/** One line in the worked-example block: label left, signed value right in
 *  tabular-nums, financial colour on the value only. Mirrors /why's MathRow. */
function MathRow({
  label,
  value,
  tone,
  strong,
}: {
  label: string;
  value: string;
  tone?: "loss" | "gain";
  strong?: boolean;
}) {
  const color =
    tone === "loss"
      ? "var(--color-negative-delta)"
      : tone === "gain"
        ? "var(--color-positive-delta)"
        : "var(--color-text-primary)";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: "var(--space-md)",
      }}
    >
      <span
        style={{
          fontSize: "var(--type-body)",
          fontWeight: strong ? 700 : 400,
          color: strong
            ? "var(--color-text-primary)"
            : "var(--color-text-secondary)",
        }}
      >
        {label}
      </span>
      <span
        className="tabular-nums"
        style={{
          whiteSpace: "nowrap",
          fontSize: strong ? "var(--type-heading)" : "var(--type-body)",
          fontWeight: strong ? 800 : 600,
          color,
        }}
      >
        {value}
      </span>
    </div>
  );
}

/** A quiet onward pill matching the hub + /why affordance. */
function OnwardLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-flex",
        alignItems: "center",
        minHeight: 44,
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
      {children}
    </Link>
  );
}
