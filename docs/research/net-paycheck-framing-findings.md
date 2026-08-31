# Net Paycheck vs Effective Income — Framing Findings (FICA + Federal Income Tax)
> Last reviewed: task-165 — 31-07-2026

**Status:** Accepted (owner sign-off 05-08-2026). Option C was accepted and SHIPPED as task-181 in Cycle 26 (FICA + federal income tax folded into the effective number; canonical OH cliff -$9,754 to -$14,636). This review gate is closed; the findings are retained as the build's rationale of record.

Research spike only. No engine or UI code was changed. Every claim below is grounded in the files cited inline.

---

## The gap

`getEffectiveTakeHome` (`lib/engine/takeHome.ts:74-86`) builds `totalEffective` as:

```
grossWages + SNAP + Medicaid + Section8 + childcare + EITC + CTC + acaCSR + 401k match
            − acaCost − stateTaxOwed
```

It subtracts **state** income tax but not **FICA (7.65%)** and not **federal income tax**. So every number the product labels "take-home" / "total effective" is *benefits-effective* — it overstates the level versus what a payslip actually deposits. At the canonical OH $44k household that overstatement is roughly $3.4k (FICA alone); at $70k roughly $5.7k. A skeptical journalist, counselor, or numerate user who compares our "take-home today" to their own paystub will find it too high, and that undercuts the credibility spine the whole AD-7 phase is built on. The honesty gap is not that we include benefits (that is the point of the product) — it is that we quietly omit two of the largest deductions a real worker sees.

---

## Framing options

Scored 1–5, lower = better. "Undercut risk" = risk of diluting the benefits-cliff story that is the product's whole reason to exist.

| Option | User clarity | Credibility | Blast radius / effort | Undercut risk | Total |
|---|---|---|---|---|---|
| **A** — Replace the headline with a pure net paycheck (wages − all tax, **no benefits**) | 2 | 3 | 4 | 5 | **14** |
| **B** — Show BOTH "effective income (incl. benefits)" and "true net paycheck" side by side | 3 | 2 | 4 | 3 | **12** |
| **C** — Fold FICA + federal income tax INTO the existing single effective number, relabel it precisely as an all-in figure (pay + benefits, after **all** taxes) | 1 | 1 | 3 | 1 | **6** |

**Recommendation: C.**

Rationale:
- **A guts the product.** A pure paycheck number always goes *up* with a raise, so the cliff — the entire "oh shit" moment (`DESIGN.md`) — disappears. The effective-marginal-rate-over-100% story (`lib/seo/guide.ts` "effective-marginal-tax-rate" topic) becomes unprovable. Reject.
- **B adds a competing headline.** A "your paycheck went UP" figure sitting next to "your take-home went DOWN" is exactly the confusion a phone-first, ADHD-aware audience (CLAUDE.md) should not be handed. Two headline numbers on a 375px screen is cognitive load, and the paycheck number invites the wrong conclusion. It is also the largest UI surface change (a new element on every result and pSEO surface).
- **C closes the honesty gap at the source.** FICA and federal income tax become two more *subtracted lines in the same sum* — architecturally identical to how state tax and CTC already work. The single headline stays, but now means "everything you actually keep: wages minus every tax, plus the benefits you qualify for." That is journalist-proof and complete. Critically, **the cliff gets deeper, not shallower** (see below), so this *strengthens* the story rather than diluting it. Because the number is engine-derived, every engine-fed surface updates automatically at the next build; only hardcoded copy needs a manual touch. An optional secondary "your paycheck alone" reference line is polish, not core, and can be a later idea.

The precise relabel matters (`PRODUCT.md` voice): "take-home today" is the phrase that reads as a paystub and creates the gap. Something like "what you keep — pay plus benefits, after taxes" is honest about what the number contains.

---

## Blast radius

Every surface that renders a `totalEffective` / `diff` / `currentBenefitValue` / `safeExit` / `cliffAnnotation` number. Two classes: **client** (recomputes live in the browser from `derive.ts`) and **SSG-baked** (computed at build time; a rebuild shifts the number across ALL those pages at once).

### Client-rendered (live in the calculator)
All flow through one derivation, `components/calculator/derive.ts` (`deriveResults` / `deriveDualIncome`). Change the engine and every one of these updates with zero component edits — except where a component names a NEW line item.

| Surface | Number(s) shown |
|---|---|
| `components/calculator/LiveSummaryStrip.tsx` (HeroDelta) | `diff` (the giant headline), `current.totalEffective`, `offered.totalEffective`, `safeExit` |
| `components/calculator/ResultCards.tsx` | per-benefit monthly deltas + "Total hit" (`diff`). **Would need new FICA + federal-tax rows** in `derive.ts`'s `breakdown` |
| `components/calculator/ManagerBrief.tsx` | `currentBenefitValue`, `current/offered.totalEffective`, `diff`, `safeExit` (all three brief lines) |
| `components/calculator/CliffChart.tsx` | the `totalEffective` curve + `cliffAnnotation` |
| `components/calculator/DualIncomePanel.tsx` | `deriveDualIncome` both/solo effective + delta ("is the second paycheck worth it") |

### SSG-baked (shift across all pages at the next build)
| Surface | Number(s) baked | Source |
|---|---|---|
| `app/benefits-cliff/[state]/page.tsx` (8 state hubs) | hero `loss`, answer block, table, chart | `lib/seo/states.ts` `buildHubModel`/`heroScenario` |
| `app/benefits-cliff/[state]/[program]/page.tsx` (program spokes) | scenario `loss` + chart `totalEffective` (per-program `worstDrop` columns are unaffected) | `lib/seo/states.ts` `buildSpokeModel` |
| `app/guide/[topic]/page.tsx` (4 topics) | every worked-example + FAQ dollar figure (Ohio `loss`/`raise`) | `lib/seo/guide.ts` (`ohioExample`) |
| `app/why/page.tsx` | Ohio `loss`, `keptOfRaise` | `heroScenario` |
| `app/benefits-cliff/[state]/opengraph-image.tsx` | per-state hero `loss` (engine-derived) | `heroScenario` |
| `app/methodology/page.tsx` | prose describing what take-home contains → **doc/copy drift**, must state FICA + federal tax are now included |

### SSG but HARDCODED — will NOT auto-update (drift risk, flag prominently)
| Surface | Hardcoded value | Note |
|---|---|---|
| `app/_og/card.tsx` | `−$9,800`, `$85,000 break-even`, `$44k→$70k`, and the `alt` text | Root home OG image. Imported by `app/opengraph-image.tsx`, `app/twitter-image.tsx`, `app/layout.tsx` metadata, and `app/benefits-cliff/[state]/opengraph-image.tsx`. **Hand-typed, not engine-derived** — must be updated manually or (better) refactored to read `heroScenario("ohio")` |
| `PRODUCT_BRIEF.md:24` | `~$9,800 worse off` | Hand-typed canonical figure |
| `DOGFOOD_LOG.md`, `docs/replatform/*`, `docs/state-rules/oh.md` | `9,754` / `9,800` | Historical/reference; lower priority |

### Tests that pin the canonical number
- `lib/engine/__tests__/takeHome.test.ts:36` asserts `netDiff === -9754` **exactly**, plus several `totalEffective` range assertions (lines 21-27, 102-105, 134-137, 160-163). All must be re-baselined.

**Note:** SNAP / Medicaid / childcare / Section 8 program-value columns and `programCliffFacts` / `essentialPlanCliff` are **not** affected — they read individual benefit columns, not `totalEffective`. Only surfaces reading the aggregate shift.

---

## Canonical scenario impact (OH, family of 4, 2 adults, $44k → $70k)

Approximate hand-computation (FICA flat 7.65%; MFJ 2026 standard deduction ~$32k; 10%/12% brackets; CTC/EITC applied as credits against federal tax):

| | Today ($44k) | Offer ($70k) |
|---|---|---|
| FICA (7.65% of wages) | ≈ −$3,366 | ≈ −$5,355 |
| Federal income tax, gross | ≈ $1,200 | ≈ $4,300 |
| ...less CTC offset ($4,000 non-refundable portion) | → ≈ $0 net | → ≈ $300 net |
| **New total deductions vs today** | ≈ −$3,366 | ≈ −$5,655 |

- **Levels drop materially:** "take-home today" falls ≈$3.4k, "after the offer" falls ≈$5.7k. Every displayed level number comes down.
- **The cliff DEEPENS by ≈$2,300.** The incremental deduction across the raise is ≈$5,655 − $3,366 ≈ **$2,289** more taken out at $70k than at $44k, so the canonical drop moves from **≈ −$9,754 to ≈ −$12,000**.
- **Why it steepens, not flattens:** FICA is a flat % of wages, so on a $26k raise it removes a flat ≈$1,989 more. Federal income tax is progressive, so the raise's marginal dollars are taxed at 12% (partly absorbed by the CTC offset), adding ≈$300 more. Both pull the *higher* income down harder than the lower one, so the drop grows. This is the opposite of a risk — a starker cliff is both more honest and more shareable (the exact pattern `DOGFOOD_LOG.md:212` observed when EITC deepened the demo).

Bottom line: the **cliff magnitude moves (grows ~24%)**, not just the levels. Adding FICA + federal tax makes the product's core claim *stronger*.

---

## Correctness subtleties (read before building)

1. **CTC / EITC vs federal tax — the single most important subtlety. Get this wrong and the model double-counts.**
   Today `calcFederalCTC` (`lib/engine/ctc.ts`) and `calcFederalEITC` (`lib/engine/eitc.ts`) return the **full delivered value** and it is added straight into `totalEffective`, on the explicit assumption (ctc.ts:23-26 comment) that "federal income tax itself is not modelled." Once federal income tax IS modelled, that assumption breaks. The CTC/EITC are **credits against federal tax liability**, not standalone cash on top of an untaxed paycheck. If you compute a gross federal tax AND keep adding the full CTC/EITC, you subtract tax that the credit was supposed to erase — double-counting the family's loss.
   The correct model: federal income tax owed = `max(0, grossTax − nonRefundableCredits)`, and the **refundable** portion (ACTC up to $1,700/child, refundable EITC) is what shows up as positive cash. Practically, the cleanest refactor is: compute gross federal tax, then let CTC/EITC offset it, and only the *net* (tax owed, or refund received) hits `totalEffective` — replacing today's "add the full credit, subtract no tax" shortcut. The delivered-value comments in ctc.ts/eitc.ts already flag this as the task-165 follow-up.

2. **FICA wage-base cap.** FICA = 6.2% Social Security (on wages up to the annual SS wage base, ~$176k–$182k for 2026) + 1.45% Medicare (uncapped) = 7.65% flat below the cap. The cliff chart runs to $200k (`takeHome.ts:115`), which **exceeds the SS cap**, so above ~$176k only the 1.45% Medicare portion should apply to the marginal dollar. Model the cap or the top ~$20k of the chart will over-deduct. (The Additional Medicare 0.9% surtax above $250k MFJ is out of the chart band — ignore.)

3. **Income basis.** FICA and federal income tax both key off **gross wages / AGI**, matching the wage-only proxy `tax.ts`, `eitc.ts`, and `ctc.ts` already use — NOT the ACA/Medicaid `magi` (which is reduced by HSA/401k/FSA). Note the nuance: pre-tax 401k/HSA/FSA *do* legitimately reduce federal-taxable income and the Medicare/SS wage base for FICA in reality, so a faithful model would net them out of the FICA/federal-tax base too. Decide explicitly whether to honor that (more accurate, adds a branch) or keep the flat gross-wage proxy for consistency with the existing engine (simpler). Recommend the simple gross-wage proxy for v1, with a citation comment, matching the rest of the engine.

---

## Recommended follow-up build task (draft — do not submit until findings accepted)

**Title:** Model FICA + federal income tax in the take-home engine (true all-in effective income)

**Scope:**
- Add `calcFICA(annualIncome, opts)` and `calcFederalIncomeTax(annualIncome, familySize, opts)` pure functions in `lib/engine/`, mirroring `tax.ts` / `eitc.ts` / `ctc.ts` (sourced constants in `federal.ts`: 2026 SS wage base + rates, MFJ/single/HoH standard deductions + brackets).
- Rework the CTC/EITC handling so credits **offset** the computed federal tax rather than being added as full standalone cash (subtlety #1). Net federal tax (or refund) is what enters `totalEffective`.
- Subtract `ficaOwed` and `federalTaxOwed` in `getEffectiveTakeHome` (`takeHome.ts`); add both to `TakeHomeBreakdown` in `types.ts` (14 → 16 fields) with the same positive-owed convention as `stateTaxOwed`/`acaCost`.
- Honor the FICA SS wage-base cap so the $176k–$200k chart band is correct (subtlety #2).
- Relabel the headline in `LiveSummaryStrip.tsx` from "take-home" to an all-in phrase (PRODUCT.md voice); add FICA + federal-tax rows to `derive.ts` `breakdown` so `ResultCards.tsx` itemises them.
- Re-baseline `takeHome.test.ts` (the exact `-9754` assertion + all `totalEffective` range assertions) and add FICA/federal-tax/credit-offset unit tests.
- Update hardcoded canonical figures: `app/_og/card.tsx` (ideally refactor to derive from `heroScenario("ohio")` so it never drifts again), `PRODUCT_BRIEF.md:24`, README hero stat, and the `app/methodology` prose describing what take-home contains.

**Effort:** M (engine functions + credit-offset rework + FED constants + tests + copy/OG updates). The credit-offset interaction is the risk; everything else is mechanical.

**Acceptance criteria:**
- `totalEffective` = wages − FICA − federal tax − state tax − ACA cost + benefits + refundable credits, with CTC/EITC offsetting federal tax (no double-count); a unit test proves a family at $44k does not both "receive full CTC" and "pay the tax the CTC erases."
- FICA correctly caps the SS portion at the wage base; verified at an income above the cap.
- Canonical OH $44k→$70k cliff recomputed and re-baselined (expected ≈ −$12k); the cliff is deeper than −$9,754, not shallower.
- Every engine-derived surface (state hubs, spokes, guide topics, /why, per-state OG) reflects the new number after a build; hardcoded OG/copy updated to match.
- `/methodology` states plainly that FICA and federal income tax are now included.
- Headline relabelled; `ResultCards` itemises FICA + federal tax; `npm run build` + full test suite green.
