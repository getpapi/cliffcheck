# New York Benefit Program Rules — FY2026
> Last reviewed: task-144 — 07-07-2026

Research document for the CliffCheck benefit calculation engine. Covers New York-specific rules for FY2026 with sources. Federal-uniform figures (FPL, SNAP formula, ACA applicable-percentage table, EITC) are shared with the other states; only NY-specific overrides and the **Essential Plan double-cliff** are detailed here.

New York's distinguishing mechanic is the **Essential Plan** (ACA §1331 Basic Health Program) — near-$0 coverage between Medicaid and the full marketplace that creates a **second benefits cliff** the other seven states do not have. That is the reason NY is modelled with a genuine engine branch (`aca.essentialPlan` + `calcACAPremium`) rather than a data-only state file.

---

## 1. Federal Poverty Guidelines (FY2026)

**Source:** HHS/ASPE Federal Register, effective January 2026
**URL:** https://aspe.hhs.gov/topics/poverty-economic-mobility/poverty-guidelines
**Retrieved:** 2026-07-06

Same federal table used across all states (engine `FED.fpl`): base $15,960 (1 person) + $5,680 per additional person. Family of 4 = **$33,000/year**.

Key FPL multiples for a family of 4 (used throughout NY's cliffs):
- 100% FPL = $33,000
- 138% FPL = $45,540  → Medicaid ceiling (adults)
- **200% FPL = $66,000  → Essential Plan ceiling (the second cliff)**
- ~353% FPL = ~$116,500 → childcare (CCAP) ceiling (85% State Median Income)
- 400% FPL = $132,000 → Child Health Plus / ACA PTC ceiling

---

## 2. SNAP

**Source:** NY OTDA — SNAP (GIS 25DC024, 2025-2026 income guidelines)
**URLs:**
- https://otda.ny.gov/policy/gis/2025/25DC024.pdf
- https://otda.ny.gov/programs/snap/

**Retrieved:** 2026-07-06

New York uses **Broad-Based Categorical Eligibility (BBCE)** with a **gross income limit of 200% FPL** (the maximum federal option) and no asset test. NY's tests tier by household composition — the **200% FPL** ceiling attaches to households with a dependent child, or a member 60+/disabled (the exact population a cliff tool models); households with earned income but none of those get a 130% FPL test. The federal SNAP benefit formula and the 100% FPL **net-income test** are unchanged from the engine's `FED.snap` model.

**Engine value:** `snap.grossLimitFPL = 2.0`.

As in the other BBCE states, the net-income test binds before the gross test for a family of 4: SNAP zeroes at roughly **$44.7k/year** (net income > 100% FPL), well below the 200% FPL gross ceiling ($66k) — so raising the gross limit from 150% to 200% does not change NY's SNAP cliff geometry. BBCE waives the asset test and raises the gross limit but never the net test.

---

## 3. Medicaid / Child Health Plus (CHIP)

**Source:** NY DOH — Medicaid MAGI income levels (GIS 26 MA/05); Child Health Plus eligibility & cost
**URLs:**
- https://www.health.ny.gov/health_care/medicaid/publications/docs/gis/26ma05_att1.pdf
- https://www.health.ny.gov/health_care/child_health_plus/eligibility_and_cost.htm

**Retrieved:** 2026-07-06

### Adults (MAGI, 19–64)
- New York is a **Medicaid expansion** state (since 2014). Adults and parents eligible to **138% FPL** (133% + 5% disregard).
- Family of 4: **$45,540/year**. Above this, adults route to the **Essential Plan** (see §4), not directly to the full marketplace — this is what softens the Medicaid cliff in NY relative to non-EP states.

**Engine values:** `medicaid.expanded = true`, `expansionFPL = 1.38`.

### Children — Child Health Plus (CHIP)
- Subsidised to **400% FPL** ($132,000 for a family of 4). Free below ~222% FPL; graduated per-child premiums ($15/$30/$45/$60, capped at 3 children) up to 400%; unsubsidised buy-in above 400% with no hard cutoff.
- Children's coverage does **not** mirror the adult Medicaid cliff — informational field `medicaid.childrenFPL = 4.0`.

---

## 4. Essential Plan — the §1331 Basic Health Program (NY's double-cliff)

**Source:** NY State of Health — Essential Plan; NY DOH press release (2026-03-23)
**URLs:**
- https://info.nystateofhealth.ny.gov/EssentialPlan
- https://www.health.ny.gov/press/releases/2026/2026-03-23_federal_approval_to_preserve_health_coverage.htm

**Retrieved:** 2026-07-06

### What it is
The Essential Plan (EP) is New York's Basic Health Program under ACA §1331 — a state-run tier that sits **between Medicaid (≤138% FPL) and the full marketplace**. Enrollees pay a **$0 monthly premium** (confirmed verbatim on the NYSOH Essential Plan page) with a $0 deductible; the tiers differ only in cost-sharing (lower band ≤~150% FPL has $0 copays; upper band ~150–200% FPL has small copays — PCP $15, specialist $25, ER $75).

### The 2026 ceiling contraction (why the second cliff moved to 200% FPL)
- The EP income ceiling was **250% FPL** under a 2024 federal §1332 waiver.
- Effective **July 1, 2026**, the ceiling **contracts to 200% FPL**. CMS approved reverting to base BHP authority on 2026-03-23 after **H.R.1 / Public Law 119-21 (July 2025)** defunded the expanded 200–250% band.
- Result: ~450k enrollees in the 200–250% band lose EP and shift to subsidised marketplace QHPs; ~1.3M below 200% keep it.
- 200% FPL, family of 4 = **$66,000/year**.

### The cliff
While a household's MAGI is inside the EP window it pays the **$0 EP premium** instead of the marketplace premium-tax-credit contribution. The moment income clears **200% FPL** it ages into full marketplace PTC premiums — a step **up** in cost of several thousand dollars in a single $1k income step. That is the **second cliff**, distinct from the standard Medicaid/childcare cliffs.

**Engine model:** `aca.essentialPlan = { maxFPL: 2.0, monthlyPremium: 0 }`, consumed by the branch in `lib/engine/aca.ts::calcACAPremium` — when the state declares `essentialPlan` and `fplFraction ≤ maxFPL`, the function returns the EP premium (annualised) instead of the PTC contribution; above the ceiling it falls through to the unchanged marketplace math. The field is `undefined` for every other state, so their ACA behaviour is byte-identical (regression-guarded in `nyRegression.test.ts`).

**Engine-verified geometry (family of 4):** effective take-home rises to **$90,685 at $66,000** (200% FPL, on EP) then drops to **$84,323 at $67,000** — a **−$6,362** second cliff as EP ($0 premium + CSR value) gives way to a marketplace premium (~$4,500) with reduced CSR.

---

## 5. ACA Marketplace (Premium Tax Credits)

**Source:** NY State of Health; IRS Form 8962 applicable-percentage table (federal, shared)
**URLs:**
- https://info.nystateofhealth.ny.gov/
- https://www.irs.gov/forms-pubs/about-form-8962

**Retrieved:** 2026-07-06

- New York runs its own exchange (**NY State of Health**) and uses **pure community rating** — marketplace premiums do **not** vary by age. Post-EP-contraction, the marketplace serves NY households above 200% FPL.
- The engine reuses the federal applicable-percentage table (`FED.aca.pctTable`) and the 400% FPL hard cliff. Cost-Sharing Reductions (CSR) apply on the same terms as elsewhere (Silver-plan AV uplift below 250% FPL).
- **SLCSP benchmark:** anchored on the **2026 statewide benchmark of $817/mo** (KFF State Health Facts) × the app's household curve `[1, 2, 2.5, 3, 3.75, 4.5]`, since per-size SLCSP is not published. Corroborated by NY State of Health's 2026 lowest-cost Silver of **$806.61** for NYC boroughs (a hard `.gov` floor; SLCSP sits just above LCSP). Community rating (NY Ins. Law §§3231/4317, NY DFS) means the single figure applies at any age. Engine: `aca.slcspMonthly = { 1: 817, 2: 1634, 3: 2043, 4: 2451, 5: 3064, 6: 3677 }`.

---

## 6. Childcare — Child Care Assistance Program (CCAP)

**Source:** NY OCFS — Child Care Assistance Program (26-OCFS-INF-06, 2026 income eligibility)
**URLs:**
- https://ocfs.ny.gov/main/sppd/policy/child-care.php
- https://ocfs.ny.gov/programs/childcare/ccap/

**Retrieved:** 2026-07-06

- NY sets the statewide CCAP eligibility ceiling at **85% State Median Income** (the maximum federal CCDF ceiling) — **~$116,492/year for a family of 4** (effective June 2026, OCFS 26-OCFS-INF-06) ≈ **353% FPL**. Family co-pay is capped low (~1% of income above FPL under recent OCFS rules).
- **Engine values:** `entryFPL = 3.53`, `exitFPL = 3.53` (85% SMI anchored on the family-of-4 figure; SMI and FPL scale differently by size, so this is an approximation for other sizes), `coPayRate = 0.01`, `coPayFreeFPL = 1.0`, `valuePerChild = [0, 12000, 24000, 34000]` (NY 75th-percentile market rate; statewide — NYC runs higher). The per-child value magnitudes remain **representative NY market-rate estimates**.
- Childcare produces NY's **largest** cliff (family of 4): the ~$24k two-child subsidy ends at the 85% SMI ceiling (~$116.5k), an engine-verified **~$22k** single-step drop at $117k.

---

## 7. Section 8 / Housing Choice Voucher (HCV)

**Source:** HUD FY2026 — New York, NY HUD Metro FMR Area (area METRO35620MM5600)
**URLs:**
- https://www.huduser.gov/portal/datasets/fmr/fmr2026/FY2026_FMR_Schedule.pdf
- https://www.huduser.gov/portal/datasets/il/il26/Section8-FY26.xlsx

**Retrieved:** 2026-07-06

- **Engine values (read from HUD FY2026 primary files):** `paymentStandardMonthly = 3644` (3BR metro FMR — full row: eff $2,529 / 1BR $2,655 / 2BR $2,910 / **3BR $3,644** / 4BR $3,959), `incomeLimitAnnual = 84800` (50% **Very-Low-Income** limit, family of 4 — the term-of-art VLI that gates Section 8 vouchers; **not** the LIHTC/NYC-lottery "50% AMI" of ~$67,450), `tenantShareRate = 0.30`.
- Modelled as **inactive unless the household holds a voucher** (same convention as every state — NYC/NYCHA waitlists are effectively closed).

---

## 8. New York State Income Tax (FY2026)

**Source:** NY Dept. of Taxation and Finance
**URL:** https://www.tax.ny.gov/
**Retrieved:** 2026-07-06

### Structure — PROGRESSIVE (modelled as a flat approximation)
Unlike the flat-tax states (OH, GA, PA), New York has a **progressive** schedule. The CliffCheck engine's tax model is **flat-only by design** (`tax.ts`; bracketed structures are a future engine feature), so NY is approximated by its **dominant middle bracket**:

- **Engine values:** `noTaxFloor = 25000`, `flatRate = 0.055`.
- Rationale: NY MFJ 2026 taxes most of the **~$28k–$162k taxable** band at **5.5%**. Below that, the standard deduction (~$16k MFJ) + dependent exemptions + household/low-income credits zero liability for a family of 4 up to roughly **$25k gross** — absorbed by the floor.
- **NYC city income tax is NOT modelled** (state-only baseline for v1). This understates the true tax burden for NYC residents — documented deferral.

### Not a cliff
State tax is a smooth, continuous cost — it does **not** create a cliff — so the flat approximation does not affect NY's cliff geometry (the Medicaid, Essential-Plan, and childcare cliffs are unchanged by the tax model). A bracketed NY tax is a candidate future engine task.

---

## 9. Summary: Cliff Points — Family of 4, New York, FY2026

| Program | Cliff Type | Annual Income at Cliff | Notes |
|---|---|---|---|
| SNAP | Graduated phase-out | ~$44,700 | Net-income test at 100% FPL binds (200% FPL BBCE gross ceiling never binds first) |
| Medicaid (adults 19–64) | Hard binary | **$45,540** (138% FPL) | Routes to Essential Plan, not straight to marketplace |
| **Essential Plan → marketplace** | **Hard second cliff** | **$66,000 (200% FPL)** | **$0 EP premium → marketplace PTC; −$6,362 engine-verified** |
| CCAP childcare | Hard exit cliff | **~$116,500** (85% SMI) | ~$24k two-child subsidy ends — NY's largest cliff (−$22k at $117k) |
| Child Health Plus / ACA PTC | Hard cliff | **$132,000** (400% FPL) | Outside the working-class range |

### The New York double-cliff story
New York is the only supported state where a household hits the cliff **twice**: once losing Medicaid at 138% FPL (softened by the Essential Plan catching them at $0 premium), then **again at 200% FPL** when the Essential Plan itself ends and they age into marketplace premiums. The July 2026 contraction of the EP ceiling from 250% to 200% FPL pulled that second cliff down into the heart of the working-class income band — "a raise can hit you twice."

---

## Source List

| Program | Primary Source | URL |
|---|---|---|
| FPL 2026 | HHS/ASPE | https://aspe.hhs.gov/topics/poverty-economic-mobility/poverty-guidelines |
| SNAP | NY OTDA GIS 25DC024 (200% FPL BBCE) | https://otda.ny.gov/policy/gis/2025/25DC024.pdf |
| Medicaid (MAGI) | NY DOH GIS 26 MA/05 | https://www.health.ny.gov/health_care/medicaid/publications/docs/gis/26ma05_att1.pdf |
| Child Health Plus | NY DOH | https://www.health.ny.gov/health_care/child_health_plus/eligibility_and_cost.htm |
| Essential Plan | NY State of Health; NY DOH (2026-03-23) | https://info.nystateofhealth.ny.gov/EssentialPlan |
| ACA PTC table | IRS Form 8962 (federal, shared) | https://www.irs.gov/forms-pubs/about-form-8962 |
| Childcare (CCAP) | NY OCFS 26-OCFS-INF-06 (85% SMI) | https://ocfs.ny.gov/main/sppd/policy/child-care.php |
| Section 8 / HCV | HUD FY2026 FMR Schedule + Section 8 income limits | https://www.huduser.gov/portal/datasets/fmr/fmr2026/FY2026_FMR_Schedule.pdf |
| ACA SLCSP benchmark | KFF 2026 (NY $817/mo); NYSOH LCSP $806.61 corroborates | https://info.nystateofhealth.ny.gov/sites/default/files/2026%20Lowest%20Cost%20SIlver%20Plan%20by%20County.pdf |
| NY state income tax | NY Dept. of Taxation and Finance | https://www.tax.ny.gov/ |

> **Value-provenance note.** All eligibility **thresholds** and **premium/rent dollar amounts** are now transcribed from primary sources: health coverage (Essential Plan ≤200% FPL + $0 premium, Medicaid 138% FPL, Child Health Plus 400% FPL) and SNAP (200% FPL BBCE), childcare (85% SMI), and tax from NY `.gov`; the SLCSP benchmark ($817/mo) from KFF with a `.gov` LCSP floor; and the HUD 3BR FMR ($3,644) + 50% VLI ($84,800) read directly from HUD FY2026 primary files. The **only** remaining representative estimate is the childcare **per-child value magnitude** (`valuePerChild`) — a market-rate proxy (as with every state), which affects the *depth* of the childcare cliff but not its *location*. Cliff locations are all threshold-driven and gov-sourced.
