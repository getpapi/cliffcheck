/**
 * Per-topic dynamic OG image for the /guide/[topic] glossary (Template C).
 * Without this file every topic borrowed the ROOT Ohio card via Next's
 * file-convention fallback — a definitional page previewing a state-family card
 * is off-message. This bakes each topic's own title + the engine-derived Ohio
 * example number into a 1200x630 share card, the shareable half of the glossary.
 *
 * Modelled on app/benefits-cliff/[state]/opengraph-image.tsx (the dynamic-param
 * pattern): generateStaticParams enumerates the registry, params is awaited,
 * unknown slug renders a defensive brand fallback rather than throwing. Same
 * literal-hex tokens (Satori cannot read CSS vars — the sanctioned exception,
 * mirrored from DESIGN.md) and explicit-flex discipline. Numbers come from the
 * SAME buildTopicModel the page renders, so the card can never drift. Does NOT
 * touch the root or state OG routes, nor the page metadata (file convention wins).
 */
import { ImageResponse } from "next/og";
import { topicFromSlug, allTopicParams, buildTopicModel } from "@/lib/seo/guide";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "CliffCheck guide — benefits cliff explained";

/** One OG image per curated topic (matches the page's static params). */
export function generateStaticParams() {
  return allTopicParams();
}

// CliffCheck canon colours (DESIGN.md). Satori cannot read CSS variables, so the
// tokens are inlined here as literals — the sanctioned exception for next/og.
const C = {
  cream: "#FFF7ED", // surface-cream — warm card ground (never dark)
  ink: "#1C1917", // text-primary
  secondary: "#57534E", // text-secondary
  muted: "#A8A29E", // text-muted
  amber: "#F59E0B", // brand-amber — the single accent
  negative: "#B91C1C", // negative-delta — the loss
  border: "#E7E5E4", // border-stone
};

function money(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

export default async function Image({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic: slug } = await params;
  const topic = topicFromSlug(slug);

  // Defensive fallback: a clean brand card if the slug is unknown, so the OG
  // layer can never break the build over a bad param.
  if (!topic) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: C.cream,
            color: C.ink,
            fontSize: 64,
            fontWeight: 800,
          }}
        >
          CliffCheck
        </div>
      ),
      size
    );
  }

  const model = buildTopicModel(topic);
  const ex = model.example;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          backgroundColor: C.cream,
          borderTop: `12px solid ${C.amber}`,
        }}
      >
        {/* Wordmark + the topic's own question as the eyebrow */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: -0.5,
              color: C.ink,
            }}
          >
            CliffCheck · Guide
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 52,
              fontWeight: 700,
              letterSpacing: -1,
              lineHeight: 1.05,
              color: C.ink,
            }}
          >
            {model.question}
          </div>
        </div>

        {/* The engine-worked proof: raise framing + the real loss number */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div
            style={{
              display: "flex",
              fontSize: 30,
              fontWeight: 600,
              color: C.secondary,
            }}
          >
            In {ex.stateLabel}, a {money(ex.raise)} raise at{" "}
            {money(ex.currentIncome)} can cost a {ex.familyLabel}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <div
              style={{
                display: "flex",
                fontSize: 132,
                fontWeight: 800,
                letterSpacing: -4,
                lineHeight: 1,
                color: C.negative,
              }}
            >
              &#8722;{money(ex.loss)}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 40,
                fontWeight: 700,
                color: C.muted,
              }}
            >
              /yr
            </div>
          </div>
        </div>

        {/* Footer: cluster identity + privacy spine */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 24,
            color: C.secondary,
            borderTop: `1px solid ${C.border}`,
            paddingTop: 24,
          }}
        >
          <div style={{ display: "flex" }}>A plain-English CliffCheck guide</div>
          <div style={{ display: "flex", color: C.muted }}>
            Free · Private · cliffcheck.com
          </div>
        </div>
      </div>
    ),
    size
  );
}
