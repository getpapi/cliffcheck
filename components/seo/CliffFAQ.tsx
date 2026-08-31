/**
 * components/seo/CliffFAQ — the on-page FAQ that also feeds FAQPage structured
 * data. The SAME FaqEntry[] the page hands this component is handed to faqLd(), so
 * the visible questions and the schema never drift (a manual-action risk if they
 * did).
 *
 * The questions are phrased verbatim as the search query ("How much can I earn
 * before I lose SNAP in Texas?") — the AEO pattern that gets a page surfaced as
 * the answer. Every answer is engine-derived and composed by the page.
 *
 * Typographic hierarchy: the question is the scan target (heading weight, primary
 * ink); the answer is calm supporting body. One surface level — plain rows on the
 * page background separated by hairlines, never cards nested in a card. Server
 * component, no client JS, so it renders in the crawlable HTML.
 */
import type { FaqEntry } from "@/lib/seo/jsonld";

export function CliffFAQ({
  entries,
  heading = "Questions people ask",
}: {
  entries: FaqEntry[];
  heading?: string;
}) {
  if (entries.length === 0) return null;
  return (
    <section
      aria-labelledby="faq-heading"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-md)",
      }}
    >
      <h2
        id="faq-heading"
        style={{
          margin: 0,
          fontSize: "var(--type-heading)",
          fontWeight: 700,
          color: "var(--color-text-primary)",
        }}
      >
        {heading}
      </h2>
      <dl style={{ margin: 0, display: "flex", flexDirection: "column" }}>
        {entries.map((e, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              paddingTop: "var(--space-md)",
              paddingBottom: "var(--space-md)",
              borderTop:
                i === 0 ? "none" : "1px solid var(--color-border-stone)",
            }}
          >
            <dt
              style={{
                margin: 0,
                fontSize: "var(--type-subheading)",
                fontWeight: 700,
                lineHeight: 1.4,
                color: "var(--color-text-primary)",
              }}
            >
              {e.question}
            </dt>
            <dd
              style={{
                margin: 0,
                maxWidth: "66ch",
                fontSize: "var(--type-body)",
                lineHeight: 1.6,
                color: "var(--color-text-secondary)",
              }}
            >
              {e.answer}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
