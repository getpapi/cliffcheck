# Changelog

## v0.26.0 — 2026-08-03

- f4521bf merge: feat/cycle-26-engine (cycle 26 — VA disability income-treatment research)
- 98eabd3 merge: feat/cycle-26-calculator (cycle 26 — hourly-wage mode + inline benefit flags)
- 3498702 merge: feat/cycle-26-core (cycle 26 — net-paycheck fold + OG de-hardcode + CTC finding)
- ff6fc3c docs(task-178): VA disability compensation income-treatment matrix (research)
- 15c7d64 feat(task-177): surface benefit flags inline; retire the More options fold
- f2975c1 feat(task-176): hourly-wage input mode ($/hr + hours/week) on the income card
- 76a6809 feat(task-181): fold FICA + federal income tax into the effective number (Option C)
- ae0f89e feat(task-179): derive OG card figures from the engine instead of hardcoding

## v0.25.0 — 2026-08-01

- 00b9175 merge: feat/cycle-25-core (cycle 25)
- 05080a4 docs(task-175): update SEO growth plan for the [spoke] route unification + shipped household tier
- f1b3e7b docs(task-162): reflect 16-state coverage (C25 batch AZ/IL/CA/WA/VA/TN/MO/IN)

## v0.24.0 — 2026-07-31

- cd62cd3 merge: feat/cycle-24-core (cycle 24)
- d1b0b10 feat(task-170): Delete dead legacy code: index.html (142KB v1 single-file build) + _archive/, and the redundant lib/engine/states/.gitkeep (8 real state files exist — already flagged as task-110) plus empty scaffold .gitkeeps (components/papi/.gitkeep, components/calculator/.gitkeep). The extracted lib/engine/* fully supersedes index.html; keeping it invites accidental edits and confuses docs (see the data-refresh-checklist drift). Verify nothing imports/serves index.html before removing. Folds in task-110. Reference: index.html; _archive/; task-110.
- 71b7a8e feat(task-171): Refresh the rotating hero-scenario seeds to cover all shipped states. lib/engine/scenarios.ts SEEDS + comments (scenarios.ts:6) only cover OH/TX/NC/MI though 8 states now ship (FL/GA/PA/NY missing), and getHeroScenarios(code) per-state filtering (scenarios.ts:124) is noted as a later-cycle stub partially superseded by lib/seo/states.ts. Regenerate seeds from the live engine for every supported state so the home rotator, OG cards, and any hero surface reflect current coverage and never go stale as states are added. Ideally derive seeds off the registry so future state batches auto-populate. Reference: lib/engine/scenarios.ts; lib/seo/states.ts; lib/engine/registry.ts.
- 01af158 feat(task-163): Fix childcare subsidy display-name coverage for all shipped states. InputForm.tsx (~line 41) hardcodes childcare-program labels only for OH/TX/NC/MI; the other 4 states (FL/GA/PA/NY) fall back to generic "a childcare subsidy" copy even though the engine computes their values. Add the program display name to each StateChildcareRules (subsidyName already exists in the type) and read it in the UI so every state shows its real subsidy name. Correctness fix that should ride along with the state-expansion work. Reference: components/calculator/InputForm.tsx; lib/engine/types.ts (StateChildcareRules.subsidyName); lib/engine/states/*.ts.
- 4e7f54b feat(task-161): Per-state "last-verified / confidence" badge (PREREQ for 50-state expansion). Build a visible per-state data-confidence badge BEFORE batch-filling states 9→50. Each state hub/spoke page + the calculator show source-capture date + a confidence signal, plus an honest note that SLCSP is a single-representative-metro approximation and childcare geometry is state-specific (~10% accuracy). Turns the accuracy caveat into a credibility signal so breadth scales without undercutting the trust spine. Reads capture dates from provenance/state-module comments; no new data model. Gates the state-batch program. Reference: docs/research/all-states-findings.md (§Architecture Risks); PRODUCT_BRIEF.md (AD-7 accuracy-first); lib/seo/states.ts; components/calculator/SourceChip.tsx.
- 0d30103 feat(task-169): Finish the half-built provenance layer (thread Rule<Provenance> per-value). types.ts:68 and :77 flag the provenance metadata + Rule<T> wrapper as "populated in a later cycle / not yet applied per-value", and federal.ts:5 notes its values "become the provenance source-of-truth in a later cycle". Complete it: attach Provenance to each federal + state rule value so /methodology and the per-state confidence badge (task-161) read structured, per-value sourcing instead of free-text comments. Also resolve the duplicate HeroScenario type (real one in scenarios.ts/states.ts vs the stub at types.ts:202-210). This underpins the credibility/accuracy story and unblocks the confidence badge. Reference: lib/engine/types.ts (Provenance, Rule<T>, HeroScenario stub); lib/engine/federal.ts; lib/engine/provenance.ts; app/methodology/page.tsx.
- 4ef1d7e docs: refresh CLAUDE.md + data-refresh-checklist for re-platform
- ea14a52 fix(og): force-static render for social card images

## v0.23.0 — 2026-07-31

- 1124ef9 merge: feat/cycle-23-ui (cycle 23)
- 6bdaddb merge: feat/cycle-23-core (cycle 23)
- b811eab merge: feat/cycle-23-landing (cycle 23)
- dd54c49 merge: feat/cycle-23-platform (cycle 23)
- 2307e71 feat(task-148): [Auto-triaged] (recurring, process): build_execute dependsOn/branch-reuse forked feat/cycle-21-core off main instead of off feat/cycle-
- 1e29550 docs(task-149): refresh security audit to live Next.js/Vercel architecture
- 083449f feat(task-154): [Auto-triaged] Pre-existing global steepest-drop chip (task-141, CliffChart.tsx) clips the right edge for high-income cliffs (steepest
- f463136 fix(methodology): rewrite FL + OH source-less citation notes for public reading
- 0575a0f feat(task-158): Above-the-fold "what is CliffCheck?" clarity — landing hero fails the 5-second explain test
- dd45c6e feat(task-156): [Auto-triaged] No Google Search Console on the domain. Vercel Web Analytics only sees traffic that already arrived — it is blind to SEO
- b0c139a merge: Fintech-grade UI redesign (shadcn, mobile-first flow, chart views, $200k axis)
- 7f726a8 merge: origin/main (v0.22.0) into UI redesign
- 83879da fix: hero delta never wraps the sign onto its own line
- 6a6255e fix: situation filters always visible; only secondary options fold
- a0f8033 redesign(round-2): mobile-first input flow, contrast + definition, chart flow view
- f72ea8b fix: dual-income solo household composition + extend income axis to $200k
- 2ea3dd3 redesign: fintech-grade UI on shadcn foundation
- 1046af7 polish: unify calculator card system + input-rail rhythm (adhoc UI)

## v0.22.0 — 2026-07-09

- 1345422 merge: Cycle 22 UI — per-boundary cliff-cause markers + EP threshold (task-153)
- c5b502f merge: Cycle 22 platform — NY news-peg FAQ + README fix + analytics readout (task-150/151/152)
- 507a257 feat(task-152): Analytics readout doc — pSEO + r/ohio traffic → close the AD-7 measurement gate
- 8c9b4ce feat(task-150): Fix stale README "Run locally" + citation instructions that still point at index.html (v0.x) instead of npm run dev / lib/engine
- 4d23a27 feat(task-153): Per-boundary cliff-cause tooltips — render programCliffs + add the Essential-Plan threshold
- f26a543 feat(task-151): Deadline-framed Essential-Plan contraction FAQ + schema for the July-2026 news-peg query
- e17c7fc chore: apply PAPI cycle-21 CLAUDE.md enrichment (idea pipeline, doc registry, advanced patterns)

## v0.21.0 — 2026-07-07

- aa0f9fa merge: Cycle 21 platform — README 7→8 states + TinyBase/stale-count cleanup (task-146)
- 49f803e merge: Cycle 21 core — New York pSEO surface + Essential-Plan second-cliff callout (task-145)
- b68634d merge: Cycle 21 engine — progressive state-income-tax brackets (task-147)
- 7bd5974 feat(task-146): README supported-states 7→8 (add New York) + stale-count/TinyBase cleanup
- 1097898 feat(task-145): New York programmatic-SEO surface — /benefits-cliff/new-york hub + program spokes + OG card
- b2e41fe feat(task-147): Bracketed progressive state-income-tax engine (optional brackets[] on StateIncomeTaxRules)
- f9b64f2 merge: NY SLCSP + HUD primary-source corrections (task-144)
- 729b93c fix(task-144): correct NY SLCSP + HUD housing to primary-sourced values
- cff69e4 merge: NY SNAP/childcare threshold corrections (task-144)
- 1c863d9 fix(task-144): correct NY SNAP + childcare thresholds to gov-sourced values

## v0.20.0 — 2026-07-06

- 28123ef merge: Cycle 20 engine — New York Essential-Plan double-cliff (task-94)
- 50060b5 merge: Cycle 20 platform — license → proprietary/closed (task-142, task-143)
- 22d9d5d merge: Cycle 20 core — cliff-cause label on chart callout (task-141)
- e980f8c feat(task-94): Add New York state support (state ACA exchange, expansion Medicaid, complex CHIP)
- a83102e chore(task-143): relicense to proprietary/closed-source (repo is private)
- b2c6f63 feat(task-142): [Auto-triaged] package.json still declares "license": "MIT", but the repo is now private / closed source (corrected across CLAUDE.md +
- be8920d feat(task-141): [Auto-triaged] cliffAnnotation.cause is computed but UNCONSUMED — no UI surface renders the dominant-cause label (the chart shows only

## v0.19.0 — 2026-07-05

- 1059802 merge: Cycle 19 platform — postcss vuln override (npm audit clean)
- 4a3ab8b merge: Cycle 19 engine — dual-income toggle URL round-trip
- 77c0115 merge: Cycle 19 core — /why + /guide OG cards, CSR cliff-cause candidate
- f2ce40c feat(task-109): [Auto-triaged] npm install reports 2 moderate-severity transitive vulnerabilities from the Next 16 / vitest 4 dependency tree — worth a
- 887227a feat(task-97): Add ACA CSR as a candidate in cliff-cause attribution function
- 70e698b feat(task-140): [Auto-triaged] the dual-income comparison assumes the second earner's wages == the raise itself (offered − current income), the cleanes
- 7ecc1b0 feat(task-139): [Auto-triaged] no per-topic dynamic OG image (app/guide/[topic]/opengraph-image.tsx) — guide topics are the strongest share/AI-citation
- 3c202d6 feat(task-137): [Auto-triaged] /why ships no dedicated OG image route (app/why/opengraph-image.tsx) — the pSEO hub pages each have one

## v0.18.0 — 2026-07-05

- 2369467 merge: Cycle 18 benefit-engine — dependent-care FSA lever + dual-income mode
- 96b8cd8 merge: Cycle 18 core — /why explainer, /guide glossary, PRODUCT_BRIEF refresh, hygiene sweep
- ef07859 docs(task-132): correct FL childcare source-less provenance note
- e66b50f docs(task-120): document hero SEED tuples as intentional editorial picks
- 8b7cb6c feat(task-131): add EITC as a cliff cause-attribution candidate
- dc136c0 docs(task-130,task-121): refresh engine API conventions + document intentional inline-style pattern
- aaadd24 feat(task-93): Lever explorer: add dependent-care FSA toggle + dual-income ("should adult 2 work?") mode
- e9610bd feat(task-134): /guide/[topic] national glossary (Template C pSEO)
- 1916e90 feat(task-103): Refresh PRODUCT_BRIEF.md: post-VibeJam framing, updated North Star (drop "in America"), monetization phase, UK+IE horizons
- b585471 feat(task-95): /why explainer page — cliff math, history, policy levers
- 929ea2b fix(og): replace broken static social cards with next/og routes (#13)

## v0.17.0 — 2026-07-05

- 2b618d0 merge: Cycle 17 + FL/GA/PA states + contact form
- a7a5ab1 fix: footer state coverage 4 to 7 (add FL, GA, PA)
- e31d41f feat(task-126): programmatic SEO page engine (Texas-first)
- 24eb37f feat(task-114): /methodology citation page generated from engine provenance
- 81c677a feat(task-113): machine-readable Rule<Provenance> — structured program + state provenance maps
- ed14e8b feat(task-100): add EITC line item to the itemised loss breakdown
- 740808f feat(task-127): Add Content-Security-Policy (report-only first, then enforce) on top of the shipped baseline security headers
- 6aea78b docs(task-128): correct stale open-source/single-file claims to Next.js/Vercel/private reality
- e3a6dde feat(task-112): Swap ACA applicable-% source from thefinancebuff.com to IRC §36B / IRS gov source
- d0a7566 chore: snapshot in-flight work before Cycle 17 builds
- 8c2f5d9 feat(engine): add FL, GA, PA state rule tables (task-96)
- 1101212 feat(seo): social cards, canonical, robots, sitemap + security headers
- 4dbef07 chore(marketing): wire CliffCheck marketing subagent + shared skills
- b8ba17d fix(calculator): clarify income fields are household totals

## v0.16.0 — 2026-06-28

- 193cec4 merge: Cycle 16 — full product redesign (design brief + chrome + landing + calculator)
- 83c97de feat(task-118): full calculator/tool — engine-wired, share-URL, step chart
- 2b99d43 feat(task-117): full landing page — rotating engine hero + narrative
- dc5945b feat(task-116): app chrome + shell + motion/elevation tokens
- b47a13b docs(task-115): design-direction brief — full product redesign spec
- 10c43d6 docs(plan): re-order re-platform phasing to design-first

## v0.15.0 — 2026-06-26

- 3b9489b merge: Cycle 15 — re-platform foundation (Next.js scaffold + engine extraction + tests + gov-source guard)
- 36a23c2 test(task-107): gov-source provenance guard (suite stays green)
- 8047640 test(task-106): convert validation suite to Vitest (74 tests, engine green gate)
- 252024e feat(task-108): Extract benefit calculation engine from index.html into typed, framework-free TS modules (lib/engine/*)
- fde3539 feat(task-105): scaffold Next.js 16 app shell + palette tooling
- c9925b1 chore(security): untrack .mcp.json from git

## v0.13.0 — 2026-05-09T20:36:11.028Z

- 5f8f829 Merge pull request #12 from cathalos92/feat/task-85
- 3ca3dae Merge pull request #11 from cathalos92/feat/task-80
- 400cdf0 feat(task-85): Add "Should the second adult work?" scenario mode
- 192f5fc feat(task-80): Advanced levers panel — HSA/401k pre-tax MAGI reduction for ACA and Medicaid
- f392d10 chore(task-81): post-build audit fix — mention match in manager brief copy
- d74542d feat(task-81): Extend total compensation toggle (task-74) to include employer 401k match as offsetting raise value
- bd17c6d chore: refresh hero stat to ~$10k post task-84 OH state tax
- df95ee2 chore(task-84): post-build audit fix — reorder OH state tax test case to Case 10
- 20632f7 feat(task-84): Model Ohio flat income tax (2.75% above $26,050) — accuracy improvement, not a cliff
- 649a3b9 docs: dogfood log — Cycle 12 post-release observations
- 74dc12b Merge feat/cycle-12-ui: chart legend + UX polish (task-88, task-89, task-51, task-53)
- 9e5b715 Merge feat/cycle-12-core: docs convention + data refresh checklist (task-42, task-43, task-40)
- 0223c55 Merge feat/cycle-12-benefit-engine: ACA Cost-Sharing Reductions + hero stat refresh (task-87)
- 0864d3e feat(task-40): Create annual data refresh checklist — doc tracking update cadence for SNAP, FPL, ACA SLCSP, HUD FMR, and state childcare rates
- b46a590 feat(task-43): Rename docs/ohio-benefit-rules.md to follow multi-state convention — prepare docs structure for Cycle 7 multi-state expansion
- e8db8f9 feat(task-42): Fix PRODUCT_BRIEF deployment URL reference — replace github.io reference with Cloudflare Workers URL
- b4f0ed8 feat(task-53): Localise childcare subsidy label per state — show the active state's actual program name (CCS/SCCAP/CDC/PFCC)
- 1d87ae0 feat(task-51): Add unsupported-state guard in state selector UI — prevent silent fallback to Ohio
- 869c672 feat(task-89): Decouple "household composition" from "has children" — support childless adults, and rename the single-parent/two-adult options
- 693f5b0 feat(task-88): Cliff chart legend and annotation overhaul — make line meanings, FPL thresholds, and cliff causes legible without explanation
- 86b8c47 chore: refresh hero stat to ~$9k post-CSR (task-87 follow-up)
- fa2e212 feat(task-87): Model ACA Cost Sharing Reductions (CSR) — Silver plan reduced cost-sharing below 250% FPL, including 94% AV below 200%
