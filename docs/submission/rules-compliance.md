# VibeJam 2026 — Rules Compliance Gap Analysis
> Last reviewed: task-78 — 25-04-2026

**Status:** Findings draft — pending owner triage. **DO NOT** auto-create follow-up fix tasks. Human decides which become P0 fixes.

## Framing correction

The "rules" for VibeJam 2026 are the **5 judging criteria** — Design, Functionality, Market viability, Creativity, Technical sophistication. The owner restated these as the canonical rule set in `PRODUCT_BRIEF.md` (L53–58) and `CLAUDE.md` (L30–37). There is no separate hidden rule book to fetch.

What this means for compliance vs. scoring:
- **Compliance gates** (binary PASS/FAIL): the submission must be (a) open-source on a public repo, (b) on the VibesOS stack — single-file React + TinyBase + Tailwind, no build step, CDN-only, (c) reachable by judges, (d) submitted within the timeline (Apr 20–25, 2026).
- **Scoring** (1–5 per criterion): handled by **task-57** (judging scorecard). That is where build-effort should be focused — not on compliance theatre. Build TOWARDS the 5 criteria.

This audit covers (a)–(d) only. Scoring optimisation is task-57's job.

---

## Compliance gates

| # | Gate | Status | Evidence | Fix needed |
|---|---|---|---|---|
| 1 | **Reachable by judges** | ✅ **PASS** | GitHub Pages `cathalos92.github.io/cliffcheck/` returns 200 publicly. Cloudflare Workers path retired post-submission (task-78). | None. |
| 2 | **Open-source — LICENSE in repo root** | ❌ **FAIL** | No `LICENSE` file at repo root. Public on GitHub but no licence = ambiguous open-source status. | Add `LICENSE` (MIT). |
| 3 | **Open-source — README in repo root** | ❌ **FAIL** | No `README.md` at repo root. | Create `README.md` covering: 1-line tagline, live URL(s), repo URL, demo scenario, local-run, AI-assistance disclosure, licence reference. |
| 4 | **Single-file HTML constraint** (CLAUDE.md L322 — "hard VibeJam track rule") | ✅ **PASS** | Repo root has only `index.html`. No `.js`/`.ts`/`.tsx`/`.jsx` files; no `package.json`, no bundler config. | None. |
| 5 | **No build step / CDN-only imports** | ✅ **PASS** | All deps loaded via `unpkg`, `jsdelivr`, `esm.sh` in `index.html` head. | None. |
| 6 | **VibesOS stack — React 19 + TinyBase + Tailwind** | ✅ **PASS** | All three loaded via importmap and CDN (verified in `index.html:9–22`). | None. |
| 7 | **VibesOS stack hosting** | ✅ **PASS** | GitHub Pages serves the same single `index.html` byte-for-byte. Workers path retired post-submission (task-78). VibesOS track spirit (single HTML + CDN-only, no build) is fully preserved. | None. |
| 8 | **Repo publicly accessible** | ✅ **PASS** | `gh repo view cathalos92/cliffcheck --json visibility` → `PUBLIC`. | None. |
| 9 | **Submission within timeline** (Apr 20–25, 2026) | ✅ **ON TRACK** | Today is 2026-04-25. Repo has commits within the window. | Submit before midnight PST. |

---

## URL strategy — DECIDED + RETIRED

**Decision (owner, 2026-04-25):** Submitted `https://cathalos92.github.io/cliffcheck/` (GitHub Pages) as the primary judge URL. Cloudflare Workers path was retained at submission time as track-stack evidence, then retired post-submission via task-78 (`wrangler.toml` removed, references cleaned).

**Why this works:** VibesOS track spirit is the stack (single HTML + React + TinyBase + Tailwind + CDN-only, no build step) — GitHub Pages serves the identical artifact byte-for-byte.

Gates 1 and 7 are now resolved → ✅ PASS.

---

## Remaining fix order

1. **Add `LICENSE`** (MIT). ~5 min.
2. **Add `README.md`** — tagline, GitHub Pages URL (primary), repo URL, demo scenario, local-run, AI-assistance disclosure (Claude Code + PAPI), licence reference. ~20 min.

After these two, **all compliance gates close**. Remaining build effort goes to task-57 — score-lifting work against the 5 judging criteria.

## Out-of-scope items discovered

- Code quality findings: defer to task-55 (PAPI codebase audit)
- Security findings (XSS, secrets, SRI/CSP): see task-58 — zero P0s
- Judging-criteria scoring + score-lift levers: **task-57** — this is where the real submission-quality work lives
