/**
 * components/seo/AnswerBlock — the standalone-citable answer that leads every
 * SEO page (the AEO lever: AI Overviews / Perplexity / ChatGPT lift a 40–60 word
 * self-contained answer, so we hand them one, engine-derived).
 *
 * Design role (per the pre-build critique, must-fix 1): this is CONTENT, not the
 * hero. It renders at body size in a calm bordered panel on trust-surface, one
 * clear step below the giant Display loss number, so the squint test still
 * resolves to the number. The dollar figure inside the sentence is emphasised in
 * negative-delta (financial meaning), never as decoration.
 *
 * Server component (no client JS). The answer string is composed by the page from
 * engine facts and passed in — this component only presents it.
 */

/** A span of the answer. `emphasis` marks the load-bearing dollar/target figure
 *  so it carries the right financial colour without the whole line shouting. */
export interface AnswerSpan {
  text: string;
  /** "loss" → negative-delta (a cost); "gain" → positive-delta (the way out). */
  emphasis?: "loss" | "gain";
}

export function AnswerBlock({
  spans,
  label = "The short answer",
}: {
  /** The answer as styled spans (40–60 words total; composed by the page). */
  spans: AnswerSpan[];
  /** Small eyebrow above the answer. */
  label?: string;
}) {
  return (
    <section
      aria-label="Short answer"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-xs)",
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
          letterSpacing: "0.02em",
          textTransform: "uppercase",
          color: "var(--color-text-muted)",
        }}
      >
        {label}
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
        {spans.map((s, i) =>
          s.emphasis ? (
            <strong
              key={i}
              className="tabular-nums"
              style={{
                fontWeight: 700,
                color:
                  s.emphasis === "loss"
                    ? "var(--color-negative-delta)"
                    : "var(--color-positive-delta)",
              }}
            >
              {s.text}
            </strong>
          ) : (
            <span key={i}>{s.text}</span>
          )
        )}
      </p>
    </section>
  );
}
