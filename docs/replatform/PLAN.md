# CliffCheck Re-platform — Premium Rebuild (Canonical Plan)
> Last reviewed: cycle-14-pivot — 26-06-2026

> **Status:** Approved direction (Cycle 14 pivot, AD-2). This is the canonical multi-cycle reference for the re-platform. Each phase below maps to a PAPI cycle (plan → build → review). Source decision: AD-2 (Next.js hybrid re-platform), AD-1 (local-first mechanism update), AD-8 (monetization sequencing).

## Context

CliffCheck (cliffcheck.com) won 3rd at VibeJam 2026 and went front-page on r/ohio (300+ shares) from one post — real organic signal with a bare-bones UI. The goal now: a genuinely best-in-class free tool that helps people avoid benefits-cliff traps, designed to motionsites.ai quality, where the quality *itself* advertises PAPI ("wow — who built this? getpapi.ai"). Help-first; PAPI as proof, not as an ad.

**Audit findings:**
- **Engine is strong, keep it.** `index.html` (2,555 lines) has 7 gov-cited benefit programs (SNAP, Medicaid, ACA, EITC, Section 8, childcare, state tax), continuous phase-outs, 4 states (OH/TX/NC/MI), a real inline validation suite. Pure functions, no DOM/React coupling — extracts cleanly.
- **Design is the weak link.** Bare hero, no motion, flat institutional amber/stone. Single-file + Babel-in-browser + GitHub Pages caps the ceiling.
- **Two gaps vs the new goals:** (1) ACA % sourced to `thefinancebuff.com` (3P) — must swap to gov (IRC §36B / IRS Rev. Proc., already cited for EITC). (2) Provenance lives only in code comments — not shown to users.

**Decisions made:** Hybrid re-platform (keep engine, new Next.js shell). Move hosting GitHub Pages → Vercel. Same repo, flipped private. Add priority states alongside the current 4.

**Design identity (binding):** CliffCheck has its OWN soul, built for its demographic — mobile-primary working people facing benefits cliffs, on budget phones, justifiably wary of financial tools. Its identity is defined by CliffCheck's own `DESIGN.md`/`PRODUCT.md` (warm, honest, "a knowledgeable friend who tells you straight — not a government form"; stone/amber; the "Oh Shit" test). The premium upgrade *deepens that bespoke identity* — it does NOT import PAPI's look. From PapiUI we borrow ONLY the plumbing: Next.js/Vercel config, the palette-generation script pattern, Recharts, Vitest, and conventions. NOT the plum palette, NOT landing-b components, NOT its layouts. All visual/landing components are designed fresh for CliffCheck.

## Stack

Next.js 16 App Router + Tailwind 4 + Recharts 3.8 + Lucide + Vitest, on Vercel — matching PapiUI so plumbing transfers. Drop TinyBase (persistence-across-devices is explicitly out of scope; share-via-URL hash + `useReducer` covers everything). Calculator is a client island — financial data never leaves the device; marketing/state/methodology pages are server-rendered with zero user data. Analytics: Vercel Web Analytics + Speed Insights (AD-1).

## Directory shape

```
cliffcheck/                          # same repo, private
├── app/
│   ├── page.tsx                     # SERVER: rotating hero + landing + <Calculator/> island
│   ├── tool/page.tsx                # full-screen calculator (share-URL target)
│   ├── [state]/page.tsx             # SSG per-state SEO pages (generateStaticParams)
│   ├── methodology/page.tsx         # provenance table, generated from engine
│   ├── sitemap.ts · opengraph-image.tsx
├── lib/engine/                      # EXTRACTED ENGINE — pure, typed, framework-free
│   ├── index.ts (barrel) · types.ts · federal.ts · fpl.ts
│   ├── snap.ts aca.ts medicaid.ts childcare.ts housing.ts eitc.ts tax.ts
│   ├── takeHome.ts (orchestrator) · registry.ts · provenance.ts · scenarios.ts
│   ├── states/{oh,tx,nc,mi,...}.ts  # ADD A STATE = ADD A FILE
│   └── __tests__/                   # Vitest, converted from inline validateDemoScenario
├── lib/palette.ts · profile-url.ts  # tokens (PapiUI pattern) + URL-hash (extracted as-is)
├── components/{chrome,calculator,hero,landing,papi}/
├── docs/state-rules/*.md            # provenance source of truth — keep + extend
└── _archive/index.html              # original single-file build, preserved
```

## Engine extraction — the keystone

Pull inline pure functions + `FED`/`STATES` tables into typed TS modules (one file per program). UI imports only from `@/lib/engine`.

**Reconcile the contract:** CLAUDE.md claims a 7-field `getEffectiveTakeHome({state,familySize,annualIncome})`; the real function returns **13 fields** positionally. Adopt the documented **options-object signature**, keep the **richer 13-field return**. Key types:

- `TakeHomeInput` (income, familySize, state, + opts: adultCount, pfccEnrolled, hasVoucher, employerHealthInsurance, matchRate, hsaContribution, pretax401k)
- `TakeHomeBreakdown` (grossWages, magi, magiReduction, snapValue, medicaidValue, acaCost, acaCSRValue, section8Value, childcareValue, eitcValue, stateTaxOwed, matchValue, totalEffective)
- `Rule<T> = { value: T; prov: Provenance }`, `Provenance = { source, url, citation?, retrieved, note? }`

**Public API:** `getEffectiveTakeHome`, `getCliffData` (0–120k @ $1k), `getSupportedStates`, `isSupportedState`, `getStateSources`, `getHeroScenarios`.

**Data-driven states:** each `states/*.ts` is a typed `StateRules` object; `registry.ts` builds the map. Adding a state = adding a file + one validate test.

**Machine-readable provenance:** wrap every gov-sourced value in `Rule<T>` (transcribe existing comments — already present). `provenance.ts#collectSources(code)` dedupes by URL, groups by program, feeds both `/methodology` and inline `<SourceChip>`. **Build guard (Vitest):** assert every `prov.url` matches a gov host (`*.gov`, `federalregister.gov`, `irs.gov`, `huduser.gov`, `medicaid.gov`) — this mechanically kills the thefinancebuff source and prevents regressions.

**Tests:** convert the inline `console.assert` validation suite to Vitest (expected ranges are in the comments — free test suite). Get green *before* any UI.

## Rotating hero

`scenarios.ts#getHeroScenarios(code?)` runs the engine at build time over curated (currentIncome, offeredIncome, familySize) tuples per state, returns the dramatic ones. Server component passes them to a small client `<RotatingHero>` that crossfades (instant swap under `prefers-reduced-motion`). Renders: *"A $26,000 raise at $44,000 in Ohio would cost you $9,754."* Numbers come from the engine — never hand-typed, never drift.

## Provenance / methodology

1. **Inline `<SourceChip>`** beside each benefit line — "SNAP · USDA FY2026 ↗" linking to the gov URL (citation + retrieved date on hover/tap). Quiet caption styling.
2. **`/methodology` page** — table per program (rule → value → source → citation → gov link → date) + modelling assumptions, generated from the engine so it can't go stale.

## PAPI lead-gen (tasteful, help-first)

Footer "Built with PAPI" badge (→ getpapi.ai) + one honest colophon line on `/methodology` ("planned, built, and reviewed with PAPI — the process is as verifiable as the numbers"). **No PAPI CTA near the calculator** — financial-tool trust beats funnel. The tool being best-in-class is the ad. PAPI presence stays quiet and in CliffCheck's own visual voice — no plum, no PAPI-branded chrome on the page.

## Monetization (AD-8)

Sequenced: (1) **B2B** is the revenue engine — benefits counsellors, 211 navigators, employer/HR teams (never touches the vulnerable end-user); (2) **ethical affiliate** as zero-infra baseline now; (3) **sponsorship** once traffic proven; (4) **curated display ads deferred** to ~50k sessions/mo. Hard-prohibited categories per AD-8.

## Priority states

First wave (max cliff drama + reach, low data effort, exercises both expansion + non-expansion engine paths): **FL** (non-expansion, no income tax — sharpest Medicaid cliff), **GA** (non-expansion, high salience), **PA** (expansion, flat tax — fits engine cleanly). Second wave **CA, NY** require extending `calcStateIncomeTax` from flat to **bracketed** (engine's known gap, index.html ~line 564) — a *build* dependency, not a data drop. Don't promise them in the same cycle as FL/GA/PA. International (UK Universal Credit, Ireland JobSeeker's/HAP/medical card) are clean-room engine builds — separate horizons, deferred (AD-7 Phase 3).

## Phasing (PAPI cycles, plan → build → review)

> **RE-ORDERED (Cycle 16, owner direction): DESIGN comes before provenance.** Owner priority is design + true value FIRST (see [[project-mission-soul]]). The engine (Cycle A) already gives the calculator real numbers, so the full product redesign does NOT depend on provenance. Provenance (user-facing citations) follows the redesign. This corrects the original order, which wrongly sequenced invisible provenance plumbing ahead of the visible redesign.

- **A — Engine extraction & tests [BUILD]. ✅ DONE (Cycle 15, v0.15.0).** Next.js scaffold; `lib/engine/*`; 88 Vitest tests green; gov-URL guard. Engine importable, behaviour-exact.
- **B — FULL PRODUCT REDESIGN [DESIGN+BUILD]. ← Cycle 16.** The whole product to motionsites.ai quality, in CliffCheck's own bespoke identity (NOT a ported template). Brief-first:
  1. **Design-direction brief** (committed doc) — translate `DESIGN.md`/`PRODUCT.md` + the motionsites.ai reference into a concrete spec: art direction, motion language, premium type/layout/elevation/spacing system, component inventory, full-page narrative. This is the design guidance on the working tree that governs every surface.
  2. **Chrome + shell + extended tokens** — root layout, header, trust badge, quiet PAPI footer; motion/elevation tokens added to the palette system.
  3. **Landing page** — hero (rotating engine-driven stat), full narrative (the hidden math, why this happens, the inequality framing, r/ohio proof, methodology teaser, CTA into the tool), premium motion, mobile-first.
  4. **Calculator / tool** — the full interactive product designed to the SAME bar: input form, cliff chart (Recharts `stepAfter`, no smoothing), result cards (cliff alert / safe exit), manager brief, source chips (stub provenance OK), share-via-URL (`useReducer` + URL hash). The calculator is the product core — not a utility.
- **C — Provenance data model [DATA].** Wrap rules in `Rule<Provenance>`; swap ACA source to IRC §36B/IRS (removes the task-107 known-exception + flips the tripwire); build `/methodology` page; populate inline SourceChips. *(Was Cycle B.)*
- **D — SEO state pages + deploy [BUILD].** `app/[state]` SSG + sitemap; connect Vercel; preview QA; DNS cutover; archive `index.html`; flip private (keep public until Vercel green — no GitHub Pro); rewrite CLAUDE.md/README for new stack.
- **E — Priority states FL, GA, PA [DATA].** One state file + validate test each (states.test.ts sweep already scaffolds this).
- **F — Bracketed income tax + CA/NY [BUILD then DATA].**

Dependencies: B depends on A (done). C builds on B's SourceChips/methodology surface. E depends on the `states/` convention (done). CA/NY depend on F's bracketed-tax build.

## Migration & deploy

1. Confirm VibeJam open-source obligation has lapsed (submission complete Apr 2026; hackathon over) → flip repo private (`gh repo edit cathalos92/cliffcheck --visibility private`).
2. Branch; scaffold; port `lib/palette.ts` + `gen-palette` + CI palette guard from PapiUI.
3. Extract engine + tests → green first.
4. Build calculator, then landing/state/methodology.
5. Connect repo to Vercel; deploy preview; QA.
6. **DNS cutover at Squarespace:** drop GitHub Pages A records (`185.199.108-111.153`) + `cathalos92.github.io` CNAME; add Vercel apex `A 76.76.21.21` + `www CNAME cname.vercel-dns.com`; add domain in Vercel, issue cert. Keep Pages live until Vercel serves cliffcheck.com green, then disable Pages.
7. `next.config.ts`: full SSR/SSG (no `output: 'export'` — want dynamic OG + ISR state pages). Old "no build step / CDN-only" CLAUDE.md rules are VibesOS-specific and now void — rewrite.

**Keep:** `docs/`, git history, domain, LICENSE. **Archive:** `index.html` → `_archive/` (referenced in README as "v1 hackathon build").

## Verification

- `npm test` green on extracted engine vs documented expected ranges (Cycle A gate).
- Gov-URL provenance guard passes — no non-gov sources (kills thefinancebuff).
- Calculator: live updates, no submit button, step chart (no bezier), trust badge above fold, share-URL round-trips (encode → reload → same scenario).
- `/methodology` renders every program's sources from the engine; inline chips resolve to gov URLs.
- Vercel preview QA at 375px (primary), then desktop. Lighthouse pass.
- cliffcheck.com serves the new build over HTTPS post-cutover; old github.io 301-redirects.
</content>
</invoke>
