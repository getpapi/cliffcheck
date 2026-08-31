/**
 * Home (/) — CliffCheck IS the tool.
 *
 * Tool-first single page: a compact intro row (the H1 and one supporting line,
 * left-aligned, no marketing hero), then the <Calculator/> which owns the
 * answer band, chart, inputs, and the below-the-fold detail. Chrome (header
 * with trust pill, footer) comes from app/layout.
 */
import { Calculator } from "@/components/calculator/Calculator";

export default function Home() {
  return (
    <>
      <noscript>
        <div
          className="cc-container"
          style={{
            padding: "var(--space-md)",
            color: "var(--color-text-secondary)",
            lineHeight: 1.6,
          }}
        >
          The calculator does all its math right here on your device. Nothing is
          sent anywhere, so it needs JavaScript switched on. Turn it on and reload
          to see your number.
        </div>
      </noscript>

      {/* Compact page intro — the H1 lives on the page, not in the chrome. */}
      <div
        className="cc-container"
        style={{ paddingTop: "var(--space-lg)", paddingBottom: "var(--space-xs)" }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(1.45rem, 3.2vw, 1.9rem)",
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: "-0.025em",
            color: "var(--color-text-primary)",
          }}
        >
          See what a raise really costs you.
        </h1>
        <p
          style={{
            margin: "6px 0 0",
            fontSize: "var(--type-subheading)",
            lineHeight: 1.5,
            color: "var(--color-text-secondary)",
            maxWidth: "62ch",
          }}
        >
          Earn more, and help with food, health, and childcare can drop faster
          than your pay rises. That&apos;s a benefits cliff. Set your situation
          below and watch your real take-home move.
        </p>
        <p
          style={{
            margin: "10px 0 0",
            fontSize: "var(--type-caption)",
            lineHeight: 1.4,
            color: "var(--color-text-muted)",
            letterSpacing: "0.01em",
          }}
        >
          Free · private · no signup
        </p>
      </div>

      <Calculator />
    </>
  );
}
