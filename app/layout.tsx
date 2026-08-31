import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SiteChrome } from "@/components/chrome/SiteChrome";
import { WebMcpRegistrar } from "@/components/WebMcpRegistrar";

/**
 * Root layout. System-font stack only — DESIGN.md bans custom font loading
 * (target users are on cheap Android phones with variable font rendering, so
 * fast + readable wins). The font stack lives in --font-sans (app/globals.css);
 * no next/font import here by design.
 *
 * Renders the shared SiteChrome shell (Header + TrustBadge + Footer) around all
 * pages (task-116). Landing (task-117) and calculator (task-118) render as
 * `children` inside this frame.
 */
/**
 * `metadataBase` makes every OG/Twitter image + canonical URL absolute (required
 * for social cards to resolve). The OG/Twitter card images are code-generated at
 * 1200×630 by `app/opengraph-image.tsx` + `app/twitter-image.tsx` via next/og
 * (both share the JSX in `app/_og/card.tsx`) — no manual image URL needed, and
 * the frame can never overflow the way the old committed PNGs did.
 * `title.template` gives future per-state programmatic-SEO pages a consistent
 * `<page> · CliffCheck` title.
 */
/**
 * Google site-verification token for a Search Console URL-prefix property,
 * read from env so no token is committed to source. Empty/unset → the
 * `verification` field below is omitted entirely (no meta tag, no crash).
 * NEXT_PUBLIC_ is deliberate: the token is public by design (it renders in the
 * document head). Not required when the domain is verified via DNS (domain
 * property) — this is the code-side hook for the URL-prefix route.
 */
const googleSiteVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL("https://cliffcheck.com"),
  title: {
    default: "CliffCheck: see what a raise really costs you",
    template: "%s · CliffCheck",
  },
  ...(googleSiteVerification
    ? { verification: { google: googleSiteVerification } }
    : {}),
  description:
    "A raise should never make you poorer. CliffCheck reveals the hidden math behind benefits cliffs and the exact income target to clear one. Free, private, and your data never leaves your phone.",
  applicationName: "CliffCheck",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "CliffCheck",
    url: "https://cliffcheck.com",
    title: "CliffCheck: see what a raise really costs you",
    description:
      "A raise should never make you poorer. See exactly where a raise triggers a benefits cliff — and the income target that clears it. Free, private, on-device.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "CliffCheck: see what a raise really costs you",
    description:
      "A raise should never make you poorer. See where a raise triggers a benefits cliff — and the income target that clears it.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SiteChrome>{children}</SiteChrome>
        {/* Registers the CliffCheck benefit engine as WebMCP tools for in-browser
            agents. Client-only, no-ops without WebMCP, sends nothing off-device. */}
        <WebMcpRegistrar />
        {/* Privacy-first analytics (AD-1): cookieless, no PII. Tracks pathname +
            aggregate engagement only — never the URL-hash scenario values or any
            financial input. No-ops off Vercel. */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
