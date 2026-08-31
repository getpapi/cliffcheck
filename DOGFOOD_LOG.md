---
project: CliffCheck
framework: PAPI
start_date: 2026-04-21
end_date: ~
status: Active
format_version: 2
tester: Cathal
perspective: External user (new project, first-time setup)
---

# PAPI Dogfood Log — CliffCheck (VibeJam 2026)

> External-user perspective: setting up PAPI for a brand-new project, trying to mimic the flow a first-time user would experience via the public `@papi-ai/server` npx package.
> Focus: setup friction, onboarding clarity, first-cycle experience. Cycle-level observations once setup completes.

---

## Cycle Template

<!-- Copy this template for each cycle -->

<!--
## Cycle N — [Mode] — YYYY-MM-DD

### Cycle Metrics
- **Mode:** Bootstrap / Full
- **Tasks planned:** N
- **Tasks built:** N
- **Effort estimates vs actual:** e.g. "3/3 matched" or "2/3 — task-X was M vs estimated S"
- **Rework needed:** None / describe

### Friction Points
- List any friction with the PAPI framework itself (not the project being built)
- Focus on: persistence issues, prompt quality, workflow gaps, confusing outputs

### Methodology Signals
- What worked well in the plan→build→report cycle
- Cross-cycle learning observed?
- AD system functioning?
- Build handoff quality?

### Commercial / Roadmap Signals
- Cost observations (API tokens consumed, time spent on overhead vs building)
- Would a paying user tolerate this workflow?
- What would need to change for non-technical users?
- Any insights relevant to G2M, pricing, or positioning?
-->

---

## Setup Session — 2026-04-21

### Context
Setting up PAPI for CliffCheck (a fresh VibeJam hackathon project) as an external user would. Goal: treat this as a brand-new project, use the hosted `@papi-ai/server` npx package via `.mcp.json`, not the developer's local PapiUI binary. Should have been a "one command, it just works" experience per the README quickstart.

### Friction Points

- **P0 CRITICAL — `setup` flow broken in npx `@papi-ai/server` binary.** The published npx binary fails to create the `projects` table row during `setup prepare`, even though it reports success. Evidence:
  1. `setup` with `mode: "prepare"` returns: *"Project 'CliffCheck' scaffolded — database tables created."*
  2. Immediately calling `orient` returns: *"No project found for PAPI_PROJECT_ID `<id>`. Run `setup` first to initialise your project."*
  3. Calling `setup` with `mode: "apply"` (the next required step per the tool's own instructions) fails with: *`insert or update on table "product_briefs" violates foreign key constraint "product_briefs_project_id_fkey"`*
  
  Net effect: a brand-new external user following the documented `init → setup` flow CANNOT complete setup. The hosted `mcp__claude_ai_PAPI_MCP_New__setup` tool (running PAPI's internal server code) worked fine with the same inputs — so the bug is specific to the published npx binary, not the setup logic itself. Reproduced at least twice with fresh project IDs (`df05050c-2b2e-4a4a-a5f7-44c216715642` and earlier `61ffaddf-ef39-4158-bd51-85ef2fea05b5` before switching to hosted). The scaffolding step is silently a no-op for the project row specifically while claiming success.

- **P1 HIGH — Hosted vs local MCP server storage mismatch is undocumented.** The hosted `mcp__claude_ai_PAPI_MCP_New__*` tools and the local `@papi-ai/server` npx binary appear to use different Supabase databases (or different project scopes within the same database). Consequence: a project created via the hosted tool is invisible to the local binary and vice versa. There is no documentation or error message explaining this. An external user switching between the two (which is easy to do accidentally if both MCP servers are listed) will see "No project found" errors with no diagnostic path. The tools should either share storage, or the schema-level separation should be explicit.

- **P1 HIGH — `init` requires a client restart before `setup` will work.** The `init` tool writes a new `PAPI_PROJECT_ID` to `.mcp.json` but the running MCP server process still has the old ID in memory. `setup` then operates against the wrong project ID silently. The tool output says *"Restart your MCP client to pick up the new config"* but this is easy to miss and there's no runtime check that detects the mismatch. Worse, on macOS Claude Code, a client restart loses all in-flight conversation context. An external user could burn 20 minutes of context just to get past setup. Better: detect the stale env var and block with a clear error; or (ideally) re-read `.mcp.json` dynamically.

- **P2 MEDIUM — `setup` two-phase flow (`prepare` → `apply`) is awkward for a first-time user.** The flow requires the AI client to call `setup` with `mode: "prepare"`, receive a large multi-section prompt, execute it (generating brief/ADs/conventions/tasks), then call `setup` again with `mode: "apply"` passing all four responses plus the original inputs. That's a lot of ceremony for what a user perceives as "just initialise my project." Compare to the hosted MCP tool's friendlier flow (same two phases, but at least each error was actionable). Could potentially be collapsed for simple cases where the AI can generate responses inline.

- **P2 MEDIUM — Misleading "database tables created" message.** The setup prepare response says "database tables created" implying DDL ran AND a project row was inserted. In practice it seems to mean "schema is ensured to exist." For a first-time user, this reads as confirmation that their project exists — which it doesn't. Message should be rewritten to distinguish schema presence vs. project row presence.

- **P3 LOW — `init` always writes a new UUID even when one is already set.** Running `init` a second time (e.g., to test or recover from an earlier failure) silently overwrites the existing project ID with a new one. No confirmation prompt, no detection of existing ID. Cost an additional cycle of confusion as different IDs appeared in running process vs file.

- **P3 LOW — No visible way to list existing projects in PAPI storage.** When things went wrong, there was no tool available to ask "what projects exist for this Supabase instance / this user?" — only `orient` which requires a known project ID. A simple `list_projects` tool would have diagnosed the hosted-vs-local storage mismatch in 30 seconds.

### External-User Experience Signals

- **The pitch: "one command, it just works."** The README quick start is `claude mcp add papi -- npx -y @papi-ai/server`, then `setup`. This implies a one-command onboarding. In practice, a first-time user hit: init does nothing usable without a restart, setup prepare claims success but doesn't actually create the project, setup apply fails with a foreign-key error that means nothing to the user. That is a disqualifying onboarding experience for a paying user.
- **I am a technically literate user with full Claude Code tool access and I still could not complete setup via the documented npx flow.** A less technical user would have given up inside 10 minutes.
- **The hosted `mcp__claude_ai_PAPI_MCP_New__*` tools ran the same setup flow cleanly.** This demonstrates that PAPI's setup logic is sound — the failure is in what ships via npm. A first-time user does not know these two paths exist, and should not need to.

### Workaround Applied
Falling back to the hosted `mcp__claude_ai_PAPI_MCP_New__*` MCP tools (reusing project ID `61ffaddf-ef39-4158-bd51-85ef2fea05b5` which was successfully registered there with brief, 5 ADs, and 7 initial tasks during the first attempt). Will resume the cycle via that path. **Going forward: default to hosted tools for all PAPI work. Hosted IS the external-user path for anyone using PAPI from Claude (desktop, web, Code) — the npx binary is a self-hosted/DIY path which is a secondary persona.**

### Framing Note
Initial instinct was to equate "external user experience" with the README `npx` quickstart, which led to an hour of switching between MCP configs and hitting the bugs above. Correct framing: the *default* external-user path for PAPI is the hosted MCP integration. The npx/self-hosted path is for power users who want their own database. Default to hosted unless the user explicitly asks to test the self-hosted flow.

---

## Post-Setup Session (Hosted MCP) — 2026-04-21

### Friction Points

- **P0 CRITICAL — Hosted `plan prepare` returns context from a DIFFERENT project.** After switching to the hosted `mcp__claude_ai_PAPI_MCP_New__*` tools and successfully running setup (brief + 5 ADs + 7 initial tasks registered under project ID `61ffaddf-ef39-4158-bd51-85ef2fea05b5`), the very first call to `plan prepare` returned:
  - Cycle number **228** (CliffCheck should be cycle 1)
  - A backlog of **80 tasks** — all PAPI-framework internal tasks (task-1402 "Connect existing project", task-1415 "Hub visual quality pass", task-1423 "Research: post-signup experience audit", task-1424 "Close md adapter blind spot", plus ~70 P2/P3 items on Dashboard, MCP Server, Core modules)
  - **21 Active Decisions** including AD-11..AD-27 referencing GitHub OAuth + RLS + API keys, Dashboard north star, Cockpit frame layout, External user feedback loop ("Stonebridge Systems") — all PAPI product development concerns, not CliffCheck
  - Build reports referencing `papi-plugin/server/index.js` and Supabase migrations — paths that don't exist in the CliffCheck repo
  - None of the 7 CliffCheck tasks seeded during setup (no Ohio / SNAP / Medicaid / Keisha / benefit-engine entries)
  - Only 5 ADs with CliffCheck-flavoured titles appeared (AD-1..AD-5), mixed in with the 16 PAPI ADs
  
  The user direction block did correctly echo my CliffCheck Phase 1 focus string, but the surrounding context block was cross-wired to PAPI's own tracked project. If the calling agent had blindly authored an `apply` payload and submitted it, cycle-228 planning content would have been written into the wrong project — corrupting either CliffCheck or PAPI's own tracking.
  
  Net effect: hosted MCP tools are not correctly scoping the plan context builder to the requested `project_id`. Setup writes clearly persisted CliffCheck data somewhere (first setup returned "Product Brief generated and saved. 5 Active Decisions seeded..."), but the plan tool is pulling context from a different scope.

- **P0 CRITICAL — Both PAPI paths have now failed for a new-project-first-cycle flow.** The npx binary fails at `setup` (project row never created). The hosted tools fail at `plan` (context from wrong project). Together this means there is currently **no working path for an external user to complete the first planning cycle of a new PAPI project** — whether they come via `npx @papi-ai/server` or via claude.ai's hosted MCP integrations. Critical onboarding blocker.

- **P2 MEDIUM — No way to verify which project a tool is operating on before running it.** When the hosted `plan prepare` returned cycle 228 context, I had no way to know upfront whether the tool was scoped to CliffCheck or PAPI without reading the full 105KB response. A pre-execution confirmation like "Running plan for project <name> (id: <id>), cycle <N>, against <N> backlog tasks. Continue? [y/n]" (or even just that as the first paragraph of the response) would have caught the cross-wiring in seconds. Related to the earlier P3 suggestion for a `list_projects` / `diagnose` tool.

- **P2 MEDIUM — Tool response too large for agent context (105KB / 104,048 chars).** The plan prepare response exceeded Claude Code's single-tool-result limit, requiring a subagent-mediated read via filesystem. For a first-time user without subagent skills, this is effectively a stuck state. Also a signal that plan context is bloated — 80 tasks + 21 ADs + build history + dogfood log + research signals all concatenated. Consider paginating, compacting, or summarising by default; surface the full context only on request.

### External-User Experience Signals

- **PAPI is currently unusable for a new external project on both paths.** This is the single biggest G2M risk observed so far. A hackathon user with 5 days to ship cannot afford a 2-hour setup detour.
- **The hosted tool's cross-wiring bug is more dangerous than the npx bug** because it silently returns wrong-but-syntactically-valid data. An AI agent following the prompt literally would author and submit corrupting content. The npx bug at least fails loudly with an FK violation.

### Recommended Fixes (priority order, supersedes earlier list)

1. **Fix plan context scoping in the hosted MCP.** The tool must return only the requested project's tasks, ADs, and build history. Cross-project leaks are a P0 data-integrity issue.
2. **Add a "Running against project <name> (cycle N)" header to every PAPI tool response.** Single-line, non-negotiable. Catches scoping bugs immediately for both humans and agents.
3. **Fix `setup prepare` in `@papi-ai/server` npx binary to actually insert the project row.**
4. **Paginate or compact `plan prepare` output** — 105KB is beyond reasonable tool-result limits.
5. **Ship a `list_projects` / `diagnose` tool** for explicit project-ID verification.

### Workaround This Session
Pausing PAPI-mediated planning entirely. Two options surviving:
- **(a) Wait for the cross-wiring fix** before resuming planning via PAPI.
- **(b) Plan the first cycle manually** (directly in conversation / a local markdown doc), build the Ohio benefit engine and cliff chart without PAPI cycle tracking, and onboard to PAPI later when it stabilises. Pragmatic for the 5-day hackathon but loses the compounding-intelligence value-prop.

### Recommended Fixes (priority order)

1. **Fix `setup prepare` in `@papi-ai/server` to actually insert the project row before returning success.** Non-negotiable — current state means the advertised quickstart does not work.
2. **Add a `list_projects` or `diagnose` tool** that prints which storage backend is in use, which project IDs exist there, and which ID the current env is pointed at. This alone would cut first-time-user debugging by an order of magnitude.
3. **Detect and block mismatched `PAPI_PROJECT_ID` between `.mcp.json` and running process env.** If the file has changed since the process started, return a clear error on the first tool call.
4. **Rewrite the setup prepare success message** to distinguish "schema ensured" from "project registered."
5. **Document the hosted-vs-local storage split explicitly**, or unify them.

---

## Cycle 1 — Bootstrap — 2026-04-21

### Cycle Metrics
- **Mode:** Bootstrap
- **Tasks planned:** 3
- **Tasks built:** 3
- **Effort estimates vs actual:** 3/3 matched (task-3 came in S vs estimated M — validation was simpler once Node test confirmed the numbers)
- **Rework needed:** None — task-3 handoff parameters required correction ($54K → $44K Keisha wage) but was caught before building

### Friction Points

- **P2 MEDIUM — Handoff parameters not updated when upstream task contradicts them.** task-2 build report explicitly flagged that the Keisha demo wage should be $44K (not $54K from product brief), and this appeared in task-3's RECENT MODULE CONTEXT. But the task-3 handoff itself still used the old `calcEffectiveTakeHome(54000, 4)` call and the old assertion ranges. The handoff was generated at plan time and not regenerated when task-2 contradicted the assumption. Result: task-3 builder had to correct parameters manually. This will happen on any project where brief numbers are aspirational — which is common early on.
  **Suggested fix:** After `build_execute` complete, if `surprises` contains corrections that affect downstream handoffs in the same cycle, flag them as needing handoff review rather than leaving them stale.

- **P3 LOW — PR merge error on shared branch task.** task-3 was placed on `feat/cycle-1-core` (shared cycle branch), but `review_submit` attempted to merge `feat/task-3` which didn't exist. Auto-release still succeeded and v0.1.0 was tagged. Cosmetic but noisy.

### Methodology Signals

- **Research → Build → Validate 3-task structure worked perfectly for an accuracy-critical feature.** Clean ground-truth document (ohio-benefit-rules.md) was referenced by both engine and validation. When the engine found a calculation error (SNAP cliff at $44,671, not $53,100), it corrected the doc — a tidy feedback loop that would have been muddier if both were in one task.
- **RECENT MODULE CONTEXT in handoff was genuinely useful.** task-2's architecture notes appeared verbatim in task-3's handoff. The Keisha wage correction was visible — builder had to notice and act on it.
- **Validation as page-load regression harness is the right pattern for a hackathon.** No test runner setup; `validateKeisha()` IIFE surfaces engine regressions during Phase 2 development immediately in the browser console.

### Commercial / Roadmap Signals

- **The engine's real numbers are more dramatic than the brief implied.** A $4K raise from $44K to $48K can cost $24K in effective income — sharper than the "$10K worse off" narrative in the brief. Real data often turns out to be more extreme than marketing copy.
- **Competitive landscape is clear.** Fed Atlanta CLIFF Tool is the only serious comparable but is built for workforce counselors, not consumers. The pitch: "professionals have tools; nobody built it for the person on the other side of the cliff."
- **Cycle 1 velocity (3 tasks, ~2–3 hours) reasonable for a bootstrap cycle** focused on data accuracy. Phase 2 (input form + cliff chart UI) is the first judge-visible output.

---

## Post-Cycle 9 Session — 2026-04-25

### Friction Points

- **P1 HIGH — `orient` reports Strategy Review cadence incorrectly.** After Cycle 9 release, `orient` returned "⚠️ GATE — 5 cycles since last Strategy Review. `plan` is blocked until `strategy_review` runs (or `force: true`)" and "Next action: Strategy Review overdue (5 cycles)". A strategy review was completed in Cycle 4. Cycle 9 just released — that's the 5-cycle mark, so a review is *due*, not *overdue by 5 cycles*. The phrasing implies five cycles have elapsed with no review at all, which is false and prompted a misleading summary to the user. **Suggested fix:** Distinguish "cycles since last review" from "cycles overdue" — they are not the same number. If cadence is "every 5 cycles" and last review was C4, then at C9-complete the count is "due (0 overdue)", at C10 it's "1 overdue", etc.

- **P1 HIGH — `orient` alerts surface stale issue text from old cycles without re-checking current code.** The C9 orient report listed as a P1 alert: *"P1: The product brief Keisha demo scenario uses wages=$54K but at that income all Ohio benefit thresholds…"* — but "Keisha" was removed from the codebase cycles ago (memory note `feedback_persona_naming.md` flagged the name in C2/C3 and the demo persona was renamed). The alert is replaying a C1/task-2 discovered_issue verbatim, never reconciled against the current state of the app. **Suggested fix:** Discovered issues should either (a) auto-close when their referenced artefact no longer exists in the codebase, or (b) require explicit acknowledgement at release-time so they don't accumulate as false-positive noise across cycles. Right now the alerts list grows monotonically and erodes trust in the orient summary.

- **P2 MEDIUM — Cloudflare Workers URL P0 alert is outdated.** Orient still flags `cliffcheck.cliffcheck.workers.dev` is gated by Cloudflare Access login as a P0. We pivoted to GitHub Pages (`https://cathalos92.github.io/cliffcheck/`) for the public demo and effectively scrapped the Cloudflare Workers path. The P0 should have been resolved or superseded when that decision was made. Same root cause as the persona alert — discovered issues don't track resolution state.

### Methodology Signals

- The dogfood log is itself a useful corrective layer for `orient` drift. When orient says something that contradicts memory or recent decisions, capture it here so the next strategy review can audit how often it happens.

### Commercial / Roadmap Signals

- An "orient says X but reality is Y" pattern is exactly the kind of agent-visible regression that erodes user trust in PAPI. Worth tracking discovered-issue staleness as an explicit health metric (e.g. % of P0/P1 alerts older than 2 cycles with no status change).

- **P2 MEDIUM — "open a fresh window" prompt fires unconditionally on mode switches.** CLAUDE.md tells the agent to suggest a fresh window when switching modes (e.g. building → strategy review). The agent followed the rule even though the current window had just been opened with low context. The rule should be conditional on actual context load (token usage, time-in-window, tasks-built), not a blanket trigger. Suggested refinement: only suggest a fresh window when context is meaningfully high — otherwise the prompt is noise and creates unnecessary session churn.

---

---

## Post-Cycle 10 Session — 2026-04-25

### Friction Points

- **P2 MEDIUM — DNS cache poisoning during domain cutover wasted ~30 min.** When a domain transitions from registrar parking to GitHub Pages, the old parking IPs (Squarespace's `198.49.23.x` / `198.185.159.x`) get cached by `getaddrinfo` on macOS for hours. `dig` queries against public resolvers showed the new GitHub IPs immediately, but `curl` and browsers used the cached parking IPs and served the parking page. The agent (me) initially diagnosed this as Squarespace BGP hijacking before tracing through `python3 -c "import socket; getaddrinfo(...)"` to spot the cache. Lesson: when a domain "should be working" per public DNS but isn't, check `getaddrinfo` first, not network-layer trickery. Add to a future custom-domain-runbook: always test from a fresh browser session or another network (phone) before assuming infrastructure problems.

- **P2 MEDIUM — `build_execute` creating 4 separate cycle branches in one cycle generated avoidable merge work.** Cycle 10 had 7 tasks across "Core", "Submission", "Security", "Benefits Engine", "Benefit Engine" (note: singular vs plural — two near-duplicate module names) and "task-54" branches. End of cycle = 6 branches + 7 PRs to merge in dependency-aware order. A single cycle branch would have prevented the manual conflict resolution between `feat/cycle-10-benefit-engine` and `feat/cycle-10-benefits-engine` (both modified `calcEffectiveTakeHome`). The auto-`ort` merge happened to work cleanly because the two builds touched different parts of the function, but that was lucky. Either: (a) collapse near-duplicate module names into one canonical "Benefits Engine", or (b) add a build_execute flag for "use existing cycle branch" when the planner has identified upstream-downstream dependencies between tasks in the same cycle.

### Methodology Signals

- **Batch-shipping 7 tasks across 4 branches in a single chat session worked but cost focus.** Worked: rolling todo list + per-task post-build audit + standalone node validation of calc changes pre-merge kept quality high. Cost: by task-83 (federal EITC), context window was bloated enough that the IIFE assertion rebase became a manual hand-calc exercise rather than the agent running the harness directly. Recommendation: cap a session at 3-4 tasks before starting fresh window. The cycle-10 batch was an exception driven by the r/ohio momentum — not the steady state.

- **The "honest source-tier audit" reframe (task-54) was the most valuable methodology output of the cycle.** Initial expectation was a value-correctness sweep (which constants are wrong?). Actual deliverable: a provenance-quality sweep (which constants cite secondary aggregators vs primary agency rate notices?). The reframe surfaced 3 owner-decision questions that scope Cycle 11 priorities cleanly, instead of producing a list of 23 individual fix tasks. Future research/audit tasks should explicitly ask: is this a value-correctness audit or a provenance-quality audit? They produce different deliverables and feed different cycles.

### Commercial / Roadmap Signals

- **Federal EITC modelling sharpened the canonical Ohio demo cliff from -$5,500 to -$9,800.** This is the more honest number AND the more viral one. The OG image + README hero stat got refreshed to reflect it. In the post-submission "credibility hardening" phase (AD-7), accuracy-first is also share-velocity-first — every accuracy upgrade has the side effect of making the cliff look starker. r/ohio audience is responsive to "even more brutal than I thought" framings.

- **Custom domain (cliffcheck.com) shipped during peak r/ohio momentum.** Old `cathalos92.github.io/cliffcheck` URL 301-redirects, so existing shares don't break. Branded URL adds legitimacy and is easier to type in word-of-mouth contexts. Squarespace registrar choice was fine for the domain, but their default DNS records (parking IPs, HTTPS RR, Domain Connect helper) all required deletion — that work would have been simpler on Cloudflare Registrar, which auto-flatten apex domains and handle the GitHub Pages handoff with one click. Worth flagging if/when the next domain is needed.

- **Source provenance is the next credibility lever.** The task-54 audit confirmed ~60% of state benefit constants currently cite secondary aggregators (KFF, snapscreener, healthinsurance.org). For an app whose entire value proposition is "the math is real", upgrading to primary agency citations (USDA FNS, healthcare.gov Plan Finder, HUD FMR tables) is the highest-leverage Cycle 11 P1. Already scoped in the audit.

---

## Post-Cycle 12 Session — 2026-04-27

### Friction Points

- **P1 HIGH — Auto-release tagged v0.12.0 without merging cycle branches into main.** The final `review_submit accept` triggered an auto-release that committed CHANGELOG.md and pushed `v0.12.0` tag — but the three cycle branches (`feat/cycle-12-benefit-engine`, `feat/cycle-12-ui`, `feat/cycle-12-core`) were never merged. Main got a release commit with no actual code changes. Caught manually by checking `git log` after the announcement; merged each branch by hand (one conflict on `docs/state-rules/oh.md` freshness header, resolved keeping task-43). If the user trusted the "auto-released v0.12.0" message and didn't check git, the production deploy would silently lag by an entire cycle. **Recommendation:** auto-release should either (a) merge all task-Done cycle branches into main before tagging, (b) refuse to release while unmerged cycle branches exist, or (c) require manual confirmation before pushing the release commit. The shared-cycle-branch convention amplifies this — instead of one missed merge, three were missed.

- **P3 LOW — `build_execute` report submission silently dropped multi-paragraph fields on long prompts.** Three retries on task-87 to get `discovered_issues` through the transport. Error message said "discovered_issues missing" but the parameter was being sent. Eventually went through after content was shortened. Likely an XML namespace ambiguity (bare `<parameter>` vs `<parameter>`) when the surrounding prompt is large. A more specific error pointing at the serialisation issue would save loops.

### Methodology Signals

- **Pairing accuracy + legibility tasks in the same cycle compounded.** Cycle 12's two P1s — task-87 (ACA CSR engine) and task-88 (chart legend overhaul) — were intentionally sequenced so the chart visually reflects the new accuracy. CSR added a new value type (`acaCSRValue`) as a separate breakdown line; the chart legend immediately surfaced "Medicaid ends" / "SNAP ends" / "Childcare ends" thresholds derived from engine data. Pattern: when an engine accuracy task changes what the cliff visualisation expresses, queue a UI legibility task in the same cycle so the share-screenshot moment lands clean. Reverse order would have shipped a more accurate cliff with a chart that obscured the change.

- **Single-theme cycles ran 100% on first review with all estimates matching actual.** 8/8 tasks accepted, 0 request-changes, all XS/S accurate. Cycle theme ("AD-7 accuracy + UX legibility") meant 7 of 8 tasks touched `index.html` or `docs/`, so the build context stayed warm across the cycle. The two exceptions (task-87 effort match, task-89 over-scoped) were both intentional planner decisions, not estimation drift. Continues the pattern from Cycles 10–11: theme coherence > task-count optimisation.

- **`.impeccable.md` design-brain caught a handoff-vs-design conflict.** task-88's handoff said label thresholds as "138% FPL / 200% FPL". `.impeccable.md` bans "FPL" as a UI word. Resolved by deriving thresholds from engine data (program-named: "Medicaid ends" / "SNAP ends" / "Childcare ends") rather than FPL math. The design brain takes precedence over handoffs, by project convention. Worth reinforcing in the planner: when generating UI handoffs, scan the proposed labels against `.impeccable.md` banned words before locking the scope.

### Commercial / Roadmap Signals

- **CSR uplift made the TX persona materially viable.** Texas demo at $44k/4 jumped from ~$65k effective to $71,176 with $5,600 of CSR effective value (94% AV tier × 4 enrollees). Non-expansion states are where the marketplace stack matters most — and where the previous engine was undercounting the most. The cliff narrative for OH (which uses Medicaid → CSR=0 → demo unchanged) stays the same, but the comparative narrative across the 4 states is now more credible: TX is a real ACA story, not a stripped-down OH.

- **Hero stat shifted to "~$9k poorer" for stability across calc improvements.** OH netDiff softened from −$9,839 to −$9,039 with CSR (offered $70k income picks up $800 CSR at 200-250% tier). Updated marketing copy (README / OG meta / PRODUCT_BRIEF) to round figure rather than the exact post-cycle number. Reasoning: the exact figure shifts every cycle as accuracy work continues; "~$9k" is share-stable. Pattern for future: marketing copy uses round numbers, code comments + audit docs use exact figures, and the gap is the buffer absorbing future calc refinements.

