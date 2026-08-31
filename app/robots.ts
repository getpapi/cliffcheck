import type { MetadataRoute } from "next";

/**
 * robots.txt (Next App Router file convention → served at /robots.txt).
 * CliffCheck is fully public and wants to be crawled everywhere. Points crawlers
 * at the sitemap so new per-state pages (programmatic SEO) get discovered fast.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://cliffcheck.com/sitemap.xml",
    host: "https://cliffcheck.com",
  };
}
