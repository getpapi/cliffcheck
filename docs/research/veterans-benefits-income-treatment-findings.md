# VA Disability Compensation: Income-Treatment Matrix + Engine Findings
> Last reviewed: task-178 — 02-08-2026

**Status:** Accepted (owner sign-off 05-08-2026). Follow-up build task filed to the backlog (see section 6); the planner will scope it in a future cycle. Findings retained as the build's rationale of record.

Research spike only. No engine or UI code was changed. Every counted/excluded claim and every dollar figure below is cited to a primary government source, with retrieval dates. Where a claim could not be verified against a primary source it is marked UNVERIFIED in place.

---

## 1. The gap

CliffCheck models a household whose only income is wages. For veteran households that is wrong in a way that misstates the cliff in both directions:

- VA disability compensation is tax-free monthly cash (federal program, identical in all 50 states). A 100 percent rated veteran with a spouse and two children receives $4,428.10 per month, about $53,137 per year, on top of any wages. Ignoring it understates the household's real position.
- More importantly for the product's core story: that same $53,137 IS counted by SNAP and Section 8. So a veteran household hits the SNAP gross-income test and the Section 8 income limit at a much lower wage than the calculator currently shows. The cliffs sit further LEFT on the wage axis for veterans, and the tool currently draws them in the wrong place.
- Meanwhile ACA/Medicaid MAGI and the EITC ignore VA compensation entirely, so a naive "add it to income everywhere" fix would be just as wrong in the other direction. The counted/excluded split is program-by-program, which is exactly the kind of hidden math this product exists to reveal.

Scale: VBA serves 6.5 million compensation and service-connected death benefit recipients (VBA Annual Benefits Report, FY2024, benefits.va.gov/REPORTS/abr/docs/2024-abr.pdf, retrieved 02-08-2026). That is a large, identifiable, underserved audience segment with a distinct cliff shape, and a natural pSEO surface ("does VA disability count as income for SNAP" is a real search query the matrix below answers with citations).

---

## 2. The income-treatment matrix

Is VA disability compensation counted as income by each program? All cells verified against primary sources on 02-08-2026.

| Program | Treatment | Primary source | URL | Retrieved |
|---|---|---|---|---|
| MAGI: ACA premium tax credit | EXCLUDED | 42 CFR 435.603(e): MAGI-based income uses the section 36B(d)(2)(B) IRC methodology; VA compensation is excluded from gross income by 26 USC 104(a)(4) and is not one of the 36B add-backs (tax-exempt interest, foreign income, non-taxable Social Security). Healthcare.gov income page lists "Veterans' disability payments" under "Don't count these income types". | ecfr.gov/current/title-42/part-435/section-435.603; healthcare.gov/income-and-household-information/income/ | 02-08-2026 |
| MAGI: Medicaid (expansion / MAGI pathways) | EXCLUDED | Same basis: 42 CFR 435.603(e) adopts the IRC 36B MAGI methodology, and VA disability compensation never enters gross income (26 USC 104(a)(4), quoted in row 5). Caveat: non-MAGI Medicaid pathways (aged/blind/disabled) use SSI-style counting and DO count VA compensation; the engine models MAGI Medicaid only, so this does not affect the engine. | ecfr.gov/current/title-42/part-435/section-435.603 | 02-08-2026 |
| SNAP | COUNTED (unearned income) | 7 CFR 273.9(b)(2)(ii): unearned income includes "Annuities; pensions; retirement, veteran's, or disability benefits; worker's or unemployment compensation...". Regular monthly VA compensation appears nowhere in the 273.9(c) exclusion list. | ecfr.gov/current/title-7/part-273/section-273.9 | 02-08-2026 |
| Section 8 / HCV (HUD annual income) | COUNTED | 24 CFR 5.609(a)(1) (post-HOTMA text): annual income includes "all amounts, not specifically excluded in paragraph (b)..., received from all sources". The only VA-related exclusions are 5.609(b)(16), deferred VA disability benefits received as a lump sum or prospective monthly amounts (i.e. retroactive awards), and 5.609(b)(17), aid and attendance payments under 38 USC 1521. Ongoing monthly compensation is counted. | ecfr.gov/current/title-24/part-5/section-5.609 | 02-08-2026 |
| EITC | NOT EARNED INCOME (no direct effect either way) | IRS Publication 596 (2025): "Examples of items that aren't earned income include... veterans' benefits, including VA rehabilitation payments." VA compensation also never enters AGI (26 USC 104(a)(4)), and the EITC phase-out uses the greater of earned income or AGI, so VA compensation neither qualifies a household for EITC nor phases it out. | irs.gov/publications/p596 | 02-08-2026 |
| Federal income tax | NON-TAXABLE | 38 USC 5301(a)(1): payments of benefits under any law administered by the VA "shall be exempt from taxation" (verbatim from govinfo). 26 USC 104(a)(4): gross income does not include "amounts received as a pension, annuity, or similar allowance for personal injuries or sickness resulting from active service in the armed forces" (verbatim from govinfo). IRS Publication 525 (2025) confirms disability compensation and pension payments from the VA are not included in income. | govinfo.gov/content/pkg/USCODE-2023-title38/html/USCODE-2023-title38-partIV-chap53-sec5301.htm; govinfo.gov/content/pkg/USCODE-2023-title26/html/USCODE-2023-title26-subtitleA-chap1-subchapB-partIII-sec104.htm; irs.gov/publications/p525 | 02-08-2026 |
| State income tax | EXCLUDED (structural principle; see note) | Every state income tax the engine models starts from federal AGI or federal taxable income, and VA compensation never enters federal gross income (26 USC 104(a)(4), 38 USC 5301(a)(1)). A state would need an affirmative add-back to tax it, and none is known to exist. NOTE: this cell is a derivation from the federal statutes, verified at the federal level only; it was NOT verified state-by-state against each Department of Revenue. The engine models state tax off gross wages, so the only engine requirement is that VA compensation is never added to the state-tax base, which needs no per-state data. | Federal statutes above | 02-08-2026 |
| Childcare subsidies (CCDF) | STATE-SET (commonly counted; verify per state) | Federal CCDF regulations set only the ceiling (family income at or below 85 percent of state median income, 45 CFR 98.20(a)(2)) and delegate eligibility definitions, including what counts as income, to the lead agency's CCDF Plan (45 CFR 98.16(g) and 98.16(i)(5)). Most states count gross unearned income, which sweeps in VA compensation, but there is no federal rule compelling that. UNVERIFIED at the individual-state level: no specific state's countable-income rule was verified in this spike (an attempt to fetch Ohio's publicly funded child care income rule at codes.ohio.gov was refused by the server). Any build must either verify per live state or carry an explicit modelling-assumption note. | ecfr.gov/current/title-45/part-98/section-98.20; ecfr.gov/current/title-45/part-98/section-98.16 | 02-08-2026 |

Summary shape: VA compensation is invisible to the tax-and-MAGI world (federal tax, state tax, ACA, MAGI Medicaid, EITC) and fully visible to the cash-assistance world (SNAP, Section 8, and usually state childcare). That asymmetry is the whole modelling story.

---

## 3. Dollar-amount source

Source: VA disability compensation rate table, va.gov/disability/compensation-rates/veteran-rates/ (retrieved 02-08-2026). **Effective December 1, 2025.** Federal program: identical amounts in all states, paid monthly, tax-free.

The table is two-dimensional: rating (10 to 100 percent in 10-point steps) by dependent status (alone, with spouse, with children, with dependent parents). Per the page, veterans rated 10 or 20 percent receive no dependent add-on: "If you have a 10% to 20% disability rating, you won't receive a higher rate even if you have a dependent spouse, child, or parent."

Example monthly rates (effective 01-12-2025):

| Scenario | Monthly | Annual |
|---|---|---|
| 10 percent, veteran alone | $180.42 | $2,165 |
| 30 percent, veteran alone | $552.47 | $6,630 |
| 50 percent, veteran alone | $1,132.90 | $13,595 |
| 100 percent, veteran alone | $3,938.58 | $47,263 |
| 100 percent, with spouse | $4,158.17 | $49,898 |
| 100 percent, with spouse and 1 child | $4,318.99 | $51,828 |
| 100 percent, with spouse and 2 children | $4,428.10 (4,318.99 + 109.11 per additional child under 18) | $53,137 |

The range matters: at 10 percent the effect on any program is negligible; at 100 percent with dependents the amount is comparable to a full-time salary and moves every counted-income phase-out dramatically.

---

## 4. Recommended input UX

Two candidate inputs, scored 1 to 5, lower is better:

| Option | Accuracy / provenance | UX friction | Engine + URL effort | Handles edge cases | Total |
|---|---|---|---|---|---|
| **A: rating dropdown** (None, 10%...100%), dollars derived from the sourced table + existing household fields | 1 | 1 | 2 | 3 | **7** |
| **B: freeform monthly dollar input** | 3 | 2 | 1 | 1 | **7** |

**Recommendation: A, the rating dropdown.** Tie on totals but A wins on the credibility spine: every dollar the engine uses traces to the VA table with provenance, matching how every other program constant is handled, and veterans know their rating cold (it is the number their whole benefits identity hangs on). A also produces a tiny, clean URL key. B would be the only user-typed benefit amount in the product, invites typos and staleness, and cannot carry provenance. B's one real advantage is special cases (SMC rates, dependent parents); those are edge cases a v1 does not need, and the doc for option A should say plainly "amounts for standard rating plus spouse/children; SMC and dependent-parent add-ons not modelled".

Mapping to existing fields (no new household inputs needed):

- Spouse: `adultCount === 2` selects the "with spouse" column; `adultCount === 1` selects veteran-alone.
- Children: `familySize - adultCount`, exactly the derivation `eitc.ts` and `medicaid.ts` already use. First child selects the "with children" column; each additional child under 18 adds the per-child amount ($109.11 at 100 percent).
- Ratings 10 and 20 ignore dependents entirely (sourced above).
- Known limitation to state in methodology copy: children over 18 in school and dependent parents are not modelled; both are small add-ons.

URL hash: one new entry in `PROFILE_URL_SCHEMA` (`lib/profile-url.ts`), e.g. key `vr`, integer 0 to 10 (0 = no VA compensation, default; n = rating n x 10). Clamped like every other numeric field, omitted when default, fully local-first, no persistence, nothing about the change touches the privacy posture. Parse-side coherence guard mirrors the existing ones (a mangled `vr=17` clamps to 10).

---

## 5. Recommended engine contract change

Current per-program income bases in `lib/engine/takeHome.ts` (verified in code 02-08-2026):

- `magi` (wages minus HSA/401k/FSA) feeds `isOnMedicaid`, `calcMedicaidValue`, `calcACAPremium`, `calcACACSR`.
- `annualIncome` (gross wages) feeds `calcSnap`, `calcSection8Value`, `calcChildcareSubsidy`, `calcFederalEITC`, `calcFederalCTC`, `calcStateIncomeTax`.

Note for the builder: this spike ran on a branch forked before the Cycle 26 Core work merged, so `lib/engine/fedTax.ts` was not yet visible. It ships in this same cycle (task-181: `calcFICA` + `calcFederalIncomeTax`, the net-paycheck fold). The rule for that layer is settled by this matrix: VA compensation enters neither `federalTaxOwed` (it is non-taxable) nor `ficaOwed` (it is not wages), so no change is needed there.

Proposed contract:

- **TakeHomeInput** (`lib/engine/types.ts`): add `vaCompAnnual?: number` (annual dollars, default 0). The rating-to-dollars lookup lives OUTSIDE the pure calc path as an exported helper, e.g. `getVaCompAnnual(rating, familySize, adultCount)`, backed by a sourced `FED.vaComp` table in `lib/engine/federal.ts` with a provenance entry in `provenance.ts` (effective 01-12-2025, va.gov URL). The engine itself stays a pure function of dollars.
- **TakeHomeBreakdown**: add `vaCompValue: number` (15 fields to 16). It is additive cash: `totalEffective += vaCompValue`. `grossWages` stays wages-only; the chart x-axis remains the wage axis, with VA compensation shifting the whole curve up and the counted-program phase-outs left.
- **Program bases, per the matrix:**
  - `calcSnap`: ADD `vaCompAnnual` to the SNAP income base (gross test and net test). Subtlety: the current implementation applies the earned-income deduction (`eidRate`) to all of `grossMonthly`; VA compensation is UNEARNED (7 CFR 273.9(b)(2)(ii)), so the deduction must apply to wages only. The function needs the split (wages vs unearned), not one merged number.
  - `calcSection8Value`: ADD to the income base (both the income-limit check and the 30 percent tenant share).
  - `calcChildcareSubsidy`: ADD, with the state-set caveat from the matrix carried as a note in the state-rules docs (or verified per live state at build time).
  - `magi`, `calcACAPremium`, `calcACACSR`, `isOnMedicaid`, `calcMedicaidValue`: DO NOT add.
  - `calcFederalEITC`, `calcFederalCTC`: DO NOT add (not earned income, not in AGI/MAGI).
  - `calcStateIncomeTax`: DO NOT add.
  - `calcFICA`, `calcFederalIncomeTax` (the task-181 fedTax layer): DO NOT add.
- **Blast radius (flag prominently):** this is a `types.ts` contract change, so every consumer moves: `takeHome.ts` orchestrator, `snap.ts` signature change (earned/unearned split), `housing.ts`, `childcare.ts`, `components/calculator/derive.ts` plus a new ResultCards row, `lib/profile-url.ts` schema, the calculator input UI, `/methodology` prose, and the golden tests. `lib/engine/__tests__/takeHome.test.ts` pins exact and ranged `totalEffective` values; with `vaCompAnnual` defaulting to 0 the existing baselines should NOT move, which is itself the first regression test (default-off means zero diff everywhere). New tests then cover the counted/excluded split directly.

---

## 6. Draft follow-up BUILD task (DO NOT SUBMIT until owner accepts these findings)

**Title:** Model VA disability compensation in the take-home engine (veteran households)

**Scope:**
- Add `FED.vaComp` rate table (rating x dependent tier, effective 01-12-2025) to `lib/engine/federal.ts` with a provenance record; export `getVaCompAnnual(rating, familySize, adultCount)`.
- Add `vaCompAnnual` to `TakeHomeInput` and `vaCompValue` to `TakeHomeBreakdown` in `lib/engine/types.ts`; thread through `getEffectiveTakeHome`.
- Per the matrix: add the amount to the SNAP, Section 8, and childcare income bases (SNAP as unearned income with no earned-income deduction, which requires splitting wages vs unearned in `calcSnap`); leave MAGI, EITC, CTC, and state tax untouched.
- Add the rating dropdown to the calculator (None default), mapped to spouse/children via `adultCount`/`familySize`; add `vr` (0 to 10) to `PROFILE_URL_SCHEMA` with clamping.
- ResultCards row + derive.ts breakdown entry for VA compensation; `/methodology` section stating the counted/excluded split with the citations from this doc; note the SMC/dependent-parent limitation.
- Tests: default-off produces byte-identical baselines; 100 percent veteran scenario shows SNAP/Section 8 phase-outs shifting left while ACA/Medicaid/EITC are unchanged; rating 10/20 ignores dependents; URL round-trip for `vr`.

**Acceptance criteria:**
- With no rating selected, every existing golden test passes unchanged (no re-baseline needed for default-off).
- A 100 percent rated veteran with spouse and 2 children shows $4,428.10 per month of tax-free income in the breakdown, counted against SNAP and Section 8 but absent from MAGI, EITC, and tax lines.
- Shared link with `vr` set reproduces the scenario; no persistence added.
- `npm run build` and full test suite green.

**Effort:** M. The SNAP earned/unearned split is the risky part; the rest is mechanical table-plus-threading in the established pattern.

---

## Verification honesty ledger

- Verbatim primary text retrieved and quoted: 7 CFR 273.9(b)(2)(ii), 24 CFR 5.609(a)(1)/(b)(16)/(b)(17), 42 CFR 435.603(e), 45 CFR 98.16(g), 45 CFR 98.20(a)(2), 38 USC 5301(a)(1), 26 USC 104(a)(4), healthcare.gov "Don't count these income types" list, IRS Pub 596 (2025) not-earned-income list, VA rate page figures and effective date.
- Confirmed at summary level, not verbatim: IRS Pub 525 (2025) veterans-benefits bullet list (the page confirmed disability compensation and pension payments are nontaxable, but the full bulleted list was not captured verbatim; the statutory quotes above carry the claim regardless).
- UNVERIFIED: CCDF treatment in any specific state (state-set by design; Ohio's rule server refused connection). State income tax exclusion verified as a structural derivation from federal statutes, not against all 41 income-tax states' DOR pages.
