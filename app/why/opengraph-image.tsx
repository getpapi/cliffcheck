/**
 * Dedicated OG image for /why — the narrative citation anchor the pSEO pages
 * link up to. Without this file, /why borrowed the ROOT Ohio card via Next's
 * file-convention fallback; this replaces that with a card whose copy leads on
 * the "why" framing while still baking the REAL engine loss number.
 *
 * Modelled on app/benefits-cliff/[state]/opengraph-image.tsx: same 1200x630
 * size, same literal-hex tokens (Satori cannot read CSS custom properties — the
 * sanctioned exception mirrored from DESIGN.md), same explicit-flex discipline
 * (Satori requires display:flex on any multi-child element). The number is
 * engine-derived via heroScenario(Ohio) — the SAME source /why itself renders,
 * so the card and the page never drift. Does NOT touch the root social cards.
 */
import { ImageResponse } from "next/og";
import { stateFromSlug, heroScenario } from "@/lib/seo/states";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Why a raise can leave you poorer — CliffCheck";

// Build-time static render (engine data only, no request-time APIs) so the card
// is an immutable static asset and never cold-renders on a crawler fetch. See
// app/twitter-image.tsx for the full rationale.
export const dynamic = "force-static";

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

export default function Image() {
  const oh = stateFromSlug("ohio");

  // Defensive fallback: a clean brand card if Ohio ever leaves the registry, so
  // the OG layer can never break the build.
  if (!oh) {
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

  const hero = heroScenario(oh);

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
        {/* Wordmark + eyebrow — the page's own framing */}
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
            Why a raise can leave you poorer
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
            In {hero.stateLabel}, a {money(hero.raise)} raise at{" "}
            {money(hero.currentIncome)} can cost a {hero.familyLabel}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
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

        {/* Footer line: the explainer's promise + privacy spine */}
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
            The hidden math behind benefits cliffs
          </div>
          <div style={{ display: "flex", color: C.muted }}>
            Free · Private · cliffcheck.com/why
          </div>
        </div>
      </div>
    ),
    size
  );
}
