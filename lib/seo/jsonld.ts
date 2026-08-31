/**
 * lib/seo/jsonld.ts — typed JSON-LD builders for the programmatic-SEO pages.
 *
 * Structured data is how CliffCheck earns rich results + AI-Overview/Perplexity
 * citations. We emit ONLY schema types that are true for this product:
 *
 *   • WebApplication  — the free, no-signup tool ($0 offer)
 *   • Organization    — CliffCheck itself (sameAs → its canonical home)
 *   • FAQPage         — fed by the on-page CliffFAQ (question-phrased H-tags)
 *   • BreadcrumbList   — the spoke breadcrumb trail
 *   • Article          — the hub/spoke as a dated, sourced explainer
 *
 * We deliberately DO NOT emit Product / AggregateRating / Review: nothing is for
 * sale and there are no reviews, so faking those risks a manual action (per the
 * SEO plan doc). These builders return plain objects; the page serializes them
 * into a <script type="application/ld+json">.
 *
 * Pure + framework-free. No dollar values are hand-typed here — callers pass the
 * engine-derived facts in.
 */

/** Canonical site origin, mirrored from metadataBase in app/layout.tsx. */
export const SITE_ORIGIN = "https://cliffcheck.com";
const ORG_NAME = "CliffCheck";

/** A JSON-LD node is a plain JSON object; typed loosely on purpose (schema.org
 *  shapes are open). Builders return these; the page wraps them in @context. */
export type JsonLd = Record<string, unknown>;

/** Wrap one or more nodes with the schema.org context for a single <script>. */
export function jsonLdGraph(...nodes: JsonLd[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@graph": nodes,
  };
}

/**
 * WebApplication node for the free tool. `applicationCategory: FinanceApplication`
 * + an explicit $0 Offer communicate "free finance tool" to search + assistants.
 */
export function webApplicationLd(): JsonLd {
  return {
    "@type": "WebApplication",
    "@id": `${SITE_ORIGIN}/#webapp`,
    name: ORG_NAME,
    url: `${SITE_ORIGIN}/`,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    browserRequirements: "Requires JavaScript.",
    description:
      "A free, private tool that shows where a raise triggers a benefits cliff, and the income target that clears it. Your data never leaves your phone.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    isAccessibleForFree: true,
    publisher: { "@id": `${SITE_ORIGIN}/#org` },
  };
}

/** Organization node for CliffCheck. `sameAs` points at the canonical home (the
 *  product is private, so no source-code link is claimed). */
export function organizationLd(): JsonLd {
  return {
    "@type": "Organization",
    "@id": `${SITE_ORIGIN}/#org`,
    name: ORG_NAME,
    url: `${SITE_ORIGIN}/`,
    description:
      "CliffCheck reveals the hidden math behind benefits cliffs, and the income target that clears one.",
    sameAs: [SITE_ORIGIN],
  };
}

/** A single FAQ entry. `question` and `answer` are plain strings (the answer is
 *  rendered as text; keep it self-contained + engine-derived). */
export interface FaqEntry {
  question: string;
  answer: string;
}

/** FAQPage node. Feeds off the exact same entries the on-page CliffFAQ renders,
 *  so the visible content and the structured data never drift. */
export function faqLd(entries: FaqEntry[]): JsonLd {
  return {
    "@type": "FAQPage",
    mainEntity: entries.map((e) => ({
      "@type": "Question",
      name: e.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: e.answer,
      },
    })),
  };
}

/** A breadcrumb trail item (name + absolute or root-relative url). */
export interface Crumb {
  name: string;
  /** Root-relative path (e.g. "/benefits-cliff/texas") or absolute URL. */
  path: string;
}

/** BreadcrumbList node. Positions are 1-indexed; paths are resolved absolute. */
export function breadcrumbLd(crumbs: Crumb[]): JsonLd {
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: c.path.startsWith("http") ? c.path : `${SITE_ORIGIN}${c.path}`,
    })),
  };
}

/** Inputs for the Article node (the page as a dated, sourced explainer). */
export interface ArticleLdInput {
  headline: string;
  description: string;
  /** Root-relative path of the page, resolved absolute for url/mainEntityOfPage. */
  path: string;
  /** ISO date the underlying rules were last checked (engine provenance). */
  dateModified?: string;
  /** Absolute OG image URL, if the route ships one. */
  image?: string;
}

/**
 * Article node. `about: benefits cliff` reinforces the topical cluster; the
 * publisher/author is the Organization node. dateModified surfaces the freshness
 * the AEO plan wants. No AggregateRating/Review is ever attached.
 */
export function articleLd(input: ArticleLdInput): JsonLd {
  const url = input.path.startsWith("http")
    ? input.path
    : `${SITE_ORIGIN}${input.path}`;
  const node: JsonLd = {
    "@type": "Article",
    headline: input.headline,
    description: input.description,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    about: { "@type": "Thing", name: "benefits cliff" },
    author: { "@id": `${SITE_ORIGIN}/#org` },
    publisher: { "@id": `${SITE_ORIGIN}/#org` },
    isAccessibleForFree: true,
  };
  if (input.dateModified) node.dateModified = input.dateModified;
  if (input.image) node.image = input.image;
  return node;
}

/**
 * Serialize a JSON-LD object for injection. React escapes text nodes, but `<`,
 * `>`, and `&` inside a raw <script> block must be sanitised so a stray sequence
 * cannot break out of the script element. We only ever pass builder output
 * (controlled shapes), but sanitise defensively.
 */
export function serializeJsonLd(node: JsonLd): string {
  return JSON.stringify(node)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}
