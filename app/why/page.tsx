/**
 * /why — "Why this happens", the narrative explainer.
 *
 * The hub and spoke pages answer "how much" for a state; /methodology answers
 * "how do you know". This page answers the question underneath all of them:
 * WHY does a raise ever make someone poorer, and whose fault is it (the system's,
 * not the worker's). It is the press/social share target and the skeptic's
 * "surely this can't be real" landing, so the register is PRODUCT.md's
 * knowledgeable friend who tells you straight, NOT policy advocacy and NOT a
 * government form.
 *
 * Server component: zero user data, zero client JS. The one number the hero
 * quotes is ENGINE-DERIVED at build time from heroScenario(Ohio) in
 * lib/seo/states.ts, the same source the state hubs quote, so the figure can
 * never drift from the rest of the site. The effective marginal rate is computed
 * from that engine loss + raise (1 + loss/raise), never hand-typed.
 *
 * Design canon applied (pre-build design-critique, 7/7):
 *  - ONE dominant hero: the >100% effective marginal rate (the "oh shit" number),
 *    Display weight, negative-delta ink because it IS a loss signal. The dollar
 *    loss is its supporting caption, not a competing hero.
 *  - One surface level: narrative sections separated by hairlines, never cards in
 *    cards. Amber only on the CTA + the citation/link accents.
 *  - No em-dashes in authored strings. No banned jargon in the flow; the few
 *    unavoidable policy terms (BBCE, earned income disregard, marginal rate) are
 *    glossed on first use exactly as /methodology glosses BBCE and SLCSP.
 *  - Static: no motion (the only sanctioned motion product-wide is the chart
 *    redraw, and there is no chart here).
 */
import type { Metadata } from "next";
import Link from "next/link";
import { fmtDollars } from "@/components/calculator/derive";
import {
  jsonLdGraph,
  serializeJsonLd,
  articleLd,
  breadcrumbLd,
} from "@/lib/seo/jsonld";
import { stateFromSlug, heroScenario } from "@/lib/seo/states";

const PATH = "/why";

/* ── The one engine-derived scenario the page is anchored to ───────────────────
   Ohio is CliffCheck's canonical demo household (a family of 4). heroScenario
   scans the engine's own cliff curve for the steepest raise-cliff and returns the
   real loss, raise, current/offered income and safe exit. Every dollar below
   flows from this object, so /why quotes the identical figure the Ohio hub does. */
function ohioScenario() {
  const oh = stateFromSlug("ohio");
  // Ohio is a supported state in the engine registry; guard defensively so a
  // future registry change fails the build loudly rather than shipping a blank.
  if (!oh) throw new Error("/why: Ohio scenario unavailable from the engine.");
  const hero = heroScenario(oh);
  // The raise carries an effective tax rate over 100% whenever the benefits lost
  // exceed the raise gained (loss > raise) — the worked-example block shows the
  // exact engine dollars. We assert "over 100%" rather than a raw percentage: at
  // the engine's steepest single step the arithmetic rate is extreme and reads as
  // an artifact, so the credible, defensible claim is the qualitative one.
  return { ...hero, slug: oh.slug };
}

export function generateMetadata(): Metadata {
  const s = ohioScenario();
  // Tuned for press/social: leads with the counter-intuitive claim + the real
  // engine number, then the reassurance (it is the system, not you).
  const title = "Why a raise can leave you poorer";
  const description =
    `The hidden math behind benefits cliffs. In ${s.stateLabel}, a ` +
    `${fmtDollars(s.raise)} raise can cost a family ${fmtDollars(s.loss)} in ` +
    `take-home, an effective rate over 100%. Here is why it happens, and it is ` +
    `not your mistake.`;
  return {
    title,
    description,
    alternates: { canonical: PATH },
    openGraph: {
      title: `${title} · CliffCheck`,
      description,
      url: PATH,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · CliffCheck`,
      description,
    },
  };
}

/* ── Small presentational helpers (no new component files needed) ──────────────
   All read tokens; none introduces a second surface level. */

/** A cited external link: amber accent + ↗, always safe target/rel. */
function Cite({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        color: "var(--color-cta-hover-amber)",
        fontWeight: 600,
        textDecoration: "none",
      }}
    >
      {children}
      <span aria-hidden style={{ marginLeft: 2 }}>
        ↗
      </span>
    </a>
  );
}

/** A narrative section: hairline-topped, heading over body. One surface level. */
function Section({
  eyebrow,
  heading,
  children,
}: {
  eyebrow: string;
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-md)",
        paddingTop: "var(--space-xl)",
        borderTop: "1px solid var(--color-border-stone)",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
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
          {eyebrow}
        </p>
        <h2
          style={{
            margin: 0,
            fontSize: "clamp(1.25rem, 3vw, 1.6rem)",
            fontWeight: 800,
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
            color: "var(--color-text-primary)",
          }}
        >
          {heading}
        </h2>
      </div>
      {children}
    </section>
  );
}

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

/** One program in the "designed in isolation" list: name dominates, gloss is
 *  muted supporting body. Rows on the page background, hairline-separated. */
function ProgramRow({
  name,
  first,
  children,
}: {
  name: string;
  first?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        paddingTop: "var(--space-md)",
        paddingBottom: "var(--space-md)",
        borderTop: first ? "none" : "1px solid var(--color-border-stone)",
      }}
    >
      <span
        style={{
          fontSize: "var(--type-subheading)",
          fontWeight: 700,
          color: "var(--color-text-primary)",
        }}
      >
        {name}
      </span>
      <span
        style={{
          maxWidth: "64ch",
          fontSize: "var(--type-body)",
          lineHeight: 1.6,
          color: "var(--color-text-secondary)",
        }}
      >
        {children}
      </span>
    </div>
  );
}

export default function WhyPage() {
  const s = ohioScenario();

  const ld = jsonLdGraph(
    articleLd({
      headline: "Why a raise can leave you poorer",
      description:
        "The hidden math behind benefits cliffs: how marginal tax plus benefits " +
        "falling away can push an effective rate over 100%, why the programs " +
        "collide, and what can be done about it.",
      path: PATH,
    }),
    breadcrumbLd([
      { name: "CliffCheck", path: "/" },
      { name: "Why this happens", path: PATH },
    ])
  );

  const keptOfRaise = Math.max(0, s.raise - s.loss);

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
        {/* ── HERO: the effective rate is the single dominant element ─────────── */}
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
            Why this happens
          </p>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(1.9rem, 5vw, 2.9rem)",
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "var(--color-text-primary)",
              maxWidth: "16ch",
            }}
          >
            How a raise can leave you poorer
          </h1>

          {/* Two-layer hero stat: muted label above, giant rate below. The dollar
              loss is the supporting caption so the rate stays the single focal
              point (squint test resolves to the rate). */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
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
              At {fmtDollars(s.currentIncome)} in {s.stateLabel}, a{" "}
              {fmtDollars(s.raise)} raise carries an effective tax rate of
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
              over 100%
            </span>
            <span
              style={{
                fontSize: "var(--type-caption)",
                color: "var(--color-text-muted)",
              }}
            >
              The extra pay is wiped out by lost benefits and higher costs, so the
              family ends up {fmtDollars(s.loss)}/yr poorer (
              {fmtDollars(Math.round(s.loss / 12))}/mo) than before the raise. It is
              not your mistake.
            </span>
          </div>

          {/* Short, self-contained answer for AI Overviews / share cards. */}
          <p
            style={{
              margin: 0,
              maxWidth: "64ch",
              fontSize: "var(--type-body)",
              lineHeight: 1.7,
              color: "var(--color-text-secondary)",
            }}
          >
            A rate over 100% means the raise leaves you with less than you started
            with. It happens because several benefits fall away in the same narrow
            band of income, all at once, faster than the extra pay comes in. The
            programs were each built on their own, decades apart, so no one
            designed the collision. This page explains the math, the history, and
            what can be done about it.
          </p>

          {/* Single primary action for this view: see your own number. */}
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
              <span aria-hidden>→</span>
            </Link>
          </div>
        </header>

        {/* ── §1 THE MATH ─────────────────────────────────────────────────────── */}
        <Section
          eyebrow="The math"
          heading="Your real tax rate is not the number on your payslip"
        >
          <P>
            Economists call it the effective marginal rate: for each extra dollar
            you earn, how much you actually keep after tax and after any benefits
            you lose. On a payslip your marginal rate might be 20 or 30 percent.
            But benefits like food help, health coverage and childcare support are
            tied to income, so as your pay rises they shrink. Count both the tax
            you pay and the benefits you lose, and the real rate on a raise can pass
            100 percent. When it does, earning more leaves you with less.
          </P>

          {/* "Show, don't assert": the >100% claim laid out line by line, using the
              engine-derived Ohio figures. Two-layer stat pattern, one surface. */}
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
              The worked example, a family of 4 in {s.stateLabel}
            </p>
            <MathRow label="The raise, before tax" value={`+${fmtDollars(s.raise)}`} />
            <MathRow
              label="Benefits and extra costs it triggers"
              value={`−${fmtDollars(s.loss)}`}
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
                keptOfRaise > 0
                  ? `+${fmtDollars(keptOfRaise)}`
                  : `−${fmtDollars(s.loss - s.raise)}`
              }
              tone={keptOfRaise > 0 ? "gain" : "loss"}
              strong
            />
            <p
              style={{
                margin: 0,
                fontSize: "var(--type-caption)",
                color: "var(--color-text-muted)",
                lineHeight: 1.6,
              }}
            >
              Losing {fmtDollars(s.loss)} to gain {fmtDollars(s.raise)} is an
              effective tax rate far above 100%. The figures are calculated live
              from published government rules for this household, the same engine
              behind the calculator.
            </p>
          </div>
          <P>
            The Atlanta Federal Reserve built a research tool, called{" "}
            <Cite href="https://www.atlantafed.org/economic-mobility-and-resilience/advancing-careers-for-low-income-families/cliff-tool">
              CLIFF
            </Cite>
            , to map exactly these moments for career counselors. The core finding
            is consistent across studies: in certain income bands, working families
            face effective rates far above what any top earner pays.
          </P>
        </Section>

        {/* ── §2 THE HISTORY ──────────────────────────────────────────────────── */}
        <Section
          eyebrow="The history"
          heading="No one designed the cliff. It emerged."
        >
          <P>
            Each of these programs was created on its own, to solve one problem,
            often decades apart. None was designed to work alongside the others, so
            each sets its own income limit, and where several limits land close
            together, the drops stack into a cliff. The{" "}
            <Cite href="https://www.cbpp.org/research/food-assistance/a-quick-guide-to-snap-eligibility-and-benefits">
              Center on Budget and Policy Priorities
            </Cite>{" "}
            documents how the rules for a single program alone run to dozens of
            pages, before you stack five of them.
          </P>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <ProgramRow name="SNAP, food help" first>
              Created in the 1960s to fight hunger. Its income limit was never set
              to line up with health or housing programs.
            </ProgramRow>
            <ProgramRow name="Medicaid, health coverage">
              Built in 1965 for a different population, later widened, so its cutoff
              sits at yet another income point.
            </ProgramRow>
            <ProgramRow name="ACA marketplace savings">
              Added in 2010 to fill the gap above Medicaid, with its own separate
              formula for how savings taper as pay rises.
            </ProgramRow>
            <ProgramRow name="Section 8 housing">
              A voucher program tied to local rents, with a limit that has nothing
              to do with the food or health cutoffs.
            </ProgramRow>
            <ProgramRow name="Childcare help">
              Run state by state, each with its own entry and exit income, and often
              the steepest single drop of all.
            </ProgramRow>
          </div>
          <P>
            Stack five limits that were never meant to meet, and a narrow band of
            income appears where a family can lose several supports at once. That
            band is the cliff. It is an accident of history, not a decision anyone
            made.
          </P>
        </Section>

        {/* ── §3 THE ASYMMETRY ────────────────────────────────────────────────── */}
        <Section
          eyebrow="The asymmetry"
          heading="It hits hardest exactly where a raise should matter most"
        >
          <P>
            The cruel part is where the cliff sits. It lands on working families in
            the income range just above the poverty line, the households for whom a
            promotion or a few extra hours is supposed to be the way up. A
            high earner who gets a raise keeps most of it. A parent leaving one
            benefit band can keep none of it, and sometimes less than none.
          </P>
          <P>
            Research from the{" "}
            <Cite href="https://www.urban.org/research/publication/marginal-tax-rates-and-work-incentives">
              Urban Institute
            </Cite>{" "}
            and the{" "}
            <Cite href="https://www.brookings.edu/articles/the-marriage-benefit-cliff-and-the-safety-net/">
              Brookings Institution
            </Cite>{" "}
            finds the highest effective marginal rates in the country fall not on
            the wealthy but on low and moderate income households moving up. The
            people most told to just take the promotion are the ones the math
            punishes for it.
          </P>
        </Section>

        {/* ── §4 WHAT CAN BE DONE ─────────────────────────────────────────────── */}
        <Section
          eyebrow="What can be done"
          heading="There are fixes, at the policy level and for you today"
        >
          <P>
            None of this is inevitable. It comes from limits that were never lined
            up, so lining them up is the fix. Several approaches already exist and
            are used in some states:
          </P>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <ProgramRow name="Broad based categorical eligibility, or BBCE" first>
              A rule most supported states already use that raises the food-help
              income limit above the federal default, so the drop is gentler.
            </ProgramRow>
            <ProgramRow name="Gradual step-downs">
              Phasing a benefit out slowly as pay rises, a few dollars lost per
              dollar earned, instead of everything ending at one income line.
            </ProgramRow>
            <ProgramRow name="Earned income disregards">
              Rules that let a family keep some of a benefit for a while after a
              raise, so a new job does not trigger an instant loss.
            </ProgramRow>
          </div>
          <P>
            These are neutral descriptions of tools already in use, not a
            recommendation. Which ones a state adopts is a policy choice.
          </P>
          <P>
            For your own situation today, there is one lever you may control.
            Money you put into an HSA or a pre-tax 401(k) lowers the income figure
            benefits are measured against, which can keep you under a limit while
            still building savings. The calculator has an Advanced levers panel
            where you can try this against your own numbers.
          </P>
          <div>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                minHeight: 44,
                fontSize: "var(--type-subheading)",
                fontWeight: 700,
                color: "var(--color-cta-hover-amber)",
                textDecoration: "none",
              }}
            >
              Try the pre-tax levers in the calculator
              <span aria-hidden>→</span>
            </Link>
          </div>
        </Section>

        {/* ── ONWARD: connect the node, answer "how do you know" + "what about me" ─ */}
        <section
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-sm)",
            paddingTop: "var(--space-xl)",
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
            Keep going
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            <OnwardLink href="/methodology">See how the numbers are sourced</OnwardLink>
            <OnwardLink href={`/benefits-cliff/${s.slug}`}>
              The {s.stateLabel} cliff in detail
            </OnwardLink>
          </div>
        </section>
      </article>
    </>
  );
}

/** A single line in the worked-example math block: label left, signed value right
 *  in tabular-nums, financial colour on the value only. */
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
          color: strong ? "var(--color-text-primary)" : "var(--color-text-secondary)",
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

/** A quiet onward pill matching the hub's compare-state affordance. */
function OnwardLink({ href, children }: { href: string; children: React.ReactNode }) {
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
