# CliffCheck — Project Instructions
> Last reviewed: ad-hoc — 31-07-2026

## What This Is
Benefits Cliff Navigator — a phone-first web app revealing the hidden math behind benefits cliffs (when a raise makes you poorer through lost benefits). Post-hackathon product in the **distribution + monetization phase** (AD-7).

**Theme:** "Escape the permanent underclass"
**Origin:** Built for VibeJam 2026 (VibesOS track, 3rd place, submitted 25-04-2026). Since re-platformed from the single-file hackathon build to Next.js/Vercel; no longer a sprint.
**Stack:** Next.js 16 App Router + Tailwind + Recharts on Vercel (AD-2).
**Deploy:** Vercel — `https://cliffcheck.com/` (canonical; old `cathalos92.github.io/cliffcheck` 301-redirects).
**Repo:** github.com/cathalos92/cliffcheck (private).

## Stack (Next.js on Vercel)
- Next.js 16 App Router, React 19, TypeScript
- Calc engine in `lib/engine/*` — pure, framework-free TS; UI in `app/` + `components/`
- Local-first: financial inputs stay on-device (React state + URL-hash share), no cloud calc, no accounts
- Tailwind CSS for styling; Recharts for the cliff chart
- Deployed on Vercel (SSG/ISR). The only server route is the contact form (`app/api/contact`)

## Historical: VibesOS single-file (v0.x)
The original hackathon build was one `index.html` (React + Babel-in-browser + TinyBase + Tailwind CDN, served on GitHub Pages). That file is now legacy/dead code, kept for reference only. Build in `app/` + `lib/engine/`; never edit `index.html`.

## PAPI Project Management
This project uses PAPI for planning/building/reviewing. MCP server configured in `.mcp.json`.
Follow the standard cycle: `plan -> build_list -> build_execute -> implement -> review -> release`

## Product Quality Bar
(Originally the VibeJam judging axes — retained as the standing quality lens now that judging is done.)

| Axis | What good looks like |
|------|----------------------|
| Design | Phone-first, empathetic, warm — not a government form |
| Functionality | Real FY2026 calculations, interactive cliff chart, actionable safe-exit output |
| Market viability | No consumer competitor. Revenue: B2B employer/counselor tooling (AD-8), not consumer ads |
| Creativity | Reveals the hidden truth — the "oh shit" cliff chart moment |
| Technical sophistication | Local-first privacy, FED/STATES rule engine, machine-readable provenance |

## Architecture Decisions
- **Local-first (on-device state):** Financial inputs stay on-device — React state + URL-hash share, no store, no localStorage, no accounts. Privacy is a trust feature, not incidental. (TinyBase was the v0.x store; removed in the re-platform.)
- **Multi-state, accuracy-gated:** 16 states live (OH/TX/NC/MI/FL/GA/PA/NY/AZ/IL/CA/WA/VA/TN/MO/IN), expanding toward 50 in vetted batches (~8/cycle). FED/STATES engine — each state is sourced data + a validation test. Breadth is gated on primary-source accuracy + provenance; credibility spine over coverage vanity.
- **Phone-first:** Target users are mobile-primary. Design for 375px first, desktop second.
- **Actionable output:** The shareable manager brief differentiates this from a calculator. It's a tool, not just information.

## Scope Guard (distribution + monetization phase)
**In scope:** 50-state expansion (batched, accuracy-gated), missing high-impact programs (CTC, FICA/federal tax), value capture (share-link, B2B counselor/employer intake), programmatic-SEO depth, accuracy/provenance hygiene.
**Out of scope (hard):** User accounts, cloud sync or any persistence of financial inputs (URL-hash only), gating/paywalling the calculator, capturing email to use the tool, real-time benefit API integration, and predatory monetization categories (AD-8 prohibition list — payday, debt consolidation, gambling, crypto).

## Key Files
- `app/`, `components/`, `lib/engine/` — the Next.js app. `lib/engine/*` is the pure-TS calc engine; `app/` holds routes/pages, `components/` the UI. (`index.html` is legacy/dead code.)
- `PRODUCT_BRIEF.md` — Full product context: persona, phase, architecture, monetization posture (AD-8), horizons
- `PRODUCT.md` + `DESIGN.md` — design-system source of truth (read before any UI work)



## Documentation Maintenance

Before creating a new doc, check `docs/INDEX.md` — it may already exist. When creating or archiving docs, update the index.

After implementing any code change, check if the change affects any documentation in `docs/`. If a doc describes behaviour, architecture, or file interactions that your change modified, update the doc to stay accurate.

When updating a doc, add or update a review header immediately below the title:

```
# Document Title
> Last reviewed: task-NNN — DD-MM-YYYY
```

Replace `task-NNN` with the task ID that triggered the update, and `DD-MM-YYYY` with today's date.

## Session Start

When a conversation starts — fresh window, new session, or after context compression — orient before doing anything else:

1. **Run `orient`** — single call that returns cycle number, task counts, in-progress/in-review tasks, strategy review cadence, trends, and recommended next action.
2. **Fix orphaned tasks silently** — check for feat/task-XXX branches that don't match board status. Fix and report after.
3. **Summarise:** "You're on Cycle N. X tasks to build, Y builds pending review." or "Cycle N is complete — ready for the next plan."
4. **Run `build_list` when picking a task** — `orient` shows counts only. `build_list` shows the full task list with handoffs.

**CRITICAL: Check task statuses before acting.**
- **In Review** = already built. Suggest `review_list` → `review_submit`. **NEVER re-build an In Review task.**
- **In Progress** = build started but not completed. Check the branch and existing changes before writing new code.
- **Backlog** = not started. But first check if a `feat/task-XXX` branch already exists with commits — fix it, don't rebuild.
- If all cycle tasks are Done, suggest `release` or next `plan`.

## Workflow Sequences

PAPI tools follow structured flows. The agent manages the cycle workflow automatically — the user should never need to type tool names or remember the flow. Handle the plumbing, surface the summaries.

### Cycle Workflow (auto-managed)

- **Run tools automatically** — don't ask the user to invoke MCP tools manually
- Before implementing: silently run `build_execute <task_id>` (start phase)
- After implementing: run `build_execute <task_id>` (complete phase) with report fields
- After build_execute completes: audit the branch changes for bugs, convention violations, and doc drift (see Post-Build Audit below)
- After audit with findings: *MUST* automatically run `review_submit` with verdict `request-changes` and a concise summary of the audit findings as the changes requested — the builder fixes these before the task goes to human review
- After audit clean: present for human review — "Ready for your review — approve or request changes?"
- User approves/requests changes → run `review_submit` behind the scenes

### The Cycle (main flow)

```
plan → build_list → build_execute → audit → review_list → review_submit → build_list
```

1. **plan** — Run at the start of each cycle to generate the cycle plan and populate the board.
   Next: `build_list` to see prioritised tasks.
2. **build_list** — View tasks ready for execution, ordered by priority.
   Next: `build_execute <task_id>` to start a task.
3. **build_execute** (start) — Creates a feature branch and marks the task In Progress. Returns the build handoff.
   Next: Implement the task, then `build_execute <task_id>` again with report fields to complete.
4. **build_execute** (complete) — Submits the build report, commits, and marks the task In Review.
   Next: Run the post-build audit automatically.
5. **Post-build audit** — Review branch changes for bugs, convention violations, and doc drift (see Post-Build Audit section below).
   Next: If findings exist, run `review_submit` with `request-changes` and the audit findings. If clean, proceed to `review_list`.
6. **review_list** — Shows tasks pending human review (handoff-review or build-acceptance).
   Next: `review_submit` to approve, accept, or request changes.
7. **review_submit** — Records the review verdict and updates task status.
   Next: `build_list` to view next build

### Strategy Review

```
strategy_review → strategy_change
```

- **strategy_review** — Analyses project health, velocity, and estimation accuracy.
  Next: `strategy_change` if the review recommends adjustments.
- **strategy_change** — Updates active decisions, north star, or project direction based on review findings.

### Detect Strategic Decisions in Conversation

Watch for: direction changes, architecture shifts, deprioritisation with reasoning, new principles, competitive positioning decisions.

When detected:
1. Flag it: "That sounds like a strategic direction change — should I run `strategy_change`?"
2. If confirmed, run `strategy_change` immediately.
3. If mid-build, finish the current task first.

### Idea Capture

```
idea → (picked up by next plan)
```

- **idea** — Captures a new task idea and writes it to the backlog.
  Next: The next `plan` run will prioritise and schedule it.

### Project Bootstrap

```
setup → plan
```

- **setup** — Initialises the project in the database and scaffolds config files.
  Next: `plan` to run the first cycle planning session.

### Board Management

- **board_view** — Read-only view of all tasks on the board.
- **board_archive** — Removes completed/cancelled tasks from the board to an archive.
- **board_deprioritise** — Moves a task to a later phase.

### Quick Reference: Tool → Next Step

| Tool | Next Step |
|------|-----------|
| `setup` | `plan` |
| `plan` | `build_list` |
| `build_list` | `build_execute <task_id>` |
| `build_execute` (start) | Implement, then `build_execute` (complete) |
| `build_execute` (complete) | Post-build audit (automatic) |
| Audit (findings) | `review_submit` with `request-changes` |
| Audit (clean) | `review_list` |
| `review_list` | `review_submit` |
| `review_submit` (approve/accept) | `build_list` |
| `review_submit` (request-changes) | `build_execute` (redo) or `build_list` |
| `strategy_review` | `strategy_change` (if needed) |
| `idea` | Next `plan` picks it up |

## Post-Build Audit

After every `build_execute` (complete), audit the branch before presenting for human review. This catches bugs and convention violations early.

1. **Identify changed files:** Run `git diff origin/main --name-only` to find modified files. If no changes, report "No changes to audit" and skip.
2. **Review each changed file** for:
   - Logic errors, off-by-one mistakes, incorrect conditions
   - Unhandled edge cases (null, undefined, empty inputs)
   - Convention violations defined in this CLAUDE.md
   - Incorrect type narrowing or unsafe casts
3. **Documentation check:** If any `docs/` files describe behaviour that the change modified, flag as "Doc drift".
4. **Report:** For each issue: file path, severity (Bug/Convention/Doc drift), what's wrong, how to fix.
5. **If findings exist:** Run `review_submit` with `request-changes` and the findings. Fix before human review.
6. **If clean:** Present for human review — "Ready for your review — approve or request changes?"

## When to Start a New Conversation

Start a fresh window when:
- **After a release** — cycle is done, context is heavy. New window orients in seconds via `orient`.
- **After 3+ tasks built** — accumulated file reads, diffs, and discussions bloat context. Quality degrades.
- **Switching modes** — going from building to planning, or from strategy review to building. Each mode benefits from clean context.
- **After context compression fires** — if you notice earlier messages are missing, the window is getting stale. Open fresh.

Stay in the same window when:
- Building sequential tasks in a batch (especially XS/S tasks)
- Mid-task and not yet complete
- Having a strategic discussion that informs the next action

**Rule of thumb:** If you've been in the same window for 30+ minutes or 3+ tasks, it's time for a fresh one.

## Housekeeping — Fix Orphaned Tasks

On session start, silently check for and fix:
1. **Orphaned branches:** `git branch | grep feat/task` — cross-reference with board status. Fix by merging or flagging.
2. **In Review tasks with no PR:** If branch is already merged to main, the review_submit step was missed.
3. **Stale In Progress:** Branch has no recent commits — flag it.
4. **Config mismatches:** `.mcp.json` has DATABASE_URL but PAPI_ADAPTER is still `md` — flag it.

**Do this automatically and silently.** Report what you found and fixed.

## Plumbing Is Autonomous

Board status updates, branch cleanup, orphaned task fixes, commit/PR/merge for housekeeping — these are mechanical plumbing. **Do them end-to-end without stopping to ask.** Report after the fact.

## Context Compression Recovery

When the system compresses prior messages, immediately:
1. **Run `orient`** — single call for cycle state
2. Check your todo list for in-progress work
3. Run housekeeping checks
4. **NEVER re-build a task that is already In Review or Done.**
5. Continue where you left off — don't restart or re-plan

## Branching & PR Convention

- **XS/S tasks in the same cycle and module:** Group on shared branch. One PR, one merge.
- **M/L tasks or different modules:** Own branch per task. Isolated PRs.
- **Dependent tasks (any size):** When a task's BUILD HANDOFF lists a `DEPENDS ON` task from the same cycle, `build_execute` automatically reuses the upstream task's branch so commits stack for a single PR. Do not create a separate branch manually.
- **Known bug — verify the base branch on dependent/reused-branch starts.** `build_execute` (start) has a recurring branch-reuse fork bug (seen on task-106/107/112/145): instead of branching off the upstream dependency's branch, it forks the new `feat/cycle-N-<module>` branch off `main`, so the upstream task's commits are missing. It is a PAPI-tool behaviour, not fixable in this repo. **Workaround:** after `build_execute` (start) on a task that should stack on an upstream branch, check the base with `git merge-base HEAD <upstream-branch>` / `git log --oneline main..HEAD` — if it forked off `main`, `git rebase --onto <upstream-branch> main` onto the correct base. Harmless when the two tasks touch disjoint files (both merge to main cleanly), but it ships the cycle as separate PRs instead of one stacked branch, so catch it early rather than rediscover it. (Not in scope to fix here: the EP-callout copy generalisation — no second BHP state exists yet, so generalising the hardcoded 250%/2026-07-01 copy is YAGNI.)
- **Commit per task within grouped branches** — traceable git history.
- **Never use `build_execute` with `light=true` on shared branches.** Light mode commits directly to the current branch without creating a PR. When a shared branch is squash-merged, those commits are collapsed — any CLAUDE.md or documentation changes are stripped. Use light mode only on isolated single-task branches where no squash-merge will occur.

## Quick Work vs PAPI Work

PAPI is for planned work. Quick fixes — just do them. No need for plan or build_execute.

**After completing quick/ad-hoc work** (bug fixes, config changes, small improvements done outside the cycle), call `ad_hoc` to record it. This creates a Done task + build report so the work appears in cycle history and metrics. Don't skip this — unrecorded work is invisible work.

## Data Integrity

- **Use MCP tools for all project data operations.** DB is the source of truth when using the pg adapter.
- Do NOT read `.papi/` files for context — use MCP tools.
- `.papi/` files may be stale when using pg adapter. This is expected.
- **`board_edit` never updates the `cycle` field.** When moving a task into or out of a cycle, always run a SQL update alongside `board_edit`:
  - Adding to current cycle: `UPDATE cycle_tasks SET cycle = <N> WHERE display_id = '<task-id>';`
  - Removing from cycle (backlog): `UPDATE cycle_tasks SET cycle = null WHERE display_id = '<task-id>';`

## Code Before Claims — No Assumptions

**Before making any claim about how the codebase works, read the relevant file first.**

This includes:
- How a feature is implemented ("it works like X") → read the source
- Whether something exists ("there's no baseline migration") → check the directory
- Whether a flow is broken or working → trace it in code
- What a user would experience → check the actual page/component

Do NOT rely on memory, prior conversation, or inference. Read first, then answer.
If the answer requires checking 2-3 files, check them all before responding.

## Process Rules

These rules come from 80+ cycles of dogfooding. They prevent the most common sources of wasted time and rework.

### Building
- **Verify before claiming done.** Hit the endpoint, check the rendered output, confirm the data round-trips. Never say "should work" — prove it works.
- **Preview frontend changes.** After any UI/styling build, provide the localhost URL so the user can visually review. Don't make them ask for it.
- **Debug one change at a time.** When fixing issues, make one change, verify it, then move on. Don't stack multiple untested fixes.
- **Test the write-read roundtrip.** Every data write path must have a verified read path. If you write to DB, confirm the read query returns what was written. This is the #1 source of silent failures.
- **Test after every build.** Run the project's test suite after implementing. Suggest follow-up tasks from learnings when meaningful.
- **Build patiently.** Validate each phase against the last. Don't rush through implementation — test through the UI, not just the API.

### Security
- **Audit before widening access.** Before any build that adds endpoints, modifies auth/RLS, introduces new user types, or changes access controls — review the security implications first. Fix findings before shipping.
- **Flag access-widening changes.** If a build touches auth, RLS policies, API keys, or user-facing access, note "Security surface reviewed" in the build report's `discovered_issues` or `architecture_notes`.
- **Never ship secrets.** Do not commit .env files, API keys, or credentials. Check `.gitignore` covers sensitive files before pushing.
- **Telemetry opt-out.** PAPI collects anonymous usage data (tool name, duration, project ID). To disable, add `"PAPI_TELEMETRY": "off"` to the `env` block in your `.mcp.json`.

### Planning & Scope
- **NEVER run `plan` more than once per cycle.** Adjust the cycle with `board_deprioritise` or `idea` instead.
- **NEVER skip cycles.** Complete and release the current cycle before running the next `plan`.
- **Only build tasks assigned to the current cycle.** Use `build_list` — it filters to current-cycle tasks with handoffs.
- **Don't ask premature questions.** If the project is in early cycles, don't ask about deployment accounts, hosting providers, OAuth setup, or commercial features. Focus on building core functionality first.
- **Split large ideas.** If an idea has 3+ concerns, submit it as 2-3 separate ideas so the planner creates properly scoped tasks — not kitchen-sink handoffs.
- **Auto-release completed cycles.** When all cycle tasks are Done and reviews accepted, run `release` immediately. Forgetting causes cycle number drift and merge conflicts in the next session.

### Communication
- **Show task names, not just IDs.** When summarising board state or reconciliation, include task names — e.g. "task-42: Add supplier form" not just "task-42".
- **Surface the next command.** After each step, tell the user what comes next. Commands should be surfaced, not memorised.

### Stage Readiness
- **Access-widening stages require auth/security phases.** Before declaring a stage complete, check if it widens who can access the product (e.g. Alpha Distribution, Alpha Cohort). If so, auth hardening and security review must be completed first — not discovered after the fact.
- **Pattern:** Audit access surface → fix vulnerabilities → then widen access. Never ship access-widening without a security phase.

## Design System

`PRODUCT.md` and `DESIGN.md` at the project root are the design system source of truth for all UI work. Read both before any frontend task.

- **`PRODUCT.md`** — strategic context: register, users, product purpose, brand personality, approved/banned words, anti-references, design principles, accessibility
- **`DESIGN.md`** — visual system: color tokens (warm stone/amber palette, chart zone colours), typography scale (hierarchy, dollar formatting), component specs (input fields, cliff alert card, manager brief card, CTA buttons), do's and don'ts checklist, the "Oh Shit" test quality bar for the cliff chart output

## Code Style Conventions

- App code is TypeScript under `app/`, `components/`, and `lib/`. The calc engine (`lib/engine/*`) is pure, framework-free TS with no React imports.
- React 19 functional components with hooks only. No class components.
- Standard Next.js build (`npm run dev` / `npm run build`) — no in-browser Babel.
- Components: PascalCase. Event handlers: `handle` prefix. Derived values: `calc` prefix. Pure helpers: camelCase verbs.
- Benefit calculation logic as pure functions: `calcSnap()`, `calcMedicaidValue()`, `calcACAPremium()`, `calcACACSR()`, `calcSection8Value()`, `calcChildcareSubsidy()`, `calcFederalEITC()`, `calcStateIncomeTax()`, aggregated by `getEffectiveTakeHome()`.
- State-specific rules live in per-state modules under `lib/engine/states/*` (one file per state) as `StateRules` objects, registered in `lib/engine/registry.ts` and looked up via `getState(code)` / `getSupportedStates()`.

## Stack Conventions

- Dependencies via npm/`package.json`, pinned to majors (see `package.json`). Next 16, React 19, Tailwind 4, Recharts.
- System fonts only (no custom font loading) — target users are on cheap Android phones. See DESIGN.md.
- Keep the calc engine framework-free and on-device; the only server code is the contact-form route.

## State & Persistence Conventions

- TinyBase is gone (v0.x only). The calculator profile lives in React state (useReducer) and is shared via the URL hash (`lib/profile-url.ts`), not a store or localStorage.
- Data model: one profile — state, familySize, adultCount, current/offered income, benefit flags, lever inputs. Results are never persisted; recalculate from the profile on every render.
- Encode/parse the profile through `lib/profile-url.ts` (clamped + validated). Never write `localStorage`/`sessionStorage` directly.

## Tailwind Conventions

- Phone-first: base styles target 375px. Use `md:` only for tablet/desktop enhancements.
- Scale values only — no arbitrary `w-[347px]` unless necessary.
- Warm, empathetic palette. Stone/amber primary; red/amber for cliff danger zones, green for safe zones. Not a government form — no cold blues or dense grey tables.
- Generous line-height, clear hierarchy. Touch targets >= 44px. Full-width buttons on mobile.
- **Inline `style={{ }}` objects are an accepted, intentional pattern here — not drift.** The chrome, landing, and calculator components deliberately use inline styles that reference the DESIGN.md CSS-variable tokens (e.g. `style={{ color: "var(--...)" }}`) for token-driven values Tailwind utilities don't express cleanly. Do NOT mass-migrate these to Tailwind classes. Keep colours/spacing on tokens (no hardcoded hex); use whichever of Tailwind utilities or token-referencing inline styles reads clearest per component, matching the surrounding file.

## Benefit Calculation Conventions

- All income values in **annual dollars**. Convert to monthly for display only.
- Phase-outs as continuous functions — not binary on/off. Produces smooth cliff chart.
- Chart range: $0 to $200k in $1k increments (201 data points). (Raised from $120k on 10-07-2026 so two-earner households fit.)
- The engine orchestrator is `getEffectiveTakeHome(input: TakeHomeInput)` — an options object `{ annualIncome, familySize, state, adultCount?, pfccEnrolled?, hasVoucher?, employerHealthInsurance?, matchRate?, hsaContribution?, pretax401k?, dependentCareFsa? }` — returning a `TakeHomeBreakdown` `{ grossWages, magi, magiReduction, snapValue, medicaidValue, acaCost, acaCSRValue, section8Value, childcareValue, eitcValue, stateTaxOwed, matchValue, totalEffective }`. `getCliffData(input)` runs it across $0–$200k. See `lib/engine/types.ts` for the canonical contract.
- MAGI (ACA + Medicaid only) = gross income minus pre-tax deductions (`hsaContribution`, `pretax401k`, `dependentCareFsa`). SNAP, EITC, Section 8, childcare, and state tax use gross income.
- Dollar amounts as integers. No floating-point in UI.
- Cite sources inline at top of each state module: `// SNAP limits: USDA FY2026`.

## What NOT To Do

- Do not add a backend for the calculator — the benefit math stays on-device. (The contact-form route `app/api/contact` is the sole exception.)
- Do not add a database, cloud sync, or user accounts for calculator data.
- Do not persist financial inputs to `localStorage`/`sessionStorage` — share state via the URL hash (`lib/profile-url.ts`).
- Do not capture email or gate the calculator (privacy spine).
- Keep the chart on Recharts; do not add another chart library.

## Dogfood Logging

After each `release`, append a dogfood entry capturing observations from the cycle.
Call the adapter method with structured entries for each observation:

- **friction** — workflow pain points, confusing flows, things that broke or slowed you down
- **methodology** — what worked or didn't in the plan/build/review cycle
- **signal** — indicators of product-market fit, user value, or growth potential
- **commercial** — cost, pricing, or business model observations

This is autonomous plumbing — log observations after release without asking.

<!-- PAPI_ENRICHMENT_TIER_1 -->

## Batch Building (unlocked at cycle 6)

For cycles with multiple XS/S tasks, batch build them without stopping between each:
- Build all XS/S tasks first, then M/L tasks
- Group tasks touching the same module onto a shared branch where possible
- One commit per task for traceable history, even on shared branches
- After all tasks built, batch review them together

## Strategy Reviews

Every 5 cycles, PAPI offers a strategy review — a deep analysis of velocity, estimation accuracy, active decisions, and project direction.

- **Don't skip them.** They're where compounding value comes from.
- Strategy reviews run in their own session — don't mix with building.
- Reviews produce recommendations that feed into the next plan.
- If the review recommends AD changes, use `strategy_change` to apply them.

## Active Decision Lifecycle

Active Decisions (ADs) track architectural and product choices with confidence levels (LOW → MEDIUM → HIGH).

- Check ADs before making architectural choices — run `health` for the AD summary.
- ADs are for product/architecture choices only, not process preferences.
- When new evidence appears, update AD confidence via `strategy_change`.
- Supersede rather than overwrite — old decisions stay as history.

<!-- PAPI_ENRICHMENT_TIER_2 -->

## Idea Pipeline (unlocked at cycle 21)

The `idea` tool is your backlog intake — not just for features, but bugs, research, and big ideas.

- When you discover something during a build, submit it via `idea` rather than stopping to fix it.
- Include a `Reference:` line pointing to relevant docs so the planner has context.
- Split large ideas into 2-3 focused submissions for better planner scoping.
- The backlog is the steering wheel — priority + notes shape what gets planned next.

## Doc Registry

Docs are first-class entities. When research or planning produces a stable document:
- Register it with `doc_register` after it's finalised.
- Doc summaries travel with tool context — the planner and strategy review can find relevant docs.
- Keep docs current — update the review header after any change.
- Docs are **private by default** (owner-only). Set `visibility` to `public` (anyone can read) or `team member` (shared with project contributors) only with explicit intent.
- Place the doc body in the matching folder so visibility and location agree: `docs/private/` (owner-only, gitignored — never committed), `docs/contributors/` (team), `docs/public/` (everyone). `doc_register` infers the tier from the folder when you don't pass `visibility`.

## Advanced Patterns

- **Cross-project awareness:** If running multiple PAPI projects, learnings transfer across them via shared patterns and the doc registry.
- **Dogfood friction:** When something feels painful in the workflow, note it — the `idea` tool turns friction into improvements.
- **Deferred tasks are intentional:** Tasks moved to Deferred aren't forgotten — they're parked for the right time.
- **Carry-forward items:** Each plan notes carry-forward from the previous cycle. Check them before planning.
