# CliffCheck — Benefits Cliff Navigator

> Last reviewed: Cycle 26 strategy review — 08-08-2026

## North Star
Every low-income worker understands exactly what a raise will cost them before they say yes or no.

## Problem Statement
Millions of working-class families are trapped in benefits cliffs — income thresholds where a modest raise causes a disproportionate loss of government benefits (SNAP, Medicaid, Section 8, childcare subsidies). A modest raise can cost far more than it pays. The math is deliberately hidden by fragmented benefit systems, and no consumer-facing tool exists to reveal it. This is the #1 mechanism that keeps the "permanent underclass" permanent.

## Solution
A phone-first web app that lets users input their family situation and current benefits, then visualizes exactly where the cliffs are — and what to do about them.

**Core flow:**
1. User enters: state (16 live), family size, adult count, current income (annual salary or hourly rate × hours), and which benefits they currently receive (SNAP/Medicaid/Section 8/childcare subsidy/employer health insurance)
2. Real-time inputs reshape the cliff chart as income changes — no submit step
3. Interactive chart reveals every cliff point, with a dominant-cause label on the steepest drop and per-boundary markers for each program that dies
4. Safe exit income displayed as hero output with a plain-English verdict sentence
5. Shareable manager brief for salary-negotiation conversations, plus a share-scenario link (URL hash, no account)
6. Advanced levers (HSA, pre-tax 401(k) + employer match, dependent-care FSA) and a dual-income "should adult 2 work?" mode reshape the cliff in real time

## Demo Scenario
**Ohio warehouse worker** — two-adult household, two children, $44k wages. Offered promotion to $70k.
- Loses SNAP, Medicaid, and most childcare (PFCC) support; incurs ACA premiums (partially offset by the cost-sharing reduction at 200–250% FPL); Ohio state tax rises; most of the federal EITC phases out; FICA and progressive federal income tax take a larger share of the higher wage.
- Net: a $26k raise leaves them **~$14,600 worse off** in all-in take-home (pay + benefits, after all taxes; engine-true -$14,636).
- Safe exit: ~$99k (first income where effective take-home clears the current level with a buffer).
- The $44k→$48k range is the sharpest danger zone — the PFCC childcare phase-out dominates the cliff shape.
- All figures are engine-derived (`lib/engine/*`), not hand-typed, so the demo, the OG card, and the state pages never drift.

## Target Users
**Primary:** Working-class earners in the $40k–$80k band navigating benefits cliffs — warehouse workers, retail staff, gig workers, single parents. Mobile-primary, financially stressed, justifiably wary of cloud apps with financial data.
**Secondary:** Social workers, benefits counselors, HR professionals advising employees — need a credible, shareable tool to explain cliff math to workers and management. This is the beachhead for the B2B revenue track (see Monetization Posture).
**Emerging:** Households on non-wage income — VA disability compensation (6.5M recipients) and SSDI/SSI — whose cliffs sit further left on the wage axis because that income is counted by SNAP and Section 8 but invisible to federal tax, MAGI, and EITC. Research complete (`docs/research/veterans-benefits-income-treatment-findings.md`); engine support not yet built.

## Constraints
- **Stack:** Next.js 16 App Router + React 19 + TypeScript + Tailwind 4 + Recharts, deployed on Vercel. The calc engine (`lib/engine/*`) is pure, framework-free TS.
- **Privacy:** Local-first — financial inputs stay on-device (React state + URL-hash share), no cloud calc, no accounts, no persistence. This is a trust advantage for the target audience and a deliberate product spine, not an incidental choice.
- **Scope:** 16 states live — OH, TX, NC, MI, FL, GA, PA, NY, AZ, IL, CA, WA, VA, TN, MO, IN. Expanding toward 50 in accuracy-gated batches of ~8 per cycle (AD-9), sequenced by audience size, cliff severity, and primary-source data availability. The FED/STATES engine auto-scales the pSEO page supply off the state registry.
- **Repo:** Private (github.com/cathalos92/cliffcheck). The original hackathon build was MIT/open source; the re-platformed product is closed.
- **Phase:** Post-hackathon distribution + monetization (see Current Phase).

## Current Phase (Post-VibeJam — distribution + monetization)
Originally built for VibeJam 2026 (VibesOS track, **3rd place finish**); now in the post-hackathon distribution + monetization phase per AD-7.

- **Phase 1 — Accuracy-first credibility hardening (Cycles 10–13). COMPLETE.** Federal + state EITC, SNAP net-income test, ACA Cost-Sharing Reductions, state income tax, HSA/401(k) MAGI levers, employer match, employer-health toggle. Extended through C25–C26 with the federal Child Tax Credit and the net-paycheck fold (FICA + federal income tax modelled as one all-in after-tax number), which deepened the canonical cliff from -$9,754 to -$14,636 — a starker headline that is also more honest, since it is what a payslip actually shows.
- **Phase 2 — Distribution + monetization (active).** Two reinforcing tracks:
  - **Distribution:** URL-hash share + share-scenario button, the `/why` explainer and `/methodology` authority pages, machine-readable provenance, and a programmatic-SEO surface that auto-scales off the registry — `/benefits-cliff/[state]` hubs, program spokes, `/benefits-cliff/[state]/[household]` scenario spokes, and `/guide` topics (~48 pages in the sitemap). Organic pushes validated via r/ohio (56k views / 120 shares). Google Search Console verified on the domain 2026-07-31 — the first instrument able to read SEO impressions and rankings.
  - **Monetization:** ethical revenue paths under AD-8 guardrails. Settled by the task-101 research (closed C14): **B2B tooling for employers, nonprofits and benefits counselors is the revenue engine, not consumer ads.** The first capture surface shipped in C25 at the manager-brief value peak, tagging leads `source=manager-brief-b2b` with a role. Analytics (Vercel Web Analytics + Speed Insights, AD-1) measures conversion in parallel.
- **Phase 3 — International. GATED** on measurable US phase-2 signal (AD-7). See Future Horizons.

## Future Horizons (deferred until US distribution + monetization prove out)
- **Horizon 2 — United Kingdom.** Universal Credit-driven cliff math: taper rate, work allowance, and savings limits. A clean-room engine build, not a US "state" addition — the FED/STATES rule pattern generalises but the welfare logic does not. Scoping spike tracked as task-104 (deferred; un-defers only on a Search Console readout confirming phase-2 signal).
- **Horizon 3 — Ireland.** JobSeeker's payments, HAP (Housing Assistance Payment), and the medical-card system. Its own horizon, sequenced after the UK build produces signal.

## Monetization Posture (AD-8)
Any monetization must NOT exploit the user's economic vulnerability. The audience is the exact user predatory financial products target (payday, debt consolidation, gambling, crypto), and default ad networks will serve those — so there is a hard prohibition list. **B2B tooling (employers, nonprofits, benefits counselors) is the revenue engine, not consumer ads.** The reputational risk of being associated with predatory categories outweighs the revenue from accepting them; the revenue model is subordinate to user trust. The free calculator is never gated, never paywalled, and never requires an email.

## Product Quality Bar
(Originally the VibeJam judging axes — retained as the standing quality lens now that judging is done.)
1. **Design** — Phone-first, accessible, empathetic. Warm stone/amber palette. Not a government form.
2. **Functionality** — Real FY2026 benefit calculations, real-time interactive cliff chart, actionable safe-exit output, multi-state coverage.
3. **Market viability** — No consumer product does this. Revenue paths: B2B employer/counselor tooling, premium-state licensing.
4. **Creativity** — Reveals the hidden truth that a raise can leave you poorer. The "oh shit" cliff chart moment.
5. **Technical sophistication** — Local-first privacy, FED/STATES rule engine, machine-readable provenance, source-verified data, engine-driven SEO surface.

## Key Differentiators
- **Nobody has built this consumer-facing.** Government tools (Atlanta Fed CLIFF) target workforce counselors, not workers.
- **Local-first = trust.** Target users are justifiably wary of sharing financial data with apps.
- **Actionable, not informational.** Don't just show the cliff — show the path around it with the manager brief and the lever explorer.
- **Honest to the payslip.** The headline number is all-in after all taxes, not a benefits-only abstraction — which made the cliff both starker and harder to argue with.
- **Visceral output.** The cliff chart is an "oh shit" moment. The drop is real and measured against primary sources cited on `/methodology`.

## Data Sources
- SNAP income limits and benefit tables (USDA FY2026)
- Medicaid eligibility per state (CMS, state Medicaid agencies)
- ACA marketplace premium tax credit logic (IRC §36B / IRS)
- Federal EITC (IRC §32) and Child Tax Credit (IRC §24 / IRS)
- FICA (OASDI + Medicare, with the OASDI wage cap) and federal income tax brackets (IRS)
- Section 8 / HCV payment standards and income limits (HUD)
- State childcare subsidy programs, one per covered state (state CCDF plans + NWLC)
- State income tax (flat and bracketed, per state revenue departments)
- Federal poverty guidelines (HHS FY2026)

Full per-program provenance is machine-readable in the engine (`lib/engine/provenance.ts`) and published at `/methodology`, with a per-state confidence badge disclosing approximation caveats.

## Architecture
- **Frontend:** Next.js 16 App Router, React 19, TypeScript
- **State:** React state (useReducer); profile shared via URL hash (`lib/profile-url.ts`) — no store, no localStorage, no accounts
- **Styling:** Tailwind CSS 4 on a shadcn foundation
- **Benefit engine:** Pure, framework-free TS in `lib/engine/*` — FED namespace for federal-uniform rules + per-state modules for state-specific rules, aggregated by `getEffectiveTakeHome`
- **Provenance:** `PROGRAM_PROVENANCE` and `STATE_PROGRAM_PROVENANCE` records at program/source granularity → `/methodology` citation page and the per-state confidence badge
- **Visualization:** Recharts cliff chart
- **SEO surface:** engine-backed programmatic pages that auto-scale off the state registry — state hubs, program spokes, household scenario spokes, and guide topics
- **Deploy:** Vercel (SSG/ISR); the only server route is the contact form (`app/api/contact`), which carries rate-limiting and a honeypot. Private repo.

## Live URL
**https://cliffcheck.com** (canonical; the old `cathalos92.github.io/cliffcheck` 301-redirects)

## Current Open Questions
- **Does the pSEO surface earn impressions?** ~48 pages are live; Search Console has been collecting since 2026-07-31 and has not yet been read. This gates AD-7 phase 3, task-104, and whether state batch 17–24 is worth building before depth work.
- **Is there B2B demand?** The manager-brief capture has been live since C25; lead volume is unread.
- **Which state is next?** Sequencing runs on ALICE-density priors with no revealed demand — visitors from the 34 uncovered states currently bounce without leaving a signal.
