import { ImageResponse } from "next/og";
import { canonScenario, CANON_FAMILY_SIZE } from "@/lib/seo/states";
import { deriveResults } from "@/components/calculator/derive";

/**
 * Shared source of truth for the CliffCheck social-share card (Open Graph +
 * Twitter). Both `app/opengraph-image.tsx` and `app/twitter-image.tsx`
 * re-export `size`, `contentType`, `alt`, and `renderCard()` from here so the
 * two cards can never drift apart.
 *
 * Why code-rendered (next/og) and not a committed PNG: the previous static
 * `opengraph-image.png` / `twitter-image.png` were hand-generated once and shipped
 * broken — the layout overflowed the right edge and clipped the hero number to
 * "−$9,80". Rendering the card from JSX at exactly 1200×630 means the frame,
 * padding, and margins are computed every build and can never overflow again.
 *
 * Colours are the exact DESIGN.md tokens (no eyeballed hex). System-font stack
 * only — DESIGN.md bans custom font loading, so we let next/og fall back to its
 * default sans. Every string is measured against the 1200×630 frame with ~60px
 * safe margins; the longest ("Need $85,000/yr to break even") fits inside the pill.
 *
 * satori (the next/og layout engine) requires an explicit `display: 'flex'` on
 * any element with more than one child — every container below sets it.
 */

// DESIGN.md colour tokens — do not eyeball these.
const TOKENS = {
  warmWhite: "#FAFAF9", // page background — warm, not clinical
  brandAmber: "#F59E0B", // brand signal colour — the top/bottom rule bars
  textPrimary: "#1C1917", // headlines / brand wordmark — never pure black
  textSecondary: "#57534E", // subtitle, context row, footer
  negativeDelta: "#B91C1C", // "−$X" hero value (darker red for text contrast)
  trustSurface: "#F5F5F4", // context pill background (persistent-chrome stone)
  borderStone: "#E7E5E4", // pill / divider borders
  safeExitBg: "#F0FDF4", // safe-exit pill background (pale green)
  safeGreen: "#16A34A", // safe-exit label + border
  positiveDelta: "#15803D", // safe-exit value (darker green for text contrast)
} as const;

export const size = { width: 1200, height: 630 } as const;

export const contentType = "image/png";

/* ── Canonical demo scenario, engine-derived at build time ────────────────────
   The card tells the canonical Ohio demo story (family of 4, $44k → $70k raise).
   The INCOMES are the scenario definition; every dollar OUTCOME (the loss, the
   safe exit) is derived from the engine via the same canonScenario/deriveResults
   path the SEO surfaces use — never hand-typed, so the card can never drift from
   the engine again (it previously hardcoded −$9,800 vs the engine-true −$9,754). */
const DEMO_CURRENT = 44000;
const DEMO_OFFERED = 70000;

const demo = deriveResults(canonScenario("OH"), DEMO_CURRENT, DEMO_OFFERED);

/** Integer dollars, en-US grouping — mirrors the calculator's formatter. */
function money(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

/** Whole-thousand incomes as "$44k" for the compact context pill. */
function moneyK(n: number): string {
  return "$" + Math.round(n / 1000) + "k";
}

const demoLoss = Math.abs(Math.round(demo.diff));
const demoRaise = DEMO_OFFERED - DEMO_CURRENT;

export const alt = `CliffCheck: in Ohio, a family of ${CANON_FAMILY_SIZE} taking a ${moneyK(
  DEMO_CURRENT,
)} to ${moneyK(DEMO_OFFERED)} raise ends up −${money(demoLoss)} worse off.${
  demo.safeExit ? ` They need ${money(demo.safeExit)} a year to break even.` : ""
}`;

/**
 * Renders the share-card ImageResponse. Kept as a plain function (not a route
 * default export) so both file-convention routes can import and call it.
 */
export function renderCard(): ImageResponse {
  const barHeight = 14; // thick amber rule, top and bottom

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: TOKENS.warmWhite,
          position: "relative",
        }}
      >
        {/* Top amber rule — full width, contained inside the frame */}
        <div
          style={{
            display: "flex",
            width: "100%",
            height: barHeight,
            backgroundColor: TOKENS.brandAmber,
          }}
        />

        {/* Content well — 60px horizontal safe margin on both sides */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            paddingLeft: 60,
            paddingRight: 60,
            paddingTop: 44,
            paddingBottom: 44,
          }}
        >
          {/* Header row: brand wordmark (left), context pill (right) */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  display: "flex",
                  fontSize: 52,
                  fontWeight: 800,
                  color: TOKENS.textPrimary,
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                }}
              >
                CliffCheck
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 24,
                  fontWeight: 600,
                  color: TOKENS.textSecondary,
                  marginTop: 8,
                }}
              >
                Benefits Cliff Navigator
              </div>
            </div>

            {/* Context pill */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: TOKENS.trustSurface,
                border: `1px solid ${TOKENS.borderStone}`,
                borderRadius: 9999,
                paddingLeft: 24,
                paddingRight: 24,
                paddingTop: 12,
                paddingBottom: 12,
                fontSize: 24,
                fontWeight: 600,
                color: TOKENS.textSecondary,
                marginTop: 6,
              }}
            >
              {`Ohio · Family of ${CANON_FAMILY_SIZE} · ${moneyK(DEMO_CURRENT)} → ${moneyK(DEMO_OFFERED)} raise`}
            </div>
          </div>

          {/* Hero block — the number is the product. Vertically centred in the
              remaining space so it owns the card. */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              justifyContent: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 210,
                fontWeight: 800,
                color: TOKENS.negativeDelta,
                letterSpacing: "-0.04em",
                lineHeight: 1,
              }}
            >
              {`−${money(demoLoss)}`}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 40,
                fontWeight: 600,
                color: TOKENS.textPrimary,
                marginTop: 12,
              }}
            >
              {`worse off after a ${money(demoRaise)} raise`}
            </div>
          </div>

          {/* Footer row: safe-exit pill (left), domain (right) */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {/* Safe-exit pill — two-layer: small-caps label above value */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                backgroundColor: TOKENS.safeExitBg,
                border: `1px solid ${TOKENS.safeGreen}`,
                borderRadius: 16,
                paddingLeft: 28,
                paddingRight: 28,
                paddingTop: 16,
                paddingBottom: 18,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 18,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  color: TOKENS.safeGreen,
                }}
              >
                SAFE EXIT
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 34,
                  fontWeight: 800,
                  color: TOKENS.positiveDelta,
                  marginTop: 4,
                }}
              >
                {demo.safeExit
                  ? `Need ${money(demo.safeExit)}/yr to break even`
                  : "See where your cliff is"}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                fontSize: 26,
                fontWeight: 600,
                color: TOKENS.textSecondary,
              }}
            >
              cliffcheck.com
            </div>
          </div>
        </div>

        {/* Bottom amber rule */}
        <div
          style={{
            display: "flex",
            width: "100%",
            height: barHeight,
            backgroundColor: TOKENS.brandAmber,
          }}
        />
      </div>
    ),
    { ...size },
  );
}
