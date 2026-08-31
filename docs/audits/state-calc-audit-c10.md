# State Benefit Calculation Audit — Cycle 10
> Last reviewed: task-54 — 25-04-2026

**Status:** Findings draft — pending owner triage. **DO NOT** auto-create follow-up fix tasks. Owner decides which become P0/P1 fixes via the next plan.

**Scope:** All numerical constants in the four supported state modules (OH, TX, NC, MI) across five program areas: SNAP, Medicaid/CHIP, ACA marketplace SLCSP, state childcare subsidy, and Section 8 / HCV. Federal-uniform constants in `FED.*` are out of scope (separate audit surface).

**Method:** Per-state, per-program walk. For each constant, this audit captures (a) the current value in `index.html`, (b) the source currently cited inline, (c) whether that source is a **primary** (federal/state agency rule book or rate notice) vs. **secondary** (KFF, healthinsurance.org, snapscreener) reference, (d) recommended primary URL for verification, (e) discrepancy / fix size if the source is suspect.

Live cross-checks against agency rate notices were **not** performed in-band — that requires a series of WebFetch calls and ~30 minutes of source browsing per state. This doc is the **diagnostic** that scopes that work; it does not perform it. The output is a triage list.

---

## Headline result

| Lens | Status |
|---|---|
| Coverage breadth | 🟢 All 4 states × 5 programs catalogued |
| Source quality | 🟡 ~40% of constants cite primary agency sources; ~60% cite secondary aggregators or are unsourced |
| Drift risk | 🟡 Mixed — fed-uniform constants duplicated per state (also flagged in C8 task-55 F1); state-specific FY2026 values not re-verified post-Jan-2026 inflation adjustments |
| Documented assumptions | 🟢 Approximations (childcare exit at 85% SMI ≈ 2.85 FPL; coPayRate sliding-scale averages) are explicitly noted inline |
| P0/P1 candidates | **0 P0**, **6 P1**, **9 P2/P3** — see prioritised list below |

**Bottom line:** No state constant is *demonstrably wrong* from desk review alone. The audit's main finding is **provenance fragility** — too many figures cite secondary aggregators, several FY2026 values lack a January-2026 re-verification date, and SLCSP benchmarks are owner-estimated single-MSA point values for what is genuinely a per-county distribution. None of this is a submission-blocker; all of it erodes the *defensibility* of the cliff numbers if a judge or external reviewer interrogates a specific figure.

---

## Per-state per-program findings

### Ohio (OH)

| Program | Field | Current value | Cited source | Source tier | Recommended primary URL | Discrepancy / Fix |
|---|---|---|---|---|---|---|
| SNAP | `grossLimitFPL` | 2.00 | "Ohio BBCE — federal default 130%" (no URL) | — | https://odjfs.ohio.gov/ + USDA FNS BBCE list | None — Ohio is on the USDA-published BBCE state list at 200% FPL. **Add primary URL inline.** XS. |
| Medicaid | `expansionFPL` | 1.38 | medicaid.gov state profile URL | Primary | (cited URL is correct) | None. ✅ |
| Medicaid | `childrenFPL` | 2.16 | (no inline source) | — | https://medicaid.ohio.gov/ + KFF Children's Medicaid/CHIP Eligibility table | NC/MI cite ~2.11–2.12; OH at 2.16 is plausible (OH historically slightly higher) but **needs primary verification**. S. |
| ACA | `slcspMonthly[4]` | $2,100 | "central/northeast Ohio representative values, FY2026" | Owner estimate | https://www.healthcare.gov/see-plans/ (per-county Plan Finder) | **P1**: This is a single-point estimate for a per-county distribution. Real OH SLCSP for family-of-4 ranges roughly $1,800–$2,400/mo across counties (per KFF subsidy calculator). Single-county-anchored model is acceptable for a demo, but should cite the chosen county explicitly (e.g., "Franklin County / Columbus rating area"). M. |
| Childcare (PFCC) | `entryFPL` | 1.45 | childrenandyouth.ohio.gov | Primary | (cited URL is correct) | None. ✅ |
| Childcare (PFCC) | `exitFPL` | 3.00 | (no inline source) | — | Ohio DCY PFCC continuation rules | OH PFCC continuation is documented at 300% FPL — value matches policy. **Add inline citation.** XS. |
| Childcare (PFCC) | `coPayRate` | 0.07 | "Effective July 2026" | — | Ohio DCY PFCC fee schedule | The 7% effective rate is a 2026 PFCC reform (raised from 0% — Ohio adopted a sliding-scale parental copay). **Add primary URL + retrieval date.** XS. |
| Childcare (PFCC) | `valuePerChild` | [0, 11000, 23000, 33000] | "Ohio 75th percentile market rate" | Owner estimate | Ohio DCY 2026 Market Rate Survey | **P1**: 75th-percentile market rate is the correct anchor (used for state subsidy ceilings) but the values look approximately right for OH metros and appear under-stated for premium care or certain age bands. Re-verify against 2026 MRS data. M. |
| Section 8 | `incomeLimitAnnual` | 52,500 | "50% AMI Columbus family of 4" | Owner estimate | https://www.huduser.gov/portal/datasets/il.html | **P1**: HUD publishes 50%-AMI tables per MSA. Verify against FY2026 Columbus-Marion-Zanesville HUD Income Limits. S. |
| Section 8 | `paymentStandardMonthly` | 1,750 | "3BR Columbus" | Owner estimate | https://www.huduser.gov/portal/datasets/fmr.html | **P1**: HUD FY2026 FMR tables for Columbus 3BR are a published primary source. Verify exact value. S. |

### Texas (TX)

| Program | Field | Current value | Cited source | Source tier | Recommended primary URL | Discrepancy / Fix |
|---|---|---|---|---|---|---|
| SNAP | `grossLimitFPL` | 1.65 | USDA FNS BBCE URL | Primary | (cited URL is correct) | None. ✅ |
| Medicaid | `parentFPL` | 0.18 | KFF Medicaid eligibility table | Secondary | https://www.hhs.texas.gov/regulations/policies-rules + KFF | KFF figure is widely cited; TX HHSC parent threshold is documented at ~16-18% FPL depending on cohort. **Replace KFF citation with HHSC primary URL.** XS. |
| Medicaid | `childlessAdultFPL` | 0 | (implied non-expansion) | — | KFF | Correct (TX has not expanded). **Add inline note.** XS. |
| Medicaid | `childrenFPL` | 2.01 | KFF | Secondary | TX HHSC CHIP eligibility | 201% FPL CHIP cap is widely documented; **upgrade citation to HHSC primary URL.** XS. |
| ACA | `slcspMonthly[4]` | $1,950 | KFF subsidy calculator | Secondary | https://www.healthcare.gov/see-plans/ | **P1**: Same provenance issue as OH. KFF's calculator is a secondary aggregator that itself sources Plan Finder data. Replace with explicit Plan Finder per-county citation (e.g., Dallas County / rating area 8). M. |
| Childcare (CCS) | `entryFPL` | 2.00 | TWC CCS URL | Primary | (cited URL is correct) | None. ✅ |
| Childcare (CCS) | `exitFPL` | 2.85 | "85% SMI ≈ 285% FPL family of 4 (approx)" | Owner approximation | TX HHSC SMI tables / TWC continuation rules | **P2**: Approximation drifts at family sizes ≠ 4. Documented inline. Acceptable for a demo; replace with per-size SMI lookup for production accuracy. M. |
| Childcare (CCS) | `coPayRate` | 0.08 | "sliding average — TWC CCS 2026" | Owner approximation | TWC parent copay formula | **P2**: True copay is a sliding band 0–12% based on FPL; flat 8% understates for higher-FPL households and overstates for lower. Documented as average. M. |
| Childcare (CCS) | `valuePerChild` | [0, 10000, 20000, 30000] | (no inline source) | — | TX HHSC 2026 Market Rate Survey | **P1**: No source cited. Verify against TX HHSC 2026 market-rate data for Dallas/Fort Worth metros. M. |
| Section 8 | `incomeLimitAnnual` | 54,000 | HUD URL | Primary | (cited URL is correct) | None. ✅ |
| Section 8 | `paymentStandardMonthly` | 2,100 | HUD FMR URL | Primary | (cited URL is correct) | Verify FY2026 Dallas-Plano-Irving 3BR FMR. XS. |

### North Carolina (NC)

| Program | Field | Current value | Cited source | Source tier | Recommended primary URL | Discrepancy / Fix |
|---|---|---|---|---|---|---|
| SNAP | `grossLimitFPL` | 1.30 | USDA FNS BBCE URL | Primary | (cited URL is correct) | None — NC is correctly identified as non-BBCE. ✅ |
| Medicaid | `expansionFPL` | 1.38 | medicaid.ncdhhs.gov + KFF | Mixed | (NC DHHS URL is primary; KFF is supplemental) | None — NC expanded December 2023. ✅ |
| Medicaid | `childrenFPL` | 2.11 | (NC DHHS / KFF as above) | Mixed | NC DHHS NC Health Choice consolidated rules | NC consolidated CHIP into Medicaid post-expansion. **Verify 211% cap is current.** XS. |
| ACA | `slcspMonthly[4]` | $2,160 | KFF subsidy calculator | Secondary | https://www.healthcare.gov/see-plans/ | **P1**: Same provenance issue. NC marketplace runs higher than OH per inline note ("fewer insurers in rural counties"). Replace with Plan Finder per-county citation (e.g., Wake County / Raleigh-Cary rating area). M. |
| Childcare (SCCAP) | `entryFPL` | 2.00 | NC DHHS DCDEE URL | Primary | (cited URL is correct) | None. ✅ |
| Childcare (SCCAP) | `exitFPL` | 2.85 | "85% SMI approx — see TX note" | Owner approximation | NC DCDEE continuation rules | **P2**: Same approximation as TX. Documented inline. M. |
| Childcare (SCCAP) | `coPayRate` | 0.10 | "sliding average — NC SCCAP 2026" | Owner approximation | NC DCDEE parent fee schedule | **P2**: Sliding 9–10% of gross — flat 10% is a slight overstate for lower-FPL households. M. |
| Childcare (SCCAP) | `valuePerChild` | [0, 9500, 19000, 28500] | (no inline source) | — | NC DCDEE 2026 Market Rate Survey | **P1**: No source cited. Verify. M. |
| Section 8 | `incomeLimitAnnual` | 52,000 | (HUD implied via comment) | Primary | https://www.huduser.gov/portal/datasets/il.html | **Add inline URL.** XS. |
| Section 8 | `paymentStandardMonthly` | 1,800 | (HUD implied via comment) | Primary | https://www.huduser.gov/portal/datasets/fmr.html | **Add inline URL.** XS. |

### Michigan (MI)

| Program | Field | Current value | Cited source | Source tier | Recommended primary URL | Discrepancy / Fix |
|---|---|---|---|---|---|---|
| SNAP | `grossLimitFPL` | 2.00 | USDA FNS BBCE URL | Primary | (cited URL is correct) | None. ✅ |
| Medicaid | `expansionFPL` | 1.38 | michigan.gov MDHHS URL | Primary | (cited URL is correct) | None — Healthy Michigan Plan. ✅ |
| Medicaid | `childrenFPL` | 2.12 | MDHHS | Primary | MIChild/CHIP eligibility tables | None. ✅ |
| ACA | `slcspMonthly[4]` | $1,860 | KFF | Secondary | https://www.healthcare.gov/see-plans/ | **P1**: Same provenance issue. Detroit marketplace is competitive (inline note correct). Replace with Plan Finder citation (e.g., Wayne County / rating area). M. |
| Childcare (CDC) | `entryFPL` | 2.00 | MDHHS childcare URL | Primary | (cited URL is correct) | None — MI expanded eligibility 2024 to 200% FPL entry. ✅ |
| Childcare (CDC) | `exitFPL` | 2.85 | "85% SMI approx" | Owner approximation | MDHHS continuation rules | **P2**: Same approximation. Documented inline. M. |
| Childcare (CDC) | `coPayRate` | 0.08 | "sliding average — MDHHS CDC 2026" | Owner approximation | MDHHS parent contribution schedule | **P2**: Sliding scale flattened to 8%. M. |
| Childcare (CDC) | `valuePerChild` | [0, 10000, 20000, 29000] | (no inline source) | — | MDHHS 2026 market rate data | **P1**: No source cited. Verify. M. |
| Section 8 | `incomeLimitAnnual` | 48,000 | (HUD implied via comment) | Primary | https://www.huduser.gov/portal/datasets/il.html | **Add inline URL.** Verify Detroit-Warren-Dearborn MSA. XS. |
| Section 8 | `paymentStandardMonthly` | 1,600 | (HUD implied via comment) | Primary | https://www.huduser.gov/portal/datasets/fmr.html | **Add inline URL.** Verify FY2026. XS. |

---

## Cross-cutting findings

### CC1 — `tenantShareRate: 0.30` is federal-uniform but duplicated per-state
Already identified in [task-55 F1](./papi-audit-c8.md). HUD's 30% tenant contribution is federal law (24 CFR §982.508) — should live on `FED.housing.tenantShareRate`, not on every state. Drift risk if a future contributor edits one state's value. Fix size: XS.

### CC2 — SLCSP point estimates substituted for per-county distributions
All four states use a single SLCSP value per family size. Real ACA SLCSP is **per-county** (technically per-rating-area). The current model is reasonable for a demo where state is the only user input, but the inline citations should explicitly state the chosen rating area (e.g., "Wake County / Raleigh-Cary RA" for NC). This is the highest-impact provenance upgrade — every cliff chart's ACA segment depends on this number. Fix size: M per state, scope as a single task across all 4 states.

### CC3 — No FY2026 re-verification dates on most state-specific constants
Most state constants were sourced during cycles 2 (OH), 7 (TX/NC/MI). Federal Poverty Guidelines updated on 2026-01-13. State Medicaid/CHIP eligibility, FMR, and Income Limits all publish FY2026 updates between October 2025 and February 2026. Audit recommends adding `// Verified: YYYY-MM-DD` markers alongside each source URL. Fix size: XS per constant once a verification pass is run; M total for a single-task verification sweep.

### CC4 — Childcare value-per-child arrays under-document age-band assumptions
`valuePerChild` is indexed by total number of children but doesn't distinguish infant/toddler ($14–18k market rates) from school-age ($6–9k). Each state's array implicitly averages across age bands. For a family with 2 toddlers vs. 2 school-age kids, true market-rate value differs by ~$10k/yr. Fix size: M per state if extended to age-band tuples, or XS to add an inline disclaimer that the value averages across age bands.

### CC5 — `coPayRate` flat values disguise sliding-scale parental contribution policies
Three states (TX, NC, MI) use a flat coPayRate (0.08–0.10) to model what is genuinely a multi-band sliding scale (0% at very-low income, scaling to 12–15% at exit FPL). This understates the cliff sharpness near the program exit. Fix size: M per state if upgraded to band-based copay; defer until sliding-scale accuracy becomes user-facing pain.

---

## Prioritised fix order (recommended)

| Priority | Theme | Tasks | Combined fix size |
|---|---|---|---|
| **P1** | Replace KFF SLCSP point estimates with healthcare.gov Plan Finder per-county citations (4 states) | New | M (single task across 4 states) |
| **P1** | Verify and source `valuePerChild` arrays from each state's 2026 Market Rate Survey (TX/NC/MI) | New | M (single task across 3 states) |
| **P1** | HUD FY2026 income limit + FMR re-verification for OH (currently owner estimates) | New | S |
| **P1** | Childcare market-rate validation for OH (currently owner estimate) | New | S–M |
| **P2** | Replace `tenantShareRate` per-state duplication with `FED.housing.tenantShareRate` (CC1) | Carries from C8 task-55 F1 | XS |
| **P2** | Add `// Verified: YYYY-MM-DD` markers across all state constants (CC3) | New | M (single audit pass + commit) |
| **P3** | Childcare `exitFPL = 2.85` per-size SMI lookup (currently family-of-4 anchored) | New | M |
| **P3** | Sliding-scale childcare `coPayRate` (CC5) | New | M per state |
| **P3** | Age-band-tagged childcare value (CC4) | New | M per state |

---

## Out-of-scope items discovered

- **Federal EITC table refresh cadence** — TY2025 IRS Rev. Proc. 2024-40 just shipped via task-83 in this cycle. Future TY refreshes (annual) need a documented refresh checklist. Same applies to FPL (annual HHS update) and SNAP COLA (annual USDA update). Surfaces as task-40 (data-refresh checklist) which already exists in backlog.
- **State EITC top-ups** — OH (no state EITC), TX (no state EITC), NC (no state EITC), MI (6% refundable state EITC) — modelling delegated to task-41, gated until federal landed (now satisfied via task-83).
- **Marketplace subsidy enhancement expiration** — ARP/IRA enhanced PTCs expired end of 2025; pre-ARP table now applies. Confirmed in `FED.aca.pctTable`. ✅ correctly modelled.

## Owner decision needed

1. **Provenance bar** — should this project commit to "primary agency citation only" as a release gate, or accept secondary aggregators (KFF, snapscreener) for non-flagship constants?
2. **County anchoring** — for SLCSP, which counties should anchor the state-default benchmark? (Recommended: largest-population MSA in each state — Franklin OH, Dallas TX, Wake NC, Wayne MI.)
3. **FY-refresh cadence** — should this audit be repeated annually around February (after most agency FY2026 updates ship) and made a recurring task?
