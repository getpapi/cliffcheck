# VibeJam 2026 — Judging Criteria Scorecard
> Last reviewed: task-78 — 25-04-2026

**Status:** Findings draft — pending owner triage. **DO NOT** auto-create follow-up fix tasks.

**Method:** Reasoning-first-then-score (per task-57 pre-mortem mitigation against self-scoring bias). Read the reasoning first; the score should fall out of it. Cross-referenced against `.impeccable.md`, `docs/design/critique-2026-04-24.md` (C7), and the 8-case page-load validation harness.

**Today's honest position: 19/25 (≈ 4.0 average).** Highest-leverage pre-submission lever: applying the C7 design critique items 1–3 (already documented, not done). One fix, three criteria lift.

---

## Scorecard summary

| # | Criterion | Score | Lift target | Highest-leverage lever |
|---|---|---|---|---|
| 1 | Design | **3 / 5** | → 4 | Apply C7 critique 1-3: dedup outcome cards, flatten cards-in-cards, restore reading order |
| 2 | Functionality | **4 / 5** | → 5 | Add "Try the demo" pre-loaded scenario button |
| 3 | Market viability | **4 / 5** | → 5 | Add README "Why this scales" with 2 concrete revenue paths |
| 4 | Creativity | **4 / 5** | → 5 | Same fix as Design — concentrating the shock = removing duplication |
| 5 | Technical sophistication | **4 / 5** | → 4.5 | Add README "Tech architecture" callout naming FED/STATES + IIFE harness |
| | **Total (honest)** | **19 / 25** | **→ 22+ / 25** | One ~2hr design pass + ~45min copy = +3 points |

---

## 1. Design — **3 / 5**

### Reasoning

✅ **What works:**
- Phone-first layout (375px primary, `md:` enhancement only). Tested via inspection.
- Warm stone/amber palette honoured app-wide. Trust badge persistent at top.
- Cliff chart is genuinely visceral — red-fill drop zones, dashed markers, no smoothing (step functions per `.impeccable.md` Section 6).
- Three trust signals satisfied: persistent device-only banner, no login, no email ask.
- Empathetic copy ("Your $26k raise makes you $5.5k poorer") not government-form ("Net effective income decreases…").
- Footer credits just toned down to system-font + stone-400 (task-55).

❌ **What still violates `.impeccable.md` — flagged by C7 critique, not fixed:**
- **Cards-in-cards anti-pattern** (`.impeccable.md` Section 10 hard NEVER): `LiveSummary` nests `bg-red-50 rounded-xl` and `bg-green-50 rounded-xl` cards inside its own `bg-white rounded-2xl` card (`index.html:891–918, 920–931`). C7 critique #2: "Must-fix, blocking next UI build." Still present.
- **Reading order broken** (`.impeccable.md` Section 7 specifies form → live summary strip → chart → cards → brief): actual order on mobile is form → chart → giant `LiveSummary` card → manager brief. C7 critique #3: still not fixed.
- **Equal-weight squint failure**: slider `$X/yr` is `text-2xl font-extrabold` (`index.html:659–660`); `LiveSummary` totals are `text-3xl font-extrabold` (`index.html:866`). Three near-equal hero candidates. Brief Section 5 specifies hero at `clamp(2.5rem, 5vw, 3.5rem)`.
- **Outcome card duplication**: cliff alert + safe-exit appear in both `LiveSummary` AND in the manager brief copy lines. The chart's own annotations also display the cliff drop. The "oh shit" moment is dampened by repetition.
- **Token drift**: `ManagerBrief` uses `bg-amber-50` (#FFFBEB), `.impeccable.md` Section 8 specifies cream `#FFF7ED` (orange-50). Copy CTA is `bg-amber-400`, brief specifies `amber-500`.

### Score: **3 / 5**

A 4 needs the C7 hard-NEVER violations cleared. Currently a 3 because two anti-patterns from the project's own design bible are visibly present on the cliff chart page — exactly where judges land.

### Lever to 4 (≈ 2hr work, pre-submission risky if rushed)

Apply C7 critique items 1–3 in order:
1. **De-dup outcome cards** — strip the inner red-50 / green-50 cards from `LiveSummary`; keep only the today-vs-after totals + breakdown. Cliff alert + safe-exit lives below the chart only.
2. **Flatten cards-in-cards** — the inner cards become full-bleed bands or sibling components, not nested.
3. **Restore reading order** — replace `LiveSummary` (post-chart card) with a slim `LiveSummaryStrip` (single-line stone-100 band) between form and chart.

Token-drift cleanup (orange-50 cream + amber-500 CTA) is a +0.5 if done with the rest. Critical: smoke-test the chart at 375px after each change.

---

## 2. Functionality — **4 / 5**

### Reasoning

✅ **What works:**
- Real FY2026 calculations across 4 states: SNAP, Medicaid, ACA premium tax credit, Section 8 HCV, childcare subsidy. Federal-uniform vs state-specific decomposition is clean (FED + STATES).
- 8-case page-load IIFE validation harness (`index.html:436–581`) verifies the demo scenario, single-parent, voucher-holder, TX non-expansion, TX childless, NC expansion-no-BBCE, MI expansion+BBCE, cross-state regression. Runs on every refresh.
- Real-time slider → chart redraw, no submit button (CLAUDE.md L325 + `.impeccable.md` Section 7 compliance).
- Phase-outs continuous (SNAP $0.30/$1, ACA piecewise linear) — no false binary cliffs except where HUD policy says they exist.
- Manager brief copy-to-clipboard is functional, generates 3-line negotiation script.
- Public URL reachable: GitHub Pages 200 (`cathalos92.github.io/cliffcheck/`). Cloudflare Workers path retired post-submission (task-78).
- Source citations inline at every state module — judges can audit the math.

⚠️ **Gaps:**
- **No "Try the demo" pre-loaded scenario** — judges open the app and see DEFAULTS already populated (OH, $44k → $70k, family of 4) — which IS the cliff demo. But there's no explicit "see the worked example" button. PRODUCT_BRIEF.md L93 explicitly lists "Demo mode (pre-loaded scenario)" as a remaining submission checklist item. Still not built.
- Family size > 6 silently clamps to family-of-6 row in `calcSnap` and `calcACAPremium` (task-55 F5). Unreachable for canonical demo.
- Default state is OH; non-OH judges have to toggle to see TX/NC/MI.

### Score: **4 / 5**

A 5 needs the "Try the demo" button and ideally a tiny cross-state visual cue.

### Lever to 5 (≈ 30 min)

Add a "Try the demo" button to the empty state (or as a header utility) that:
- One click → loads `{ stateCode: 'OH', familySize: 4, currentIncome: 44000, offeredIncome: 70000, adultCount: 2, pfccEnrolled: true }` into TinyBase
- Brief flash/scroll-to-chart so the cliff is the next thing the judge sees
- Optional second click → cycles through the 4 states' identical scenario, surfacing the cross-state difference

Pure UI work, no calc changes. Lifts Functionality 4→5 because the canonical demo becomes a one-click experience.

---

## 3. Market viability — **4 / 5**

### Reasoning

✅ **What works:**
- No consumer-facing competitor — verified in `docs/research/all-states-findings.md`. Government tools (BenefitsCheckUp, GetCalFresh, MyBenefits) show single-program eligibility, never aggregate effective income.
- Atlanta Fed CLIFF dashboard exists for researchers, not consumers; no phone-first cliff visualiser anywhere.
- Target audience is large: 44% of Texas households are ALICE-threshold; similar across non-coastal states. ~30M+ U.S. households.
- Revenue paths are plausible: premium state packs, employer onboarding integration ("show our team why this raise actually pays"), social-worker / benefits-counselor SaaS, HR-platform embeddable widget.
- Local-first architecture removes the #1 barrier to financial-data adoption (cloud trust).

⚠️ **Gaps:**
- README has a 1-row criteria callout table but no narrative on **who pays, what they pay for**. Judges scoring "market viability" want a one-paragraph thesis.
- No mention of TAM, no mention of go-to-market wedge.
- No "I'd buy this" qualitative signal from target users (would require testing — out of scope).

### Score: **4 / 5**

A 5 needs a concrete commercial thesis visible to judges in <60s.

### Lever to 5 (≈ 15 min)

Add a "Why this scales" section to README between "What it does" and "Stack". Two concrete revenue paths, one paragraph each:

1. **Employer benefits-counselling tool** — HR teams use it during raise/promotion conversations to show employees the real numbers, reducing turnover from misaligned offers. Wedge: pilots with 100-employer benefits-broker firms.
2. **Social worker / benefits counselor pro license** — scaled-up version with case management, multi-client save, exportable reports. Existing tools (BenefitsCheckUp Pro) charge $25–$80/mo per seat for less.

Both leverage the local-first architecture as a trust differentiator.

---

## 4. Creativity — **4 / 5**

### Reasoning

✅ **What works:**
- The "oh shit" cliff chart IS the brand premise. A V-shaped drop with red-fill annotation is genuinely visceral — judges feel it before they read it. This is the reveal that no other consumer product offers.
- Hidden truth made visible: most people understand "I'll lose some benefits if I earn more" as a vague feeling. CliffCheck shows them: $26k raise → $5.5k poorer. The math is the message.
- "Safe exit income" framing turns a defensive number into a negotiation target — small reframe, meaningful psychological shift.
- Manager brief as **actionable artifact** ≠ calculator. Most cliff calculators stop at "here's your number"; CliffCheck hands the user a copy-pasteable script.
- The phone-first format itself is creative — financial-cliff visualisations historically live in academic PDFs and government-funded research dashboards.

⚠️ **Gaps:**
- The shock is **diluted by duplication** — current/offered totals appear in `LiveSummary` totals AND in the inner red-50 alert card AND in the manager brief copy. Three near-identical statements of the same data. Concentration would amplify.
- No story/onboarding moment — DEFAULTS happen to be the demo scenario, so a first-time visitor sees the cliff, but there's no "here's what you're looking at" framing.

### Score: **4 / 5**

A 5 needs the shock moment to be singular and unmistakable.

### Lever to 5 (concentration, not addition)

Same fix as Design lever above. Removing the LiveSummary duplication and leaving the cliff chart + ONE post-chart cliff-alert card as the visual climax concentrates the "oh shit" beat. Pair with the "Try the demo" button (Functionality lever) and the first 5 seconds of the judge's experience become: click button → screen scrolls to chart → V-drop visible → red callout names the loss. That's a 5/5 reveal.

---

## 5. Technical sophistication — **4 / 5**

### Reasoning

✅ **What works:**
- Local-first privacy verified end-to-end (task-58 audit) — single namespaced TinyBase key, profile data only, no third-party data calls. The privacy claim is **verifiable**, not marketing.
- Single-file VibesOS app: no build step, no `package.json`, no bundler, all CDN. Track-stack perfect.
- Pluggable state-rule engine: federal-uniform rules in FED, state overrides in STATES.XX with consistent shape (snap, medicaid, aca, childcare, housing). 4 states implemented; adding a 5th is a single object literal + a validation case.
- Page-load IIFE regression harness (8 cases) — replaces a test runner with an in-page assertion block. Cycle-history-validated approach (DOGFOOD note).
- React 19 + TinyBase + Tailwind + Chart.js — modern, on-trend stack.
- Phase-out math is continuous (not binary) — the cliff chart accurately reflects benefit policy, including Section 8's intentional 50%-AMI hard cliff.
- Source citations inline at every STATES.XX block — auditable.

⚠️ **Gaps:**
- No SRI hashes on CDN scripts (task-58 P1, not safely fixable pre-submission).
- No CSP (task-58 P2, defence-in-depth only).
- README doesn't explicitly **name the technical primitives** — judges scanning for sophistication signals could miss the FED/STATES architecture, the IIFE harness, or the local-first verification. Buried as "Stack — VibesOS".

### Score: **4 / 5**

A 5 in this criterion is "novel-tech-or-pushes-boundaries" territory (think real-time multi-user, novel ML inference, complex physics). CliffCheck's sophistication is in **constraint-fit and verifiable correctness**, not novel tech. Honest 4 — exceptional within the constraint, not boundary-pushing.

### Lever to 4.5 (≈ 15 min)

Add a "Tech architecture" callout to the README with three named primitives:

- **FED + STATES rule engine** — federal-uniform calculations in `FED` + state-specific overrides in `STATES.XX`. Adding a state is a single object literal + a validation case.
- **In-page IIFE validation harness** — 8 demo scenarios assert the cliff math on every page load. No test runner, no CI — the regression net runs in the browser.
- **Local-first privacy** — profile data persists to a single namespaced TinyBase store (`cliffcheck-v1`); audit ([docs/security/audit-findings.md](../security/audit-findings.md)) verifies no third-party data calls.

Concentrates the sophistication signal where judges look. Judges scanning won't infer the architecture from `index.html` source — they need the README pointer.

---

## Cross-criterion lever ranking (best score-per-minute moves)

| # | Lever | Time | Lifts | Risk |
|---|---|---|---|---|
| **A** | **C7 design critique 1-3 (dedup, flatten, reading order)** | ~2hr | Design 3→4, Creativity 4→5 | **Medium** — chart smoke-test required |
| **B** | "Try the demo" button | ~30 min | Functionality 4→5, amplifies A | Low |
| **C** | README "Why this scales" + "Tech architecture" sections | ~30 min | Market 4→5, Tech 4→4.5 | Zero |
| **D** | Token drift cleanup (orange-50 cream + amber-500 CTA) | ~20 min | Design +0.5 if not already moved by A | Zero |

**Sequencing if pursued pre-submission:**
1. Do **C** first — zero-risk copy edit, +1.5 points immediately.
2. Do **B** next — concrete UI work, +1 point, smoke-testable in <2 min.
3. Do **A** if time permits and willing to risk a regression on the cliff chart. +1 to +1.5 points but highest-stakes change.
4. Skip **D** if **A** is done; A's token cleanup subsumes it.

**If only one move:** **C**. Lowest risk, broad lift across two criteria, explicit signal where judges look.

**If two moves:** **C + B.** Both low-risk and concrete; combined they take ~1hr and lift Market + Tech + Functionality.

**Total achievable pre-submission with C+B: 19/25 → ~22/25 in ~1 hour of work.**

---

## Linkage map (what unblocks what)

```
[Try the demo button] ──┐
                        ├──→ judges' first 5 seconds = chart + cliff visible immediately
[Reading order fix]  ──┘     (concentrated "oh shit" moment)

[De-dup outcome cards] ──→ Single shock moment (Creativity)
                       ──→ Cleared anti-patterns (Design)

[README "Why this scales"] ──→ Market thesis visible in <60s
[README "Tech architecture"] ──→ Sophistication signals not buried
                              ──→ Both: judges scoring on rubric find evidence quickly
```

---

## What I deliberately did NOT do

- Did NOT submit follow-up backlog ideas to the `idea` tool — handoff explicitly forbids until owner approval (per task-57 SCOPE BOUNDARY).
- Did NOT redo the C7 design critique — referenced its findings instead.
- Did NOT implement any of the levers — pure analysis, per handoff scope.
- Did NOT score Section 8's hard cliff as a Tech minus — task-55 F6 confirmed it's intentional HUD policy.

## Owner decision needed

Three questions:

1. **Approve the doc?**
2. **Pursue any pre-submission levers?** Recommended: **C** (15 min, zero risk, +1.5) or **C + B** (~1hr, low risk, +2.5).
3. **Convert remaining lever proposals (A + D) into Cycle-9 backlog ideas?**

Awaiting call. No follow-up tasks created.
