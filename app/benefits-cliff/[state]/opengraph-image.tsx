/**
 * Per-route dynamic OG image for the state hubs (and reused by the spokes via
 * their metadata `image`). Bakes the state's REAL engine cliff number into a
 * 1200x630 share card, so a link dropped in a Reddit thread previews as
 * "Texas: a $1,000 raise can cost you -$16,661" — the shareable half of pSEO.
 *
 * SCOPE: this file lives under app/benefits-cliff/[state]/ so it ONLY governs the
 * SEO routes. It does NOT touch the root social cards (app/opengraph-image.tsx /
 * app/twitter-image.tsx, both rendering app/_og/card.tsx), which stay as they are.
 *
 * Rendered with next/og (Satori). Satori has no system-ui, so the card is built
 * with the default sans fallback at large weights, and every colour is a literal
 * hex mirrored from the CliffCheck canon (DESIGN.md) because Satori cannot read
 * CSS custom properties. These literals are the ONE sanctioned place hex appears
 * for the SEO surface — Satori requires it, and the values are the exact tokens.
 * Numbers are still engine-derived (heroScenario), never hand-typed.
 *
 * The pre-mortem flags ImageResponse over a large param set as the fragile layer.
 * It is defensive: if a state slug does not resolve, it renders a clean brand
 * fallback card rather than throwing and breaking the build.
 */
import { ImageResponse } from "next/og";
import { stateFromSlug, heroScenario } from "@/lib/seo/states";
import { allStateParams } from "@/lib/seo/states";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "CliffCheck benefits cliff card";

/** Pre-render one OG image per state (matches the hub's static params). */
export function generateStaticParams() {
  return allStateParams();
}

// CliffCheck canon colours (DESIGN.md). Satori cannot read CSS variables, so the
// tokens are inlined here as literals — the sanctioned exception for next/og.
const C = {
  cream: "#FFF7ED", // surface-cream — warm card ground (never dark)
  white: "#FFFFFF",
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
  params: Promise<{ state: string }>;
}) {
  const { state: slug } = await params;
  const state = stateFromSlug(slug);

  // Defensive fallback: a clean brand card if the slug is unknown, so the OG
  // layer can never break the build over a bad param.
  if (!state) {
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

  const hero = heroScenario(state);

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
          // A thick amber rule along the top — the single confident accent, not a
          // fill, not a glow.
          borderTop: `12px solid ${C.amber}`,
        }}
      >
        {/* Wordmark + eyebrow */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            style={{
              display: "flex",
              fontSize: 30,
              fontWeight: 800,
              letterSpacing: -0.5,
              color: C.ink,
            }}
          >
            CliffCheck
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              fontWeight: 600,
              color: C.secondary,
            }}
          >
            {state.label} benefits cliff
          </div>
        </div>

        {/* The hero: the raise framing + the giant real loss number */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div
            style={{
              display: "flex",
              fontSize: 34,
              fontWeight: 600,
              color: C.ink,
            }}
          >
            A {money(hero.raise)} raise at {money(hero.currentIncome)} can cost a{" "}
            {hero.familyLabel}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 150,
                fontWeight: 800,
                letterSpacing: -4,
                lineHeight: 1,
                color: C.negative,
              }}
            >
              &#8722;{money(hero.loss)}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 44,
                fontWeight: 700,
                color: C.muted,
              }}
            >
              /yr
            </div>
          </div>
        </div>

        {/* Footer line: safe exit (the way out) + privacy spine */}
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
          <div style={{ display: "flex" }}>
            {hero.safeExit
              ? `Safe exit: ${money(hero.safeExit)}/yr`
              : "See where your cliff is"}
          </div>
          <div style={{ display: "flex", color: C.muted }}>
            Free · Private · cliffcheck.com
          </div>
        </div>
      </div>
    ),
    size
  );
}
