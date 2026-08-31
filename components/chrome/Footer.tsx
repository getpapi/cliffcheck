/**
 * Footer — shared app chrome (redesigned 09-07-2026).
 *
 * A real product footer in three zones: brand column (mark + the one-line soul
 * statement + the privacy promise), a Learn column (editorial pages + contact),
 * and a State guides column (the pSEO cliff pages, auto-tracking supported
 * states). A hairline-separated bottom bar carries provenance, the disclaimer,
 * and the deliberately-prominent "Built with PAPI" badge (lead-gen, amber chip,
 * never PAPI-branded chrome). Warm trust-surface, never a cold grey slab.
 */
import Link from "next/link";
import { getSeoStates } from "@/lib/seo/states";
import { ContactModal } from "./ContactModal";

function ColTitle({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        margin: "0 0 var(--space-sm)",
        fontSize: "var(--type-caption)",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color: "var(--color-text-muted)",
      }}
    >
      {children}
    </p>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="cc-footer-link"
      style={{
        display: "inline-flex",
        alignItems: "center",
        minHeight: 36,
        fontSize: "var(--type-subheading)",
        fontWeight: 500,
        color: "var(--color-text-secondary)",
        textDecoration: "none",
      }}
    >
      {children}
    </Link>
  );
}

export function Footer() {
  const states = getSeoStates();

  return (
    <footer
      style={{
        borderTop: "1px solid var(--color-border-stone)",
        backgroundColor: "var(--color-trust-surface)",
        padding: "var(--space-xxl) 0 var(--space-xl)",
        marginTop: "var(--space-xxl)",
      }}
    >
      <div className="cc-container">
        <div className="cc-footer-grid">
          {/* Brand + promise */}
          <div>
            <p
              style={{
                margin: 0,
                fontSize: "16px",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: "var(--color-text-primary)",
              }}
            >
              Cliff
              <span style={{ color: "var(--color-cta-hover-amber)" }}>Check</span>
            </p>
            <p
              style={{
                margin: "var(--space-xs) 0 0",
                fontSize: "var(--type-subheading)",
                fontWeight: 600,
                color: "var(--color-text-primary)",
              }}
            >
              A raise should never make you poorer.
            </p>
            <p
              style={{
                margin: "var(--space-sm) 0 0",
                maxWidth: "38ch",
                fontSize: "var(--type-caption)",
                lineHeight: 1.6,
                color: "var(--color-text-secondary)",
              }}
            >
              Everything is calculated on your device. No account, no email, no
              tracking of your finances. Nothing you type is sent anywhere.
            </p>
          </div>

          {/* Learn */}
          <nav aria-label="Learn">
            <ColTitle>Learn</ColTitle>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <FooterLink href="/why">Why this happens</FooterLink>
              <FooterLink href="/methodology">How we know</FooterLink>
              <ContactModal />
            </div>
          </nav>

          {/* State guides — auto-tracks supported states */}
          <nav aria-label="State guides">
            <ColTitle>State guides</ColTitle>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {states.map((s) => (
                <FooterLink key={s.code} href={`/benefits-cliff/${s.slug}`}>
                  {s.label} benefits cliff
                </FooterLink>
              ))}
            </div>
          </nav>
        </div>

        {/* Bottom bar: provenance + disclaimer left, the PAPI badge right. */}
        <div
          className="cc-footer-bottom"
          style={{
            marginTop: "var(--space-xl)",
            paddingTop: "var(--space-lg)",
            borderTop: "1px solid var(--color-border-stone)",
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: "var(--type-caption)",
                lineHeight: 1.6,
                color: "var(--color-text-secondary)",
              }}
            >
              Every number comes straight from government data: USDA, IRS, HUD,
              and Medicaid. More states on the way.
            </p>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "var(--type-caption)",
                color: "var(--color-text-muted)",
              }}
            >
              CliffCheck is an information tool, not financial or legal advice.
            </p>
          </div>

          {/* Prominent, on purpose: the PAPI badge (lead-gen). */}
          <a
            href="https://getpapi.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="cc-papi-badge"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--space-xs)",
              minHeight: 44,
              padding: "0 var(--space-md)",
              borderRadius: "999px",
              border: "1.5px solid var(--color-brand-amber)",
              backgroundColor: "var(--color-surface-cream)",
              color: "var(--color-text-primary)",
              fontSize: "var(--type-subheading)",
              fontWeight: 700,
              textDecoration: "none",
              whiteSpace: "nowrap",
              alignSelf: "flex-start",
              transition: "background-color var(--motion-fast) var(--ease-standard)",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 7,
                height: 7,
                borderRadius: "999px",
                backgroundColor: "var(--color-brand-amber)",
              }}
            />
            Built with PAPI
            <span aria-hidden="true" style={{ color: "var(--color-cta-hover-amber)" }}>
              ↗
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}
