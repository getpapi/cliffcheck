# CliffCheck — Benefits Cliff Navigator
> Last reviewed: webmcp-challenge — 31-08-2026

> See the hidden math that keeps families stuck. Find out if a raise actually makes you poorer.

**Live app:** **https://cliffcheck.com** (phone-first — open on mobile for the intended experience)

A working-class American earning $44k can be offered a $26k raise and end up **~$14.6k poorer** in effective take-home — once SNAP, Medicaid, ACA premium tax credits and cost-sharing reductions, Section 8, the federal EITC and Child Tax Credit, childcare subsidies, state income tax, and FICA all stack against the raise. The math is deliberately hidden by fragmented benefit systems. CliffCheck reveals it.

Originally built for **VibeJam 2026** (VibesOS track, 3rd place); since re-platformed to Next.js and in active post-hackathon development.

---

## What it does

1. Pick your state (16 live: OH, TX, NC, MI, FL, GA, PA, NY, AZ, IL, CA, WA, VA, TN, MO, IN).
2. Enter family size, adult count, current income (annual salary or hourly rate × hours), and which benefits you receive.
3. Move the income slider — watch the cliff chart redraw in real time. Cliffs (ranges where a raise costs more than it earns) are highlighted; safe-exit income is shown above the fold.
4. Generate a **manager brief** — a copy-pasteable script for negotiating either a raise large enough to clear the cliff, or staying put.

All calculation runs locally in your browser. **No financial data leaves your device.** Your scenario lives in page state and can be shared via the URL hash (nothing is uploaded); there are no accounts and no server-side calc.

## WebMCP — agent-callable

CliffCheck exposes its calc engine as [WebMCP](https://developer.chrome.com/docs/ai/webmcp) tools, so an in-browser agent (ChatGPT's in-app browser, or Chrome with WebMCP enabled) can run cliff math directly on the page instead of scraping the DOM. The tools run entirely client-side — same on-device privacy guarantee as the human-facing UI.

Tools registered (see [`lib/webmcp/`](lib/webmcp/)):

| Tool | What it does |
|---|---|
| `calculate_cliff` | Given state, family size, current and offered income, returns the effective take-home before/after and the net cliff delta |
| `get_cliff_curve` | Returns the full effective-take-home curve ($0–$200k) for a household, so the agent can chart or locate every cliff |
| `get_safe_exit` | Returns the lowest income where effective take-home clears the current level with a buffer |
| `list_supported_states` | Returns the state codes with live rule data |

Built for the **OpenAI WebMCP Challenge** (Sept 2026). Demo video and write-up: see the challenge submission.

## Why it matters

| Criterion | What CliffCheck does |
|---|---|
| **Design** | Phone-first, warm stone/amber palette, empathetic copy — not a government form |
| **Functionality** | Real FY2026 benefit calculations across 16 states, real-time interactive cliff chart, actionable manager brief |
| **Market viability** | No consumer-facing tool does this. Government tools show single-program eligibility, never aggregate effective income |
| **Creativity** | Reveals the "oh shit" moment — a modest raise can cost far more than it pays. Visceral, measured, hidden in plain sight |
| **Technical sophistication** | Local-first privacy (data never leaves device), pluggable per-state rule engine (`lib/engine/`), WebMCP agent surface, programmatic SEO |

## Demo scenario

**Ohio warehouse worker, family of 4, currently earning $44k.** Offered a promotion to $70k.

- Loses SNAP, Medicaid, and most childcare (PFCC) support; incurs ACA premiums (partially offset by the cost-sharing reduction at 200–250% FPL); Ohio state tax rises; most of the federal EITC phases out; FICA and progressive federal income tax take a larger share of the higher wage.
- **Net**: a $26k raise leaves them **~$14,600 worse off** in all-in take-home (engine-true −$14,636).
- **Safe exit**: ~$99k — first income where effective take-home clears the current level with a buffer.
- The $44k→$48k range is the sharpest danger zone — the PFCC childcare phase-out dominates the cliff shape.

Open the app, click **"Try the demo"**, watch the chart.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Pure-TS calc engine** in `lib/engine/*` (framework-free) — one file per state, one per benefit program
- **Tailwind CSS 4** — phone-first styling; system fonts only
- **Recharts** — cliff visualisation, $0–$200k at $1k increments
- **WebMCP** adapter in `lib/webmcp/*` — registers the engine as agent-callable tools, client-side only
- The only server route is the contact form (`app/api/contact`)

## Tech architecture

**FED + STATES rule engine** (`lib/engine/`). Federal-uniform rules live in `federal.ts` (SNAP tables, ACA premium caps, FPL). State overrides live in typed `states/{code}.ts` files wired through `registry.ts`. Adding a state is one file + one registry entry — no engine changes.

**Vitest engine suite** (`lib/engine/__tests__/`). Per-program and per-state tests assert the cliff math plus a gov-source provenance guard; `npm test` runs the full regression net. A data-driven sweep covers every supported state.

**Local-first privacy.** Profile data never leaves the page: your scenario lives in React state and is encoded into the URL hash (`lib/profile-url.ts`) for sharing, never written to `localStorage`, `sessionStorage`, or any store. The security audit at [`docs/security/audit-findings.md`](docs/security/audit-findings.md) verifies no third-party data calls.

## Run locally

```bash
git clone https://github.com/getpapi/cliffcheck.git
cd cliffcheck
npm install
npm run dev      # dev server at http://localhost:3000
npm run build    # production build
npm test         # engine regression suite
```

The original single-file `index.html` is legacy/dead code from the v0.x hackathon build, kept for reference only — do not run it.

## AI assistance disclosure

CliffCheck was built with [Claude Code](https://claude.com/claude-code) (Anthropic) as the primary development tool, using the **PAPI** project-management methodology (planning → building → reviewing in cycles). Cycle history and architecture decisions are tracked in [`CLAUDE.md`](CLAUDE.md) and [`PRODUCT_BRIEF.md`](PRODUCT_BRIEF.md).

The benefit calculation rules (SNAP, Medicaid, ACA, Section 8, state childcare subsidies, EITC, CTC) were sourced from cited federal and state government documents and verified against published FY2026 thresholds. Inline citations live in the calculation modules under [`lib/engine/`](lib/engine/).

## Licence

**AGPL-3.0-or-later.** See [`LICENSE`](LICENSE). Any hosted derivative must publish its source under the same terms.

This is a public mirror for the OpenAI WebMCP Challenge. Primary development happens in a separate private repository; this mirror carries the full working tree at submission time.

## Data sources

- SNAP income limits and benefit tables — USDA FNS FY2026
- Medicaid eligibility — state-specific rules for each supported state
- ACA marketplace premium tax credit logic — Healthcare.gov / IRC §36B
- Section 8 / HCV payment standards — HUD
- Childcare subsidy thresholds — state DHS rule books
- Federal poverty guidelines — HHS/ASPE FY2026
- Federal EITC and Child Tax Credit — IRS FY2026

Citations are inline in the relevant calculation modules under `lib/engine/`.
