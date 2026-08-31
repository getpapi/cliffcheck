# Ohio Benefit Program Rules — FY2026
> Last reviewed: task-84 — 27-04-2026

Research document for the CliffCheck benefit calculation engine. Covers Ohio-specific rules for FY2026 with sources. All figures apply to the 48 contiguous states unless noted.

---

## 1. Federal Poverty Guidelines (FY2026)

**Source:** HHS/ASPE Federal Register, effective January 13, 2026  
**URL:** https://aspe.hhs.gov/topics/poverty-economic-mobility/poverty-guidelines  
**Retrieved:** 2026-04-21

| Household Size | 100% FPL / year | 100% FPL / month |
|---|---|---|
| 1 | $15,960 | $1,330 |
| 2 | $21,640 | $1,803 |
| 3 | $27,320 | $2,277 |
| 4 | $33,000 | $2,750 |
| 5 | $38,680 | $3,223 |
| 6 | $44,360 | $3,697 |

Each additional person: +$5,680/year (+$473/month)

Key FPL multiples for family of 4 (used throughout):
- 100% FPL = $33,000/year
- 130% FPL = $42,900/year
- 138% FPL = $45,540/year
- 145% FPL = $47,850/year
- 200% FPL = $66,000/year
- 300% FPL = $99,000/year
- 400% FPL = $132,000/year

---

## 2. SNAP (Supplemental Nutrition Assistance Program)

**Source:** USDA FNS; snapscreener.com Ohio guide; Ohio JFS  
**URLs:** https://www.fns.usda.gov/snap/recipient/eligibility | https://www.snapscreener.com/guides/ohio  
**Retrieved:** 2026-04-21

### Ohio BBCE Gross Income Limit
Ohio uses **Broad-Based Categorical Eligibility (BBCE)** — gross income limit is **200% FPL** with no asset test for most households. This is more generous than the federal 130% FPL default.

| HH Size | Gross Limit (200% FPL) / month | Net Limit (100% FPL) / month |
|---|---|---|
| 1 | $2,660 | $1,330 |
| 2 | $3,607 | $1,803 |
| 3 | $4,553 | $2,277 |
| 4 | $5,500 | $2,750 |

### Maximum Monthly Benefit (Oct 2025 – Sep 2026)

| HH Size | Max Benefit / month |
|---|---|
| 1 | $298 |
| 2 | $549 |
| 3 | $785 |
| 4 | $994 |
| 5 | $1,183 |

### Deductions

| Deduction | Value |
|---|---|
| Standard deduction (HH 1–3) | $209/month |
| Standard deduction (HH 4) | $228/month |
| Standard deduction (HH 5) | $247/month |
| Earned income deduction | 20% of gross earned income |
| Excess shelter deduction | shelter cost − 50% of adjusted income, capped at $712/mo (FY2026, 48 states + DC, no elderly/disabled) |

### Benefit Calculation Formula
```
adjusted = gross_monthly − standard_deduction − (earned_income × 0.20)
shelter_proxy = (has_voucher) ? 0 : gross_monthly × 0.30        // HUD affordability proxy
excess_shelter = min($712, max(0, shelter_proxy − adjusted × 0.5))
net_income = max(0, adjusted − excess_shelter)
gross_test: gross ≤ state.gross_limit (200% FPL in OH BBCE; 130% FPL federal default)
net_test:   net_income ≤ 100% FPL/12
snap_benefit = max(0, max_benefit − (net_income × 0.30))
```

SNAP is a **graduated phase-out**, not a hard cliff. Benefit reduces $0.30 per $1 of net income.

The **gross test** and **net test** are both binding — BBCE waives the asset test and raises the gross limit but never waives the net test. CliffCheck applies both correctly per state.

### Cliff Point — Family of 4
**Binding constraint: the net income test at 100% FPL ($2,750/month), not the benefit formula.**

For an Ohio family of 4 with no Section 8 voucher and earnings near the cliff edge, the shelter proxy (~30% of gross) is approximately equal to 50% of adjusted income, so excess shelter ≈ 0 in this band — the cliff edge is unchanged from the simpler model:

```
net = gross × 0.80 − $228
$2,750 = gross × 0.80 − $228
gross = ($2,750 + $228) / 0.80 = $3,723/month = ~$44,671/year
```

**SNAP = $0 for family of 4 when gross income ≥ ~$44,671/year** (engine-verified).

The benefit formula would zero out at ~$53,100 (net = $3,313/month), but the 100% FPL net income test eliminates eligibility first (~$44,671). Ohio BBCE only waives the asset test — the net income test remains. **Corrected from initial research estimate of $53,100.**

The excess shelter deduction matters most for very-low-income households without a voucher (where shelter > 50% of adjusted income) — it can push borderline households back onto SNAP. The deduction is capped at $712/mo per USDA FY2026 COLA notice for households without elderly/disabled members.

### Ohio-Specific Notes
- Ohio applies BBCE since 2010 — no asset test for most households
- Differs from federal baseline: Ohio uses 200% FPL gross limit vs. federal 130% FPL
- SNAP benefits are adjusted each October based on USDA Thrifty Food Plan updates

---

## 3. Medicaid / CHIP

**Source:** Ohio Department of Medicaid; healthinsurance.org Ohio guide; medicaidplanningassistance.org  
**URLs:** https://www.medicaid.gov/state-overviews/stateprofile.html?state=Ohio | https://dam.assets.ohio.gov/image/upload/medicaid.ohio.gov/Families,%2C%20Individuals/Programs/whoQualifies/Children_Families_Adults.pdf  
**Retrieved:** 2026-04-21

### Ohio Medicaid Expansion — Adults (19–64)
- Eligibility threshold: **138% FPL** (includes 5% income disregard; statutory = 133% FPL + 5%)
- Family of 4: **$45,540/year** ($3,795/month)
- Ohio expanded Medicaid in 2014 under ACA; no asset limits for expansion adults under 65
- **Binary cliff**: household either has Medicaid or doesn't — no graduated phase-out
- Above threshold: adults transition to ACA marketplace

### Children (Medicaid / CHIP)
- Eligibility: up to **216% FPL**
- Family of 4: **$71,280/year**
- Children remain eligible for Medicaid/CHIP while parents transition to marketplace
- This is important: children's coverage does NOT mirror the adults' Medicaid cliff

### Pregnant Women
- Eligibility: up to **205% FPL**
- Family of 4: **$67,650/year**

### Cliff Point — Adults, Family of 4
- **$45,540/year** — above this, adults lose Medicaid and must obtain marketplace coverage
- A hard binary: $1 over the line means full loss of Medicaid coverage
- Transition cost = marketplace premium minus any PTC (significant at incomes just above 138% FPL)

### Ohio-Specific Notes
- Ohio uses MAGI-based rules for ACA-expansion adults
- Parents/caretakers qualify at ~100% FPL — lower than expansion adults
- Ohio Medicaid threshold differs from federal baseline: ACA expansion states cover to 138% FPL vs. 100% FPL in non-expansion states

---

## 4. ACA Marketplace (Premium Tax Credits)

**Source:** KFF; thefinancebuff.com; Congress.gov CRS R48290  
**URLs:** https://thefinancebuff.com/aca-premium-tax-credit-percentages.html | https://www.congress.gov/crs-product/R48290  
**Retrieved:** 2026-04-21

### 2026 Context
The ARP/IRA enhanced PTCs expired at end of 2025 and were **not extended by Congress**. The standard (pre-ARP) PTC table applies for 2026. The **subsidy cliff at 400% FPL returned** in 2026.

### Eligibility Range
- Eligible: **100%–400% FPL** (family of 4: $33,000–$132,000/year)
- Below 100% FPL → Medicaid eligible (no PTC)
- Above 400% FPL → No PTC; family pays full SLCSP premium

### Expected Premium Contribution (2026 Standard Table)

| FPL Range | % of Income Toward Benchmark Premium |
|---|---|
| < 133% | 2.10% |
| 133–150% | 3.14% – 4.19% |
| 150–200% | 4.19% – 6.60% |
| 200–250% | 6.60% – 8.44% |
| 250–300% | 8.44% – 9.96% |
| 300–400% | 9.96% |
| > 400% | No subsidy — full premium |

PTC = SLCSP_premium − (income × applicable_percentage)

### Ohio Benchmark Premium (SLCSP)
Ohio-specific SLCSP varies by county. Representative estimate for Ohio (central/northeast):
- Individual: ~$700–$850/month (~$8,400–$10,200/year)
- Family of 4: ~$1,800–$2,400/month (~$21,600–$28,800/year)

**CliffCheck engine default:** $2,100/month ($25,200/year) for family-of-4 SLCSP.

### Cliff Point — Family of 4
- **400% FPL = $132,000/year**
- At income just below 400% FPL: PTC covers most/all of premium
- At income $1 above $132,000: family must pay full ~$25,200/year premium
- This is a genuine **hard cliff** — a small income increase eliminates thousands in subsidy

### Modeling Note for Keisha ($54K → $82K range)
The 400% FPL cliff ($132K) is above Keisha's relevant income range. The relevant ACA event for Keisha is the **Medicaid exit at 138% FPL ($45,540)**:
- Below $45,540: Medicaid (effectively free)
- Above $45,540: must buy ACA marketplace coverage
- At $54,000 income: family of 4 is at 163% FPL → expected contribution ≈ 5.6% of income ≈ $3,024/year for benchmark premium; PTC = $25,200 - $3,024 = $22,176 → net cost ~$3,024/year
- At $70,000: 212% FPL → expected contribution ≈ 7.0% = $4,900/year; PTC = $25,200 - $4,900 = $20,300 → net cost ~$4,900/year

### Cost-Sharing Reductions (CSR) — Silver Plan Below 250% FPL
**Source:** HHS Notice of Benefit and Payment Parameters 2026 — 45 CFR 156.420
**Retrieved:** 2026-04-26

CSR is a **separate subsidy from PTC** that reduces deductibles, copays, and out-of-pocket maximums for Silver-plan enrollees below 250% FPL. Unlike PTC (which lowers monthly premium), CSR lowers what the household pays when they actually use care. The CSR uplift makes the same Silver plan behave like a Gold/Platinum plan at no extra premium cost.

| FPL Range | Silver Plan AV | Effective Annual Value (per enrollee, KFF national avg) |
|---|---|---|
| ≤150% FPL | 94% | ~$1,400 |
| 150–200% FPL | 87% | ~$900 |
| 200–250% FPL | 73% | ~$200 |
| > 250% FPL | 70% (base) | $0 (no CSR) |

**CliffCheck modelling:** `calcACACSR(annualIncome, familySize)` returns the per-enrollee tier value × familySize. Eligibility gated by `calcEffectiveTakeHome` to the same conditions as PTC (not on Medicaid, no employer coverage). Surfaced in the breakdown as a separate "ACA CSR" line so users see the cost-sharing benefit distinctly from the premium subsidy.

**Modelling simplifications (documented):**
- Per-enrollee dollar values are KFF national averages — does not vary by age, region, or actual utilization
- Silver plan assumed (federal benchmark default for CSR; only Silver plans carry CSR variants)
- Native American CSR (zero cost-sharing at any income) not modelled

**Demo impact for Ohio ($44k/4):** Ohio family of 4 at $44k is at 134% FPL → on Medicaid (expansion) → CSR=0 (orchestrator suppresses CSR for Medicaid-eligible). The OH demo numbers are unchanged. CSR materially affects non-expansion states: a Texas family of 4 at $44k receives $5,600 in CSR effective value ($1,400 × 4) on top of the PTC.

### Ohio-Specific Notes
- Ohio did not expand state-based PTC enhancements when federal ones expired
- ACA marketplace plans available in all Ohio counties
- Pre-ARP contribution table applies as of January 2026

---

## 5. Ohio PFCC Childcare Subsidy

**Source:** Ohio Dept. of Children and Youth; childcarecostfinder.com Ohio guide; Policy Matters Ohio  
**URLs:** https://childrenandyouth.ohio.gov/for-providers/resources/pfcc | https://childcarecostfinder.com/guides/childcare-subsidies-ohio/  
**Retrieved:** 2026-04-21

### Overview
Publicly Funded Child Care (PFCC) under Ohio's CCDF plan. Administered by Ohio DCY via county JFS offices. Covers children under 13 (or 18 if disabled). Parent must be working, in school, or in training.

### Eligibility
- **Entry income limit: ≤145% FPL**
  - Family of 4: **$47,850/year** ($3,885/month)
- **Exit income limit (continuation): ≤300% FPL**
  - Family of 4: **$99,000/year** (if already enrolled, subsidy continues with higher copays)
- Children: under age 13

### Co-pay Structure (sliding scale)

| Income Level | Approximate Co-pay |
|---|---|
| < 100% FPL | $0/month (waived) |
| 100–145% FPL | ~7% of monthly income |
| 145–200% FPL | ~7–9% of monthly income (continuation only) |
| > 200–300% FPL | Capped at 7% of household income (effective July 2026) |
| > 300% FPL | Ineligible |

### Benefit Value (Full Subsidy)
PFCC pays up to the 75th percentile of county market rates. Representative annual values for Ohio (2026):
- 1 school-age child: ~$9,000–$11,000/year
- 1 toddler/preschooler: ~$10,000–$14,000/year
- 2 children (school-age + toddler): **~$18,000–$22,000/year**

**CliffCheck engine default for Keisha (2 children): $18,000/year full benefit when income ≤145% FPL.**

### Cliff Point — Family of 4
- **Hard entry cliff at 145% FPL = $47,850/year** — no new enrollment above this
- Already-enrolled families exit at **300% FPL = $99,000/year**
- The entry cliff is the critical one for CliffCheck: new users above $47,850 cannot access PFCC

### Ohio-Specific Notes
- Ohio expanded PFCC eligibility in 2023–2024 using ARPA CCDF funds (from 130% to 145% FPL entry)
- Differs from federal baseline: some states use lower entry thresholds (100–130% FPL)
- As of July 2026, co-pay cap is 7% of household income (new CMS rule adopted by Ohio)
- Waiting lists exist in some Ohio counties even below the income threshold

---

## 6. Section 8 / Housing Choice Voucher (HCV)

**Source:** HUD; Columbus Metropolitan Housing Authority (CMHA); Lucas MHA payment standards  
**URLs:** https://www.hud.gov/helping-americans/housing-choice-vouchers-tenants | https://cmhanet.com/housing-choice-voucher  
**Retrieved:** 2026-04-21

### Overview
Federally funded, locally administered by PHAs. HCV provides a voucher that covers the gap between 30% of adjusted income and the local payment standard.

### Income Eligibility (Ohio, Columbus MSA)
- Very Low Income (50% AMI) required to receive a new HCV
- Columbus MSA AMI, family of 4 (2026 est.): ~$105,000
- 50% AMI for family of 4 (Columbus): **~$52,500/year**
- 80% AMI for family of 4 (Columbus): **~$84,000/year** (income limit for Low Income category)

### Payment Standards (Columbus / Ohio, 2026 est.)
| Unit Size | Payment Standard / month |
|---|---|
| 2 BR | $1,325–$1,500 |
| 3 BR | $1,600–$1,900 |

### Benefit Value Calculation
```
tenant_share = 0.30 × adjusted_monthly_income
voucher_value = payment_standard - tenant_share
```

At income $54,000/year (Keisha baseline without voucher):
- Monthly: $4,500
- Tenant share: $4,500 × 0.30 = $1,350
- Voucher value (3BR): $1,750 − $1,350 = **$400/month = $4,800/year**

### CliffCheck Modeling Assumption
**Section 8 is modeled as NOT ACTIVE for the default Keisha persona.**

Reason: Ohio HCV waitlists have been closed in most major metro areas (Columbus, Cleveland, Cincinnati) since 2022. The median wait time nationally is 2–4 years where lists are open. A user who currently has a Section 8 voucher would know it — they can toggle it on.

Do NOT model Section 8 as a flowing graduated benefit for the default view. It distorts the chart for the majority of users who do not have a voucher and creates false precision.

**If user indicates they have a Section 8 voucher:** Model as a fixed monthly value = payment_standard − (0.30 × monthly_income), zeroed out at 0.

---

## 7. Ohio State Income Tax (FY2026)

**Source:** Policy Matters Ohio, "The Great Ohio Tax Shift, 2026"; Tax Foundation 2026 State Tax Changes; NerdWallet Ohio State Tax  
**URLs:**
- https://policymattersohio.org/research/the-great-ohio-tax-shift-2026/
- https://taxfoundation.org/research/all/state/2026-state-tax-changes/
- https://www.nerdwallet.com/taxes/learn/ohio-state-tax

**Retrieved:** 2026-04-27

### Structure (post-HB 96, 2025)
Ohio moved to a **flat income tax** for tax year 2026:
- **0%** on Ohio AGI ≤ **$26,050**
- **2.75%** flat rate on Ohio AGI **above $26,050**

The threshold is the same for **all filing statuses** (single, MFJ, HoH).

### Not a cliff
Crossing the $26,050 threshold does **not** trigger retroactive tax on full income. Tax applies only to the amount **above** the threshold. A worker at $26,051 owes ~$0.03; a worker at $44,000 owes $494.

### Threshold history
- Threshold has been **$26,050 since 2021**.
- Bracket indexing is suspended through 2025–2026 (legislative decision; not auto-adjusting for inflation).

### Joint filing credit / personal exemptions (TY2026)
- Available **only** to taxpayers with MAGI ≤ $500,000.
- Out of scope for CliffCheck's working-class persona — not modelled.

### Local / municipal income tax
- Ohio cities operate separate local income taxes via RITA (Regional Income Tax Agency) and CCA (Central Collection Agency). Rates vary by city (~1.5–2.85%).
- **Out of scope for CliffCheck** — would require user input for city of residence/work. Documented as a known understatement of true tax burden for OH workers in major cities.

### CliffCheck Modeling Assumption
- Ohio AGI is approximated as **gross wages** (no itemised deduction capture in user input).
- Real Ohio AGI is gross wages minus federal AGI deductions plus/minus Ohio-specific add-backs/deductions. For wage-only working-class households, this is a small approximation error.
- Modelled as `calcStateIncomeTax(annualIncome, { stateCode: 'OH' })` returning a positive `stateTaxOwed` amount; orchestrator subtracts from `totalEffective` alongside ACA premium cost.

### Cliff Impact — Family of 4, Ohio, FY2026
- At $44,000 (canonical demo): owe **$494/year** in OH state tax.
- At $70,000 (offered scenario): owe **$1,209/year** in OH state tax.
- **Marginal impact of the $26K raise:** +$715 in additional state tax, slightly sharpening the cliff (from ~−$9,039 to ~−$9,754 net effective change).

---

## 8. Summary: Cliff Points — Family of 4, Ohio, FY2026

| Program | Cliff Type | Annual Income at Cliff | Notes |
|---|---|---|---|
| Medicaid (adults 19–64) | Hard binary | **$45,540** (138% FPL) | Children eligible to 216% FPL |
| PFCC Childcare (entry) | Hard entry cliff | **$47,850** (145% FPL) | Continuation to $99K for enrolled families |
| SNAP | Graduated phase-out | **~$44,671** (net income test) | Net income > 100% FPL eliminates eligibility |
| ACA PTC (400% cliff) | Hard cliff | **$132,000** (400% FPL) | Outside Keisha's range; relevant for higher earners |
| Section 8 / HCV | Waitlist/binary | ~$52,500 (50% AMI) | Modeled as inactive by default |

### The Keisha Danger Zone ($44K–$48K)
The most dangerous income range for Ohio families of 4 in 2026 — engine-verified:
- **~$44,671**: SNAP eliminated (net income test at 100% FPL) → lose up to $2,184/year
- **$45,540**: Lose Medicaid → must buy ACA marketplace coverage (~$1,600/year net cost at that income)
- **$47,850**: Can no longer newly enroll in PFCC childcare → lose ~$19,920/year in childcare subsidy

**The $47,850 PFCC cliff is the dominant cliff.** A $4,000 raise from $44K to $48K can drop effective take-home by ~$24,000:
- At $44K: effective = $70,604 (wages + SNAP + Medicaid + PFCC)
- At $48K: effective = $46,124 (wages − ACA only; no benefits)
- Net loss from a $4,000 raise: **−$24,480 effective income**

Recovery happens as wages continue rising: at $70K effective = $65,068. The chart shows a "valley of death" between $48K–$65K where taking a raise leaves you worse off than staying at $44K.

---

## Source List

| Program | Primary Source | URL |
|---|---|---|
| FPL 2026 | HHS/ASPE Federal Register, Jan 15 2026 | https://aspe.hhs.gov/topics/poverty-economic-mobility/poverty-guidelines |
| SNAP | USDA FNS; snapscreener.com Ohio | https://www.snapscreener.com/guides/ohio |
| SNAP benefits | USDA FNS FY2026 allotments | https://www.fns.usda.gov/snap/recipient/eligibility |
| Ohio Medicaid | Ohio Dept. of Medicaid; healthinsurance.org | https://www.medicaid.gov/state-overviews/stateprofile.html?state=Ohio |
| ACA PTC 2026 | thefinancebuff.com; Congress.gov CRS R48290 | https://thefinancebuff.com/aca-premium-tax-credit-percentages.html |
| Ohio PFCC | Ohio DCY; childcarecostfinder.com | https://childrenandyouth.ohio.gov/for-providers/resources/pfcc |
| Section 8 | HUD; CMHA; Lucas MHA | https://www.hud.gov/helping-americans/housing-choice-vouchers-tenants |
| OH state income tax | Policy Matters Ohio; Tax Foundation; NerdWallet | https://policymattersohio.org/research/the-great-ohio-tax-shift-2026/ |
