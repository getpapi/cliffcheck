# Analytics Readout — July 2026 (AD-7 measurement gate)
> Last reviewed: task-152 — 09-07-2026

**Purpose:** Pull the *real* Vercel Web Analytics numbers for cliffcheck.com into a durable
doc, so the AD-7 "measurable pSEO/Reddit signal" gate stops being asserted and starts being
read. Feeds [seo-growth-plan-jul2026.md](seo-growth-plan-jul2026.md) and the international
sequencing decision (task-104).

**Source:** Vercel Web Analytics REST API (`api.vercel.com/v1/query/web-analytics/*`),
cliffcheck project (`prj_LiiGD3x…`), Pro plan, queried 2026-07-09. Aggregate, no PII.

---

## The one caveat that governs everything

**Web Analytics went live on 2026-07-03** (commit `7c7275b`, "add Vercel Web Analytics +
Speed Insights"). There is **no traffic data before that date** — not because traffic was
zero, but because nothing was instrumented. The usable window is **6 days (Jul 3 → Jul 9)**.

Two direct consequences:
1. **The r/ohio spike (56k views / 120 shares, 2026-04-25) is unmeasurable.** It predates
   analytics by ~10 weeks. We cannot say how many site visits it drove. The "56k" was always
   a Reddit *impression* count, not a site-traffic number, and no site-side instrument existed
   to catch the click-through.
2. **The strategy review's premise needs a correction.** The C21 review said AD-1 shipped
   analytics and "no cycle read back a single number." True, but the reason is that analytics
   was only 6 days old at read time — not a multi-cycle discipline failure. The instrument is
   new; this doc is the first read.

Everything below is a **6-day snapshot**, far too short to judge SEO. Treat it as a baseline,
not a verdict.

---

## 1. Totals (Jul 3 – Jul 9, 2026)

| Metric | Value |
|--------|-------|
| Pageviews | **78** |
| Unique visitors | **64** |
| Days with any traffic | 7 (all since analytics go-live) |
| Rough run-rate | ~9–11 visitors/day |

## 2. Traffic by page — the pSEO finding

| Route | Visitors | Pageviews |
|-------|----------|-----------|
| `/` (calculator / home) | 62 | 74 |
| `/why` | 1 | 1 |
| **Every pSEO page** (`/benefits-cliff/*`, `/guide/*`) | **0** | **0** |

**~99% of all traffic lands on the homepage. Not one visit to any of the ~40 state-hub or
program-spoke pSEO pages, or the NY surface, in the window.**

Honest read: 6 days is far too short for organic search to surface these pages — Google needs
weeks to crawl, index, and rank new URLs, and a brand-new site has no domain authority yet.
This is **"no signal yet," not "pSEO failed."** But it does mean the pSEO ROI that gates
AD-7 is currently **unmeasured and unmeasurable from this tool alone** (see §5).

## 3. Referrers

| Referrer | Visitors |
|----------|----------|
| Direct / none | 48 |
| Reddit (`com.reddit.frontpage` 8 + `reddit.com` 6 + `old.reddit.com` 1) | **15** |

All 15 Reddit visitors, plus the bulk of direct traffic, arrived on **2026-07-03** (see §4) —
a single Reddit-driven day, all landing on `/`. Reddit is the only external referrer of note.
No Google/organic referrers appear yet (consistent with §2).

## 4. Daily trend

| Date | Pageviews | Visitors | Note |
|------|-----------|----------|------|
| Jun 9 – Jul 2 | 0 | 0 | pre-instrumentation (no data) |
| **Jul 3** | **56** | **48** | analytics go-live; Reddit + direct, 100% on `/` |
| Jul 4 | 3 | 2 | |
| Jul 5 | 3 | 2 | |
| Jul 6 | 2 | 2 | |
| Jul 7 | 7 | 6 | |
| Jul 8 | 4 | 2 | |
| Jul 9 | 3 | 2 | |

The Jul 3 spike is a one-day Reddit event on the homepage; the following days settle to a
low direct trickle (~2–6/day).

## 5. Geography & device

- **Country:** US 55 · ES 5 · LT 1 · PL 1 (ES/LT/PL almost certainly dev/self/bot noise).
- **Device:** mobile 40 / desktop 22 — **mobile-primary confirmed**, validating the
  phone-first design bet (persona is mobile-primary low-income workers).

---

## 6. AD-7 measurement-gate read

**Is there measurable pSEO signal yet? No — and it cannot be judged from a 6-day window.**
**Is there measurable Reddit signal? Barely — 15 visitors from one Jul-3 post, homepage-only.**

Implication for the NY-vs-broaden-vs-international sequencing:

- **International (task-104) stays deferred — now on evidence, not assumption.** The gate
  condition ("measurable pSEO/Reddit signal favouring expansion") is not met: pSEO is
  unmeasured and Reddit is a trickle. Expanding to the UK/IE would add surface with zero
  proof the existing surface converts. This is exactly the "building on faith" the review
  warned about.
- **Broadening to more US states is also unjustified right now** for the same reason —
  8 states already draw zero pSEO traffic; a 9th changes nothing until the existing ones rank.
- **The real blocker is instrumentation coverage, not more surface.** Vercel Web Analytics
  measures *traffic that already arrived* — it is blind to SEO *impressions and rankings*
  (whether Google is even indexing the pSEO pages). Six days in, the honest answer is "we
  don't yet know if the flywheel spins," and Web Analytics alone will never tell us.

## 7. Follow-up candidates (NOT submitted — pending owner confirmation)

1. **Add Google Search Console** (verify domain, submit sitemap) — the missing instrument.
   Web Analytics sees clicks; Search Console sees impressions, indexed-page count, and query
   rankings. Without it the pSEO gate is permanently unreadable. *Highest leverage.*
2. **Re-read this dashboard at ~30 and ~60 days** (Aug + Sep 2026) — the first window long
   enough for organic to show. Set a recurring check rather than a one-off.
3. **Instrument the NY news-peg push** — when the r/nyc / r/newyork distribution happens
   (marketing action), watch `referrerHostname` + the `/benefits-cliff/new-york` route to see
   if the peg converts to site visits, unlike the unmeasured April r/ohio event.
4. **Consider a lightweight `track()` custom event** on the calculator's core interaction
   (e.g. "cliff revealed") to measure engagement, not just pageviews — only if §1 volume grows
   enough to be worth it.

---

*Raw API pulls saved to the session scratchpad (not committed). Reproduce with
`api.vercel.com/v1/query/web-analytics/visits/{count,aggregate}` — teamId + projectId from
`.vercel/project.json`, token from the authed Vercel CLI.*
