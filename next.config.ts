import type { NextConfig } from "next";

/**
 * CliffCheck — full SSR/SSG on Vercel.
 *
 * Deliberately NO `output: 'export'`: the re-platform wants dynamic OG images
 * and ISR per-state SEO pages (docs/replatform/PLAN.md §"Migration & deploy").
 * The old VibesOS "no build step / static export / GitHub Pages" rules are void.
 */
/**
 * Baseline security headers applied to every route. The live site previously sent
 * only HSTS (Vercel default); these close the gaps a July 2026 audit flagged.
 * `X-Frame-Options: DENY` is the one that matters most for this audience —
 * it blocks the site being iframed under a phishing/clickjacking overlay, a real
 * risk when a viral link points low-income users at a financial tool. If an
 * embeddable calculator widget is ever built, give it a dedicated route that
 * overrides frame-ancestors rather than loosening this global default.
 */
/**
 * Content-Security-Policy in REPORT-ONLY mode (task-127). This is deliberately
 * non-blocking: browsers log violations to the console and to any report-to
 * endpoint but render the page normally, so it CANNOT break the live site. It
 * buys an observation window before a later cycle flips this to an enforcing
 * `Content-Security-Policy` header once the violation reports come back clean.
 *
 * Allowlist covers 'self', Next.js's injected inline bootstrap scripts + inline
 * styles ('unsafe-inline' — the report-only pass will tell us whether a nonce
 * pipeline is worth it before enforcing), and Vercel Analytics + Speed Insights
 * (first-party `/_vercel/*` proxy on Vercel, with the raw hosts as a fallback).
 */
const cspReportOnly = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self' https://va.vercel-scripts.com https://vitals.vercel-insights.com",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "Content-Security-Policy-Report-Only", value: cspReportOnly },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
