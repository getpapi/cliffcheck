# All-States Support — Research Findings
> Last reviewed: task-19 — 22-04-2026

**Status:** Draft — pending owner review. Do not submit follow-up backlog tasks until findings are accepted.

**Scope:** Map the landscape for expanding CliffCheck from Ohio-only to multi-state coverage. Identify priority states, which benefit programs vary by state, authoritative data sources, architecture extension pattern, and recommended build order for Cycle 7+.

**Out of scope:** No code changes. No benefit calculation modules. No UI work. See `task-25` for implementation.

---

## 1. Priority State Ranking

**Weighting method:** States scored 1–5 on each of three dimensions. Lower total = higher priority.

| Dimension | What it measures | 1 = best | 5 = worst |
|-----------|------------------|----------|-----------|
| **Working poor density** | ALICE-threshold households as % of state population (United Way ALICE 2024) | High % | Low % |
| **Coverage gap** | Whether an existing tool already covers this state's cliffs (e.g. Atlanta Fed CLIFF, state-specific calculators) | No existing tool | Saturated |
| **Data availability** | Public, machine-readable state benefit rules (DHS rule books, published thresholds) | Fully public + current | Opaque / fragmented |

### Ranked shortlist (top 10)

| Rank | State | ALICE % | Coverage gap | Data availability | Total | Notes |
|------|-------|---------|--------------|-------------------|-------|-------|
| 1 | **Texas** | 44% (1) | High — no public cliff calc (1) | Good — HHSC rulebook published (2) | **4** | Largest underserved population; Medicaid non-expansion amplifies cliffs |
| 2 | **Florida** | 45% (1) | High — no public calc (1) | Moderate — DCF rules published but fragmented (3) | **5** | Non-expansion state; childcare subsidy waitlist opaque |
| 3 | **Georgia** | 43% (2) | High (1) | Moderate (3) | **6** | Non-expansion; Atlanta Fed CLIFF covers GA partially for researchers, not consumers |
| 4 | **North Carolina** | 41% (2) | Medium (2) | Good (2) | **6** | Medicaid expansion took effect Dec 2023 — cliff geometry changed recently |
| 5 | **California** | 35% (3) | Low — GetCalFresh covers SNAP, CalSAWS covers combined (4) | Good — CDSS rules published (2) | **9** | Largest state but heavily covered; low marginal impact |
| 6 | **Michigan** | 40% (2) | High (1) | Moderate (3) | **6** | Expansion state; Section 8 particularly broken (detroit) |
| 7 | **Pennsylvania** | 40% (2) | Medium (2) | Good (2) | **6** | Expansion state; COMPASS provides eligibility but not cliff visualisation |
| 8 | **Arizona** | 42% (2) | High (1) | Moderate (3) | **6** | Expansion state; AHCCCS rulebook public |
| 9 | **Illinois** | 36% (3) | Medium (2) | Good (2) | **7** | Expansion state; ABE portal well-documented |
| 10 | **New York** | 37% (3) | Low — MyBenefits + ACCESS HRA (4) | Good (2) | **9** | Highly covered; lower marginal impact |

**Read:** lower score = higher priority. Texas, Michigan, Georgia, NC, Arizona, and PA cluster around 5–6. California and New York score worse not because they're unimportant but because existing tools already serve those users.

### Recommended build order (next 3 states after Ohio)

1. **Texas (TX)** — Largest working-poor population; Medicaid non-expansion means the ACA cliff dominates (not Medicaid/expansion cliffs). Builds confidence that the engine handles non-expansion geometry.
2. **North Carolina (NC)** — Recent Medicaid expansion (Dec 2023) means published rules are current and the cliff geometry is well-documented. Expansion state complement to TX (non-expansion).
3. **Michigan (MI)** — Large working-poor base; no consumer-grade cliff tool exists. Validates Section 8 / Michigan State Housing Development Authority (MSHDA) modeling where Ohio's Section 8 model was thinnest.

**Rationale for this ordering:** TX + NC covers both non-expansion and expansion Medicaid geometries. MI stress-tests the housing model. After these three, architecture extensibility will be proven.

---

## 2. Benefit Program Matrix — Federal-Uniform vs. State-Specific

**Programs already modelled in OH:** SNAP, Medicaid, ACA Premium Tax Credit, PFCC (Ohio childcare subsidy), Section 8 HCV.

### Federal-uniform (same rules in every state — can live in a shared module)

| Program | Why uniform | State variation vector |
|---------|-------------|------------------------|
| **SNAP max benefit tables** | USDA FNS sets maximum allotment by household size, refreshed annually | None on benefit amounts |
| **SNAP gross/net income tests** | Federal 130% / 100% FPL baseline | **BBCE raises gross to 165–200% FPL** — state-level opt-in (43 states have it) |
| **SNAP standard deduction** | Federal table indexed by household size | Minor variation for AK/HI (cost-of-living) |
| **ACA Premium Tax Credit** | IRC §36B — federal law, applicable percentage table set in Congress | SLCSP benchmark varies by **county** (not state) |
| **Federal Poverty Level (FPL)** | HHS publishes annually; AK and HI have separate tables | AK and HI only |
| **EITC (federal)** | IRC §32 | None on federal portion |

**Implication:** Move `getFPL`, `FPL_BASE_2026`, `FPL_INCREMENT_2026`, and the SNAP federal baseline (max benefit tables, standard deduction, EID rate, benefit reduction rate) into a `FED` namespace. These are shared across all states.

### State-specific (must live in each state's module)

| Program | Variation | Example: OH vs. TX |
|---------|-----------|---------------------|
| **SNAP BBCE gross limit** | States choose 130% / 165% / 185% / 200% FPL | OH: 200%; TX: 165% |
| **Medicaid expansion status** | 41 states (incl DC) expanded; 10 did not | OH expanded (138% FPL); TX non-expansion (18% FPL for parents, 0% for childless adults) |
| **Medicaid parent/adult eligibility** | Pre-ACA state-set thresholds apply in non-expansion states | OH: 138% FPL; TX: 18% FPL parents |
| **CHIP thresholds** | States choose 200–400% FPL | OH children: 216% FPL; TX children: 201% FPL |
| **Childcare subsidy** | CCDBG state-run programs — entry FPL, exit FPL, copay formula all vary | OH PFCC: entry 145% / exit 300%, 7% copay; TX: entry 200% / exit 85% SMI, sliding copay |
| **State EITC top-up** | 31 states + DC have state EITC, 1–50% of federal | OH: 30% non-refundable; TX: $0 (no state income tax) |
| **Section 8 payment standard** | Set per PHA (public housing authority) by county | Columbus MHA 3BR: ~$1,750; Austin Housing 3BR: ~$2,400 |
| **Section 8 income limit** | HUD 50% AMI, varies by metro | Columbus: ~$52,500 (family of 4); Austin: ~$60,600 |
| **State housing assistance** | Some states have additional programs (e.g. NC Housing Finance Agency) | OH: none beyond Section 8; NC: NCHFA supplement |
| **TANF cash assistance** | State-set benefit levels, time limits, work requirements | OH OWF: $527/mo family of 3; TX TANF: $308/mo family of 3 |
| **State health insurance subsidies** | CA, NY, WA, VT, NJ, MA, CT, MN layer state PTC on top of federal | OH: none; CA: Covered California subsidy at 250–600% FPL |

**Non-modelled in OH but relevant for cliffs:**
- **TANF** (currently excluded from OH model — thin benefit, mostly not a cliff driver)
- **LIHEAP / energy assistance** (small dollar, phased out at state-set FPL)
- **WIC** (categorical for infants/pregnant women — complicates family-size model)
- **School meals** (free/reduced thresholds — federal 130%/185%, but waiver programs vary)

**Recommendation for initial multi-state scope:** Keep the same 5 programs as OH (SNAP, Medicaid, ACA, Childcare, Section 8). Do not add TANF, LIHEAP, WIC, or school meals until after the 3rd state ships. Adding programs ≠ adding states; keep these concerns separate.

---

## 3. Data Sources Per Program

| Program | Authoritative source | Refresh cadence | Access |
|---------|----------------------|-----------------|--------|
| **SNAP max benefits** | USDA FNS Cost-of-Living Adjustments | Annual (October) | https://www.fns.usda.gov/snap/allotment/COLA |
| **SNAP deductions / EID rate** | USDA FNS SNAP Policy | Annual | https://www.fns.usda.gov/snap/eligibility/deduction |
| **SNAP state BBCE options** | USDA FNS BBCE state list | Periodic | https://www.fns.usda.gov/snap/broad-based-categorical-eligibility |
| **FPL (federal)** | HHS ASPE Poverty Guidelines | Annual (January) | https://aspe.hhs.gov/poverty-guidelines |
| **Medicaid expansion status** | KFF Medicaid Expansion Decisions | Live | https://www.kff.org/status-of-state-medicaid-expansion-decisions/ |
| **Medicaid thresholds (per state)** | State Medicaid agency eligibility pages; KFF income eligibility tables | Annual | https://www.kff.org/medicaid/state-indicator/medicaid-income-eligibility-limits/ |
| **CHIP thresholds** | Medicaid.gov CHIP fact sheets | Annual | https://www.medicaid.gov/chip/state-program-information |
| **ACA PTC applicable % table** | IRS Rev. Proc. (annual) | Annual | https://www.irs.gov/affordable-care-act/individuals-and-families/premium-tax-credit |
| **SLCSP by county** | HealthCare.gov Plan Compare (tax tool); KFF calculator | Annual (November) | https://www.kff.org/interactive/subsidy-calculator/ |
| **Childcare subsidy (state)** | State CCDF Plan (administering agency); National Women's Law Center annual report | Triennial (plans) + annual (rates) | Per-state agency; https://nwlc.org (summary) |
| **Section 8 payment standards** | HUD Fair Market Rents (FMR) | Annual (October) | https://www.huduser.gov/portal/datasets/fmr.html |
| **Section 8 income limits** | HUD Income Limits (50% AMI) | Annual (April) | https://www.huduser.gov/portal/datasets/il.html |
| **State EITC** | Tax Foundation state EITC list; state department of revenue | Annual | https://taxfoundation.org/ |

**Reliability note:** Federal sources (USDA, HUD, IRS, HHS) are authoritative and machine-consumable. State sources vary — KFF and NWLC provide aggregated comparisons that are usually safer starting points than raw state agency PDFs. Cite the state agency URL inline for audit but pull values from the aggregated source on first pass.

---

## 4. Architecture Recommendation

### Current pattern (Ohio-only)

```js
const OH = {
  snap: { grossLimitFPL, netLimitFPL, stdDeduction, eidRate, benefitReductionRate, maxMonthlyBenefit },
  medicaid: { expansionFPL, childrenFPL, adultAnnualValueProxy },
  aca: { eligibleFPLMin, cliffFPL, slcspMonthly, pctTable },
  pfcc: { entryFPL, exitFPL, coPayRate, coPayFreeFPL, childcareValuePerChild },
  section8: { incomeLimitAnnual, paymentStandardMonthly, tenantShareRate },
};

function calcSnap(annualIncome, familySize) { /* references OH.snap directly */ }
function calcMedicaidValue(annualIncome, familySize, adultCount) { /* OH.medicaid */ }
// ...
function calcEffectiveTakeHome(annualIncome, familySize, opts) { /* aggregator */ }
```

### Recommended pattern (multi-state)

**1. Shared federal namespace** — programs that are identical across states.

```js
const FED = {
  fpl: { base2026: 15960, increment2026: 5680 },
  snap: {
    // Federal baseline. States override grossLimitFPL via BBCE.
    netLimitFPL: 1.00,
    stdDeduction: [0, 209, 209, 209, 228, 247, 266],
    eidRate: 0.20,
    benefitReductionRate: 0.30,
    maxMonthlyBenefit: [0, 298, 549, 785, 994, 1183, 1419],
  },
  aca: {
    eligibleFPLMin: 1.00,
    cliffFPL: 4.00,
    pctTable: [[1.00, 0.0210], [1.33, 0.0314], /* ... */ [4.00, 0.0996]],
    // SLCSP is county-specific — lives in state module, not FED
  },
};
```

**2. State modules — one object per state, namespaced by 2-letter code.**

```js
const STATES = {
  OH: {
    label: 'Ohio',
    snap: { grossLimitFPL: 2.00 },                              // BBCE override
    medicaid: { expanded: true, expansionFPL: 1.38, childrenFPL: 2.16, adultAnnualValueProxy: 2250 },
    aca: { slcspMonthly: { 1: 700, 2: 1400, 3: 1750, 4: 2100, 5: 2625, 6: 3150 } },
    childcare: { entryFPL: 1.45, exitFPL: 3.00, coPayRate: 0.07, coPayFreeFPL: 1.00,
                 valuePerChild: [0, 11000, 23000, 33000] },
    housing: { incomeLimitAnnual: 52500, paymentStandardMonthly: 1750, tenantShareRate: 0.30 },
    stateEitcRate: 0.30,    // 30% of federal, non-refundable
    stateEitcRefundable: false,
  },
  TX: {
    label: 'Texas',
    snap: { grossLimitFPL: 1.65 },
    medicaid: { expanded: false, parentFPL: 0.18, childlessAdultFPL: 0, childrenFPL: 2.01, adultAnnualValueProxy: 2250 },
    aca: { slcspMonthly: { /* Dallas/Houston estimate */ } },
    childcare: { entryFPL: 2.00, exitFPL: 0.85 /* SMI */, /* ... */ },
    housing: { /* Austin/Dallas estimates */ },
    stateEitcRate: 0,
    stateEitcRefundable: false,
  },
  // NC, MI, ...
};
```

**3. Calc functions accept a state code (or state object).**

```js
function calcSnap(annualIncome, familySize, stateCode) {
  const state = STATES[stateCode];
  const grossLimit = state.snap.grossLimitFPL;
  // rest references FED.snap for federal baseline
}

function calcMedicaidValue(annualIncome, familySize, adultCount, stateCode) {
  const state = STATES[stateCode];
  if (!state.medicaid.expanded) {
    // Non-expansion branch: use parentFPL / childlessAdultFPL
  }
  // Expansion branch
}

function calcEffectiveTakeHome(annualIncome, familySize, opts) {
  const { stateCode = 'OH', /* ... */ } = opts || {};
  // Aggregate, passing stateCode to each program calc
}
```

**4. UI change — state selector.** Add a `<select>` field in `ProfileForm` with options from `Object.keys(STATES).map(c => ({ code: c, label: STATES[c].label }))`. Persist selected state via TinyBase cell `profile.current.stateCode`. All result components already read from store — they'll re-render on change.

### Why this pattern (vs. alternatives)

| Alternative considered | Rejected because |
|-------------------------|------------------|
| **One big `RULES[state][program]` nested object** | Harder to see state-level divergence at a glance; harder to add non-expansion vs. expansion branches cleanly |
| **Per-state JS file (`ohio.js`, `texas.js`)** | Violates single-file VibesOS constraint. Not possible. |
| **JSON data file loaded via fetch** | Adds a network dependency to a local-first app. Unnecessary for <50 KB of state rules. |
| **Class-per-state inheritance (`class TXState extends BaseState`)** | Over-engineering for 2–5 state variations; no runtime behavior differences that can't be captured in data. |

### Effort per state module

Once the TX module is built (which requires the refactor of OH → FED + OH + calc signatures), each additional state is **S effort** (~2–4 hours) consisting of:

1. Pull SNAP BBCE limit for the state (KFF) — **XS**
2. Pull Medicaid expansion status + parent/children FPL (KFF) — **XS**
3. Pull SLCSP estimate for one representative metro (KFF calculator) — **XS**
4. Pull childcare subsidy entry FPL + copay formula (NWLC + state CCDF plan) — **S**
5. Pull Section 8 FMR + income limit for one representative metro (HUD) — **XS**
6. Pull state EITC rate (Tax Foundation) — **XS**
7. Add validation scenario for the state (mirror validateKeisha) — **XS**

**First new state (TX) is M effort** because it includes the OH refactor to FED + STATES + state-code parameterization. States 2 and 3 are S each. States 4+ are XS–S.

### UI changes required

- **State selector** (new `<select>` in `ProfileForm`) — S effort, one-time
- **SLCSP copy** — currently hardcoded "Ohio estimate"; make dynamic — XS
- **Source citations** — currently cite Ohio JFS and CMHA; switch to state-scoped citations — XS
- **"Not supported" empty state** — if a state outside the supported set is somehow selected (deep link), show a clean empty state — XS

No chart changes. No data model changes beyond the new `stateCode` cell.

---

## 5. Recommended Next 2–3 States

**Cycle 7 candidate:** `task-25` (multi-state expansion, Large) — scope it to these three states:

1. **Texas (TX)** — first, bundled with the OH → FED + STATES refactor. Validates non-expansion Medicaid geometry. **M effort** (refactor + TX module + validation).
2. **North Carolina (NC)** — second, tests expansion state with recent rule changes. **S effort** (pure data fill + validation).
3. **Michigan (MI)** — third, stresses Section 8 modeling in Detroit. **S effort**.

**Total Cycle 7 effort for multi-state:** ~M + S + S = **L**, matching task-25's current sizing.

**Defer to Cycle 8+:**
- California, Illinois, Pennsylvania — covered by existing tools, lower marginal value
- Florida, Georgia, Arizona — non-expansion states, high value, but choose after TX validates the non-expansion branch

---

## Architecture Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| **SLCSP by county, not state** — a single `slcspMonthly` per state is a lie | Ship with one representative metro per state; add county override in Cycle 9+ if accuracy complaints appear |
| **Data rot** — rules change annually, we have no refresh mechanism | Cite source date inline (`// Updated FY2026`); add an annual refresh task |
| **Non-expansion Medicaid branching** | Model `medicaid.expanded: boolean`. Non-expansion branch uses `parentFPL` and `childlessAdultFPL`; expansion branch uses `expansionFPL` uniformly |
| **Childcare subsidy geometry varies wildly** | Accept ~10% accuracy on childcare cliffs; note prominently in UI that childcare rules are state-specific and users should confirm with local agency |
| **State EITC** — 31 states with wide variation in refundability and rate | Model as `{ stateEitcRate, stateEitcRefundable }`; apply only when income is within federal EITC eligible range |

---

## Open Questions for Owner

1. **Ship without state EITC in Cycle 7?** OH's current model doesn't include state EITC either. Adding it at the same time as the multi-state refactor inflates scope. Recommendation: ship without state EITC first, add it as a follow-up task.
2. **TANF inclusion?** None of the states model TANF currently. Recommendation: explicit decision to exclude — document it in the brief.
3. **County-level SLCSP?** Accept the metro-representative estimate for v1, revisit if accuracy is a user complaint driver.
4. **Section 8 default?** Currently OH defaults `hasVoucher: false` because Ohio PHA waitlists are closed. Should each state module expose its own default? Recommendation: yes — `state.housing.voucherDefault = false` (all states default false; user explicitly toggles).

---

## Follow-up Tasks (do not submit until owner reviews this doc)

When approved, propose:
- Update `task-25` scope to the 3-state Cycle 7 plan above
- New: `OH → FED + STATES refactor` (M, prerequisite for TX)
- New: `State selector UI component` (S)
- New: `TX state module + validation` (S, after refactor)
- New: `NC state module + validation` (S)
- New: `MI state module + validation` (S)
- New: `State EITC support across all states` (S, optional for v1)
- New: `Annual data refresh checklist doc` (XS)
