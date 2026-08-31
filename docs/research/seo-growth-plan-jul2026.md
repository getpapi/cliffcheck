# CliffCheck — Programmatic SEO & Growth Plan
> Last reviewed: task-175 — 01-08-2026

Source: marketing subagent (`.claude/agents/marketing.md`) run 03–04 Jul 2026, grounded in the real `lib/engine/` output, `PRODUCT.md`/`DESIGN.md`, and the `_shared/marketing-pack` skills (programmatic-seo, seo-audit, ai-seo, schema, site-architecture). Triggered by a Reddit r/texas traffic wave. This doc is the detailed scope for the replatform PLAN's **Cycle E — SEO state pages** (re-homes the stalled **task-103**).

**Already shipped (this session, live on cliffcheck.com):** OG/Twitter `summary_large_image` cards (1200×630 via `app/opengraph-image.png` + `app/twitter-image.png`), `metadataBase` + canonical + `title.template`, `app/robots.ts` + `app/sitemap.ts` (were 404), and baseline security headers (`X-Frame-Options: DENY` etc.). Those are table-stakes; everything below is the compounding growth engine.

---

## The core insight

CliffCheck's per-state benefits engine is **product-derived proprietary data** — no competitor has a per-state benefits-cliff calculator, and `getEffectiveTakeHome` produces a **different, true, dramatic number for every (state × family × income)**. This is the rare programmatic-SEO case where scale and quality don't trade off: every generated page carries a real, page-unique, shocking number, so thin/doorway-page risk is structurally avoided.

Engine-true figures (family of 4, 2 adults, computed from the live engine):

| State | Worst raise-cliff | Effective loss | Safe exit | Distinctive fact |
|---|---|---|---|---|
| Ohio | +$6k at $44k→$50k | **−$20,565** | $84k | Childcare (PFCC) falls off ~$47k; safe exit far away |
| Texas | +$2k at $65k→$67k | **−$15,902** | $66k | **Medicaid gone above ~$5k** (non-expansion) — no adult coverage |
| Michigan | +$2k at $65k→$67k | **−$15,902** | $66k | Detroit childcare (CDC) $14,800 drops in one $2k step |
| North Carolina | +$2k at $65k→$67k | **−$13,602** | $66k | Expanded Medicaid 2023; childcare (SCCAP) cliff |

Single-parent (family of 3, 1 adult) cliffs are worse: OH −$20,505, TX/MI −$16,593, NC −$14,533. Numbers are distinct per state → each page is genuinely differentiated.

## URL structure (subfolders on the apex — consolidates domain authority)

```
/benefits-cliff/[state]                 ← STATE HUB (pillar)      e.g. /benefits-cliff/texas
/benefits-cliff/[state]/[spoke]         ← PROGRAM or HOUSEHOLD SPOKE, one segment
                                           e.g. /benefits-cliff/texas/medicaid (program)
                                           e.g. /benefits-cliff/ohio/single-parent (household)
/guide/[topic]                          ← NATIONAL GLOSSARY/HUB    e.g. /guide/what-is-a-benefits-cliff
```

> **Shipped (task-175, C25):** the household scenario spoke is live. Next.js forbids
> two differently-named dynamic siblings, so the program spoke and the household
> spoke share ONE dynamic segment `[spoke]`: the page resolves the slug as a program
> (`resolveSpoke`, lib/seo/states.ts) or a household archetype (`resolveHousehold`,
> lib/seo/households.ts), else 404. The flat URL from this plan is preserved. Both
> tiers keep the same anti-thin cliff gate; adding a `states/*.ts` file or a
> `HOUSEHOLDS` entry grows the set automatically.

Full state name (not code) in the URL; lowercase, hyphenated; hub-and-spoke internal linking so every page is ≤2 clicks from `/` and reinforces the "benefits cliff" topical cluster. No subdomains (would split authority).

## Page templates → query → engine data

- **Template A — State hub** `/benefits-cliff/[state]`: targets "benefits cliff [state]", "how much can I make before I lose benefits in [state]". Fuel: `getHeroScenarios(code)`, `getEffectiveTakeHome` scenario table (hero number + safe exit), `getStateSources(code)` (gov citations), program edges from `getCliffData(code)`. On-page: H1 with the state, engine number in first 100 words, interactive cliff chart, "what you can earn before each benefit drops" table, manager-brief CTA, source chips, links to all spokes + neighbouring states.
- **Template B — State × Program spoke** `/benefits-cliff/[state]/[program]` (densest long-tail vein, ~5 programs/state): targets "how much can I earn before I lose SNAP in [state]", "[state] medicaid income limit family of 4", "childcare subsidy income limit [state]". Fuel per program: SNAP `grossLimitFPL`×FPL exact limit; Medicaid expansion flag (the TX $5k killer); childcare entry/exit FPL + `subsidyName`; housing payment standard + AMI cutoff; EITC phase-out.
- **Template C — National guide** `/guide/[topic]`: targets "what is a benefits cliff", "will a raise make me poorer". Definitional + a live engine-worked example (Ohio −$20,565). Top-of-funnel + strongest AI-citation target; links down to all state hubs.

## Page-count math & priority

| Phase | Template | Count |
|---|---|---|
| P1 (now, TX first) | State hub | 4 (4 states) |
| P1 | State × Program spoke | ~20 (4×~5) |
| P1 | National guide/glossary | 4–6 |
| P2 | State × Household scenario | ~24 (4×~6) |
| P3 (scales w/ engine) | +new states | ~12 pages per new `states/XX.ts` |

**P1 ≈ 30 pages.** The flywheel: every state file the team adds mints ~12 indexed pages for free via `generateStaticParams`. **Priority: Texas first** (live traffic) — TX hub + Medicaid/SNAP/childcare spokes, then `/guide/what-is-a-benefits-cliff`, then Ohio, then MI + NC.

## Next.js App Router mechanism

- Routes: `app/benefits-cliff/[state]/page.tsx`, `app/benefits-cliff/[state]/[spoke]/page.tsx` (program + household dispatch), `app/guide/[topic]/page.tsx`, plus `lib/seo/states.ts` (slug↔`StateCode` + program list) and `lib/seo/households.ts` (household archetypes).
- `generateStaticParams` returns the cartesian product from the engine registry (`getSupportedStates()` × filtered program list) → **page supply auto-tracks engine coverage**.
- **SSG (static)** — rule tables change only on a `states/*.ts` edit, which redeploys anyway. Fast, cacheable, crawl-friendly; matches the budget-Android audience.
- `generateMetadata` per route: unique keyword-first title (≤60), unique description with the real number (≤160), self-referencing canonical via `metadataBase`, per-page OG image.
- Internal linking hub-and-spoke; map `generateStaticParams` output into `app/sitemap.ts`; `BreadcrumbList` on spokes.
- **Anti-thin guardrail:** if a (state, program) combo produces no cliff, omit it from `generateStaticParams` — don't mint a hollow page.

## AI-SEO / AEO (get cited by ChatGPT / Perplexity / AI Overviews)

- **Structure:** lead each page with a 40–60 word standalone-citable answer block (engine-derived); H2/H3 phrased as the query verbatim; a `<table>` per state; an FAQ block.
- **Authority:** every number carries its inline `.gov` source (provenance module already enforces `.gov`); visible "Last reviewed: [date]" freshness stamp; `/methodology` page (already live) as the sourcing anchor.
- **Presence:** ship `/llms.txt` (site overview + mission + state links — does not exist yet); keep robots wildcard-open (GPTBot/PerplexityBot/ClaudeBot/Google-Extended allowed — do NOT tighten); Reddit threads are themselves AI-citation surface.
- Build artifact: reusable `<AnswerBlock>` + `<CliffFAQ>` components dropped into every template.

## Schema / structured data (JSON-LD, server-rendered)

- `/` → `WebApplication` (`applicationCategory: FinanceApplication`, `$0 Offer`) + `Organization` (sameAs → GitHub).
- State hub + program spokes → `FAQPage` (fed by the on-page FAQ) + `BreadcrumbList`.
- `/guide/*` → `Article`/`DefinedTerm` + `FAQPage`.
- **Do NOT** use `Product`/`AggregateRating`/`Review` (no reviews, nothing for sale — faking it risks a manual action).
- Build artifact: `lib/seo/jsonld.ts` typed builders (`webApplicationLd`, `faqLd`, `breadcrumbLd`, `articleLd`).

## Additional technical SEO (beyond today's table-stakes)

1. **Per-page dynamic OG images** (`opengraph-image.tsx` via `ImageResponse`) baking the real cliff number + state into the card ("Texas: a $2k raise can cost you −$15,900"). The shareable half of pSEO — highest missing lever.
2. Programmatic sitemap (map all `generateStaticParams` output); split by type once counts grow.
3. Keep pSEO pages static to inherit the confirmed CDN-cached fast TTFB; reserve the chart's `aspect-ratio` box to protect CLS.
4. Descriptive `alt` text on chart/OG images.
5. Breadcrumb UI (not just schema).
6. Re-verify `/robots.txt` + `/sitemap.xml` serve real content post-deploy (done — both live).
7. `/methodology` (live) + `/llms.txt` in the sitemap.

## Right-now moves for the live Reddit wave (24–48h)

1. **Ship the Texas hub + Texas/Medicaid + Texas/SNAP + Texas/childcare spokes first** — give r/texas traffic Texas-specific shock numbers + link-worthy assets.
2. Reply in the live thread with the concrete Texas number (family of 4, $65k→$67k ≈ −$15,900, mostly childcare; TX Medicaid ends far earlier than people expect), value-first, privacy-forward, link to the free no-signup tool.
3. Share per-state OG cards as image replies once dynamic OG ships.
4. Seed adjacent subreddits (r/personalfinance, r/povertyfinance, r/foodstamps, r/Medicaid) **only as genuine answers** to real "should I take this raise" questions.
5. **Do NOT** add any email capture / "get your report" / newsletter to ride the wave — it violates the privacy spine. Earn the share + backlink, not the lead.

## Build-task-ready artifact list (for the next plan → Cycle E / task-103)

1. `lib/seo/states.ts` — slug↔`StateCode` map + per-state program list (filters non-applicable; flags TX Medicaid non-expansion).
2. `lib/seo/jsonld.ts` — typed JSON-LD builders.
3. `app/benefits-cliff/[state]/page.tsx` + static params + metadata + dynamic OG — **Template A**.
4. `app/benefits-cliff/[state]/[spoke]/page.tsx` + static params + metadata + dynamic OG — **Template B (program spoke)** and **Template D (household spoke, task-175)**, both dispatched from the one `[spoke]` segment.
5. `app/guide/[topic]/page.tsx` — **Template C**, starting `what-is-a-benefits-cliff`.
6. `<AnswerBlock>` + `<CliffFAQ>` reusable components (→ FAQPage schema).
7. `app/sitemap.ts` — map all generated URLs.
8. `app/llms.txt` + `/methodology` (methodology already live) in sitemap.
9. Breadcrumb UI wired to `BreadcrumbList` schema.
10. **Wave-priority sub-task:** Texas hub + 3 Texas spokes ahead of the rest.

**Constraints (hard):** no email capture / gating / paywalls (privacy spine; donation-only). All copy within PRODUCT.md approved words ("cliff", "raise", "take-home", "safe exit", "benefits") — never "threshold", "phase-out", "ineligible", "FPL", "MAGI". Mobile-first, plain language. Private repo (post-hackathon), not open source.
