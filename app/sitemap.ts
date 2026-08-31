import type { MetadataRoute } from "next";
import { allStateParams, allSpokeParams } from "@/lib/seo/states";
import { allHouseholdParams } from "@/lib/seo/households";
import { allTopicParams } from "@/lib/seo/guide";

/**
 * sitemap.xml (Next App Router file convention → served at /sitemap.xml).
 *
 * Core pages: the tool at `/`, the citation/methodology page at `/methodology`,
 * and the `/why` explainer (both static, press-facing inbound-link targets).
 * `/tool` 308-redirects to
 * `/`, so it is deliberately omitted — redirecting URLs don't belong in a sitemap.
 *
 * The programmatic-SEO pages are appended straight from the SAME
 * generateStaticParams source the routes use (allStateParams / allSpokeParams /
 * allTopicParams), so the sitemap tracks page supply exactly: adding a
 * states/XX.ts file grows the hubs + spokes, and adding a GUIDE_TOPICS entry grows
 * the glossary, AND their sitemap entries, all with zero change here. `/llms.txt`
 * (the AI-overview site brief) is listed too.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://cliffcheck.com";
  const lastModified = new Date();

  const core: MetadataRoute.Sitemap = [
    {
      url: `${base}/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/methodology`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/why`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/llms.txt`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  // State hubs (pillars) — one per supported state.
  const hubs: MetadataRoute.Sitemap = allStateParams().map(({ state }) => ({
    url: `${base}/benefits-cliff/${state}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  // Program spokes — states × applicable (cliff-passing) programs.
  const spokes: MetadataRoute.Sitemap = allSpokeParams().map(
    ({ state, program }) => ({
      url: `${base}/benefits-cliff/${state}/${program}`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    })
  );

  // Household scenario spokes — states × household archetypes (anti-thin filtered).
  // Share the [state]/[spoke] segment with the program spokes.
  const households: MetadataRoute.Sitemap = allHouseholdParams().map(
    ({ state, household }) => ({
      url: `${base}/benefits-cliff/${state}/${household}`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    })
  );

  // National glossary topics (Template C) — top-of-funnel definitional pages.
  const guides: MetadataRoute.Sitemap = allTopicParams().map(({ topic }) => ({
    url: `${base}/guide/${topic}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...core, ...hubs, ...spokes, ...households, ...guides];
}
