/**
 * Header — shared app chrome (DESIGN.md header spec, redesigned 09-07-2026).
 *
 * A real product header, not a title bar: logotype (cliff-step mark + wordmark)
 * left, quiet nav to the editorial pages centre-right, and the privacy promise
 * as an always-visible trust pill on the right — the trust signal lives IN the
 * chrome now, not in a separate grey strip. Surface-white on a hairline stone
 * border with the resting card shadow so the chrome reads as a designed layer
 * above the warm page. Sticky; 64px; nav collapses on phones (the footer
 * repeats the links) while the trust pill stays, shortened.
 */
import Link from "next/link";

/** The cliff mark: wages climb, the floor drops out, the path recovers.
 *  The product's whole argument in a 28px glyph. */
function CliffMark() {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 30,
        height: 30,
        borderRadius: "var(--radius-md)",
        backgroundColor: "var(--color-surface-cream)",
        border: "1px solid var(--color-amber-badge-bg)",
        flexShrink: 0,
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 18h4v-5h4V7h3v8h4v-4h3"
          stroke="var(--color-cta-hover-amber)"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="cc-header-link"
      style={{
        display: "inline-flex",
        alignItems: "center",
        minHeight: 44,
        fontSize: "var(--type-subheading)",
        fontWeight: 600,
        color: "var(--color-text-secondary)",
        textDecoration: "none",
        transition: "color var(--motion-fast) var(--ease-standard)",
      }}
    >
      {children}
    </Link>
  );
}

export function Header() {
  return (
    <header
      className="cc-header"
      style={{
        backgroundColor: "var(--color-surface-white)",
        // Round-2 definition: a real edge under the chrome, not a hairline
        // that dissolves into the cream page. Positioning (sticky desktop,
        // static phones) lives in .cc-header in globals.css.
        borderBottom: "1.5px solid var(--color-border-strong)",
        boxShadow: "var(--elevation-card)",
      }}
    >
      <div
        className="cc-container"
        style={{
          height: "var(--header-height)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--space-md)",
        }}
      >
        <a
          href="/"
          aria-label="CliffCheck home"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            color: "var(--color-text-primary)",
            textDecoration: "none",
          }}
        >
          <CliffMark />
          <span
            style={{
              fontSize: "18px",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            Cliff<span style={{ color: "var(--color-cta-hover-amber)" }}>Check</span>
          </span>
        </a>

        <nav aria-label="Main" className="cc-nav">
          <NavLink href="/why">Why this happens</NavLink>
          <NavLink href="/methodology">How we know</NavLink>
        </nav>

        {/* The trust contract, always above the fold (DESIGN.md). */}
        <span
          role="note"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            minHeight: 32,
            padding: "0 12px",
            borderRadius: "999px",
            backgroundColor: "var(--color-trust-surface)",
            border: "1px solid var(--color-border-stone)",
            fontSize: "var(--type-caption)",
            fontWeight: 600,
            color: "var(--color-text-secondary)",
            whiteSpace: "nowrap",
          }}
        >
          <svg
            aria-hidden="true"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            style={{ flexShrink: 0 }}
          >
            <path
              d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3z"
              stroke="var(--color-cta-hover-amber)"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M9.2 12l2 2 3.6-3.8"
              stroke="var(--color-cta-hover-amber)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="cc-trust-long">Your data stays on this device</span>
          <span className="cc-trust-short">Private, on-device</span>
        </span>
      </div>
    </header>
  );
}
