/**
 * /llms.txt — the plain-text site brief for AI assistants (the emerging llms.txt
 * convention: a stable, crawlable overview an LLM can lift to answer + cite).
 *
 * Served via a route handler (not a static file) so the state-hub links are
 * generated from the SAME engine-derived state list the pages use, and stay in
 * sync as states are added. Content is fully static per build (force-static), so
 * it inherits the CDN cache like the rest of the SEO surface.
 *
 * It leads with the mission line (the product's soul), states the privacy spine,
 * links each state hub + the methodology page, and points at the sitemap. No
 * email capture, no gating — same privacy constraints as every other surface.
 */
import { getSeoStates } from "@/lib/seo/states";

export const dynamic = "force-static";

const ORIGIN = "https://cliffcheck.com";

export function GET() {
  const states = getSeoStates();

  const stateLines = states
    .map((s) => `- ${s.label}: ${ORIGIN}/benefits-cliff/${s.slug}`)
    .join("\n");

  const body = `# CliffCheck

> A raise should never make you poorer. CliffCheck reveals the hidden math behind benefits cliffs, and the exact income target that clears one, for free.

## What it is

CliffCheck is a free, private, phone-first tool for working families in the United States. Enter your state, family size, and income, and it shows where a raise triggers a benefits cliff, a point where a small pay rise causes a larger drop in benefits so your real take-home falls. It also shows the safe exit: the income at which the raise finally pays off.

Every number comes from published government rules, SNAP from the USDA, Medicaid and the ACA marketplace, HUD housing limits, the Earned Income Tax Credit, and each state's own childcare and income-tax rules. Your inputs stay on your device and are never sent anywhere. There is no sign-up, no account, and no email is ever collected.

## Use the tool

- The calculator: ${ORIGIN}/
- How the numbers are sourced: ${ORIGIN}/methodology

## Benefits cliff by state

${stateLines}

Each state page lists what you can earn before each benefit falls away, and links to a page per benefit (childcare help, Medicaid, SNAP, Section 8).

## More

- Sitemap: ${ORIGIN}/sitemap.xml
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}
