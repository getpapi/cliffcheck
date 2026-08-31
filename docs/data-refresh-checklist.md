# Annual Data Refresh Checklist
> Last reviewed: task-162 — 31-07-2026

Operational hygiene doc tracking when each benefit-rule data source needs to be refreshed in the engine, where the authoritative source lives, when the value was last captured, and which engine module consumes it. Without this, FY values silently drift between releases. AD-7 (accuracy-first credibility) requires this to be a routine, not an emergency.

**Engine layout (post-re-platform):** federal-uniform rules live in `lib/engine/federal.ts` (the `FED` object); per-state rules live in `lib/engine/states/{xx}.ts` (each file exports one `StateRules` object, e.g. `OH`). The old single-file `index.html` is dead legacy code — never edit it. Validation is `npm test` (`lib/engine/__tests__`), not a browser console harness.

## How to use this doc

1. Each row lists a data source, its annual update window, and an authoritative URL.
2. When the update window opens, read the source, capture the new value, and update the corresponding engine module file/section.
3. Update the **Last refreshed** column to the date you captured the new value.
4. Update the corresponding `// Source: ... Retrieved: YYYY-MM-DD` inline comment in the engine module file (`lib/engine/federal.ts` or `lib/engine/states/{xx}.ts`).
5. Bump the doc-freshness review header on `docs/state-rules/{state}.md` if state-specific values changed.
6. Run `npm test` and confirm the engine test suite passes (`lib/engine/__tests__/states.test.ts` guards the canonical scenarios). If a canonical scenario moves outside its assertion range, update the assertion WITH justification — don't just widen the range.

## Federal data sources

All consumers below are in `lib/engine/federal.ts` (the `FED` object). `getFPL()` in `lib/engine/fpl.ts` reads `FED.fpl`.

| Program | Update window | Authoritative URL | Last refreshed | Engine consumer |
|---|---|---|---|---|
| **Federal Poverty Guidelines (FPL)** | January (annual) | https://aspe.hhs.gov/topics/poverty-economic-mobility/poverty-guidelines | 2026-04-21 | `federal.ts` → `FED.fpl.base2026`, `FED.fpl.increment2026` |
| **SNAP** — max benefit, standard deduction, EID rate, excess shelter cap | October (USDA COLA, fiscal year start) | https://www.fns.usda.gov/snap/recipient/eligibility | 2026-04-21 | `federal.ts` → `FED.snap.*` (`maxMonthlyBenefit`, `stdDeduction`, `eidRate`, `excessShelterCap`, `shelterProxyShare`, `benefitReductionRate`, `netLimitFPL`) |
| **ACA Premium Tax Credit applicable percentages** | November (HHS NBPP final rule for following plan year) | https://thefinancebuff.com/aca-premium-tax-credit-percentages.html · https://www.congress.gov/crs-product/R48290 | 2026-04-21 | `federal.ts` → `FED.aca.pctTable`, `FED.aca.eligibleFPLMin`, `FED.aca.cliffFPL` |
| **ACA Cost-Sharing Reduction (CSR) AV tiers** | November (HHS NBPP final rule, 45 CFR 156.420) | https://www.federalregister.gov (search "Notice of Benefit and Payment Parameters") | 2026-04-26 (task-87) | `federal.ts` → `FED.aca.csr.tiers` |
| **HUD Fair Market Rents (FMR)** | October (federal fiscal year start) | https://www.huduser.gov/portal/datasets/fmr.html | 2026-04-21 | `states/{xx}.ts` → `{XX}.housing.paymentStandardMonthly` (per state) |
| **HUD Income Limits (50% AMI)** | April (mid-year HUD income limits release) | https://www.huduser.gov/portal/datasets/il.html | 2026-04-21 | `states/{xx}.ts` → `{XX}.housing.incomeLimitAnnual` (per state) |
| **Federal Earned Income Tax Credit (EITC)** | Late autumn (IRS Rev. Proc. for following tax year) | https://www.irs.gov/credits-deductions/individuals/earned-income-tax-credit/eitc-tables | 2026-04-25 (task-83) | `federal.ts` → `FED.eitc.{0,1,2,3}` |
| **Medicaid value proxy** | Annual (KFF marketplace cost-equivalent benchmarks) | https://www.kff.org/medicaid/ | 2026-04-21 | `federal.ts` → `FED.medicaid.adultAnnualValueProxy` |

## Per-state data sources

Each row covers a state-specific value that must be re-verified annually against the cited primary source. State agencies publish updates on different cadences — capture the actual update month in the **Update window** column. Consumers are fields on the state's `StateRules` object in `lib/engine/states/{xx}.ts`.

> **TODO (follow-up):** 12 shipped states do not yet have per-state rows below — FL, GA, PA, NY, plus the Cycle 25 batch **AZ, IL, CA, WA, VA, TN, MO, IN** (states 9→16, captured 2026-07-31). Each needs its representative-metro sources documented (SLCSP metro, HUD FMR/IL area, childcare program, state income tax). The source URLs already exist as inline comments in the respective `lib/engine/states/{xx}.ts` files, and childcare + income-tax provenance (with `retrieved` dates) is machine-readable in `lib/engine/provenance.ts` (`STATE_PROGRAM_PROVENANCE`) — lift them into rows here. NY additionally has an Essential Plan (§1331 BHP) tier in `NY.aca.essentialPlan`.
>
> **C25 batch data-confidence flags (re-pull on next HUD FY2026 refresh):** TN housing (`TN.housing`) uses **FY2025** Memphis HMFA figures — HUD had not published FY2026 at capture; IN 50% VLI (`IN.housing.incomeLimitAnnual`) is a corroborated secondary-source value, not a direct FY2026 primary-file read. Representative-metro SLCSP is a single-metro approximation for every batch state (disclosed via the confidence badge's ~10% caveat).

### Ohio (OH) — `lib/engine/states/oh.ts`

| Program | Update window | Authoritative URL | Last refreshed | Engine consumer |
|---|---|---|---|---|
| Medicaid expansion FPL + child/CHIP FPL | January (state plan amendments tracked annually) | https://www.medicaid.gov/state-overviews/stateprofile.html?state=Ohio | 2026-04-21 | `OH.medicaid` |
| ACA SLCSP benchmark (Ohio, central/northeast representative) | November (open enrollment plan filings) | https://www.kff.org/interactive/subsidy-calculator/ | 2026-04-21 | `OH.aca.slcspMonthly` |
| PFCC childcare (entry/exit FPL, copay rate, market rate per child) | July (Ohio fiscal year, copay rate revisions) | https://childrenandyouth.ohio.gov/for-providers/resources/pfcc | 2026-04-21 | `OH.childcare` |
| Section 8 / HCV — Columbus MHA (CMHA) payment standard, 50% AMI | October (HUD FMR) + April (HUD income limits) | https://cmhanet.com | 2026-04-21 | `OH.housing` |

### Texas (TX) — `lib/engine/states/tx.ts`

| Program | Update window | Authoritative URL | Last refreshed | Engine consumer |
|---|---|---|---|---|
| Medicaid parent FPL + childless adult FPL (non-expansion) | January | https://www.kff.org/medicaid/state-indicator/medicaid-income-eligibility-limits/ | 2026-04-22 | `TX.medicaid` |
| ACA SLCSP benchmark (Dallas-Plano-Irving representative) | November | https://www.kff.org/interactive/subsidy-calculator/ | 2026-04-22 | `TX.aca.slcspMonthly` |
| CCS childcare (entry/exit FPL, copay rate, market rate per child) | September (Texas Workforce Commission fiscal year) | https://www.twc.texas.gov/programs/child-care | 2026-04-22 | `TX.childcare` |
| Section 8 / HCV — Dallas payment standard, 50% AMI | October + April | https://www.huduser.gov/portal/datasets/fmr.html | 2026-04-22 | `TX.housing` |

### North Carolina (NC) — `lib/engine/states/nc.ts`

| Program | Update window | Authoritative URL | Last refreshed | Engine consumer |
|---|---|---|---|---|
| Medicaid expansion FPL (post-Dec 2023) + child/CHIP FPL | January | https://medicaid.ncdhhs.gov/ · https://www.kff.org/medicaid/state-indicator/medicaid-income-eligibility-limits/ | 2026-04-22 | `NC.medicaid` |
| ACA SLCSP benchmark (Raleigh-Durham/Charlotte representative) | November | https://www.kff.org/interactive/subsidy-calculator/ | 2026-04-22 | `NC.aca.slcspMonthly` |
| SCCAP childcare (entry/exit FPL, copay rate, market rate per child) | July (NC DHHS DCDEE fiscal year) | https://ncchildcare.ncdhhs.gov/Home/Work-With-Parents/Financial-Assistance | 2026-04-22 | `NC.childcare` |
| Section 8 / HCV — Raleigh payment standard, 50% AMI | October + April | https://www.huduser.gov/portal/datasets/fmr.html | 2026-04-22 | `NC.housing` |

### Michigan (MI) — `lib/engine/states/mi.ts`

| Program | Update window | Authoritative URL | Last refreshed | Engine consumer |
|---|---|---|---|---|
| Medicaid (Healthy Michigan Plan) expansion FPL + MIChild FPL | January | https://www.michigan.gov/mdhhs/assistance-programs/medicaid | 2026-04-22 | `MI.medicaid` |
| ACA SLCSP benchmark (Detroit-Warren-Dearborn representative) | November | https://www.kff.org/interactive/subsidy-calculator/ | 2026-04-22 | `MI.aca.slcspMonthly` |
| MDHHS CDC scholarship (entry/exit FPL, copay rate, market rate per child) | October (MI fiscal year) | https://www.michigan.gov/mdhhs/assistance-programs/childcare | 2026-04-22 | `MI.childcare` |
| Section 8 / HCV — Detroit payment standard, 50% AMI | October + April | https://www.huduser.gov/portal/datasets/fmr.html | 2026-04-22 | `MI.housing` |

## State EITC top-ups

State EITC laws change less frequently than federal but DO change — track separately from federal EITC.

| State | Update window | Authoritative URL | Last refreshed | Engine consumer | Notes |
|---|---|---|---|---|---|
| **Federal EITC** | Late autumn (IRS Rev. Proc.) | https://www.irs.gov/credits-deductions/individuals/earned-income-tax-credit/eitc-tables | 2026-04-25 (task-83) | `federal.ts` → `FED.eitc` | TY2025 / Rev. Proc. 2024-40 |
| Ohio state EITC | Annual — Ohio DOT | https://tax.ohio.gov/individual/resources/credits-and-rebates | task-41 (Cycle 11) | (per task-41 implementation) | Confirm match-rate vs federal credit |
| Texas state EITC | n/a (no state income tax) | — | — | — | Texas has no state income tax — no state EITC by definition |
| North Carolina state EITC | Annual — NC DOR | https://www.ncdor.gov/ | task-41 (Cycle 11) | (per task-41 implementation) | Verify NC EITC repealed status (was 5% match, repealed 2014; check for re-instatement annually) |
| Michigan state EITC | Annual — MI Treasury | https://www.michigan.gov/treasury | task-41 (Cycle 11) | (per task-41 implementation) | MI EITC was raised to 30% match in 2023 — verify rate annually |

## Refresh routine

- **October sweep** — SNAP COLA, HUD FMR, MI childcare. Touch `FED.snap` (federal.ts), all `{XX}.housing` (states/*.ts), `MI.childcare`. Re-run `npm test`; if any canonical scenario moves outside its assertion range, update the assertion WITH justification (don't just widen the range).
- **November sweep** — ACA premium pct table, ACA CSR AV tiers, ACA SLCSP per state. Touch `FED.aca.pctTable`, `FED.aca.csr.tiers` (federal.ts), all `{XX}.aca.slcspMonthly` (states/*.ts). Open enrollment plan filings drop in early November; KFF subsidy calculator updates by mid-month.
- **January sweep** — FPL guidelines, state Medicaid eligibility limits. Touch `FED.fpl` (federal.ts), all `{XX}.medicaid` (states/*.ts). ASPE publishes the new poverty guidelines mid-January.
- **Spring sweep** — HUD income limits (April), state EITC matches (per state tax filings season). Touch `{XX}.housing.incomeLimitAnnual` (states/*.ts), state EITC engine code (per task-41).
- **Summer sweep** — IRS EITC parameters (typically published in Rev. Proc. October–November but apply retroactively to the prior tax year), state-specific childcare program updates (varies). Touch `FED.eitc` (federal.ts), all `{XX}.childcare` (states/*.ts).

## Refresh checklist template (copy this when running a sweep)

```
Sweep: [season] [year]
Date started: YYYY-MM-DD

[ ] Identify all rows with Update window = [this season]
[ ] For each row:
    [ ] Open the authoritative URL
    [ ] Capture the current value
    [ ] Diff against the engine module value (lib/engine/federal.ts or lib/engine/states/{xx}.ts)
    [ ] If changed, update the engine module + inline comment + retrieval date
    [ ] Update this checklist's Last refreshed column
[ ] Update doc-freshness header on docs/state-rules/{state}.md for any state with changes
[ ] Run npm test
[ ] Confirm all engine tests pass (lib/engine/__tests__)
[ ] Commit with message: "data: {season} {year} refresh — {summary of changes}"
[ ] Tag a release if the changes materially shift the demo numbers
```

## Out of scope (deliberately)

- **Automation** — this is a manual checklist. Automating refreshes would require scraping authoritative URLs, which is brittle and adds infrastructure without proportional value at the current scale. ("Routine, not emergency" means a disciplined manual sweep on cadence — not a scraper.)
- **Per-county overrides** — ACA SLCSP, HUD FMR, and childcare market rates technically vary by county. Engine values are state representatives sourced from the largest metro area in each state. Per-county overrides are tracked separately (see `docs/research/all-states-findings.md`).
- **Native American / tribal program variants** — separate eligibility rules for AI/AN populations (zero-cost-sharing CSR, IHS interactions) are not modelled. Out of scope for the current state cohort.
