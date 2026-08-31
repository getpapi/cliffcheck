/**
 * lib/engine/provenance.ts — machine-readable gov-source provenance for the
 * methodology page + inline source chips.
 *
 * Provenance is attached at PROGRAM/SOURCE granularity (not per scalar constant):
 * each program the engine models carries one structured `Provenance` record
 * `{ source, url, citation, retrieved, note? }`, transcribed verbatim from the
 * inline citation comments in federal.ts and the per-state rule files. This is
 * transcription, NOT research — the numbers still live in the rule tables; this
 * file is the additive metadata layer alongside them.
 *
 * Two provenance maps:
 *  • PROGRAM_PROVENANCE — federal / cross-state programs whose source is the same
 *    regardless of state (fpl, snap, aca, eitc, medicaid, housing).
 *  • STATE_PROGRAM_PROVENANCE — state-specific programs whose gov source varies
 *    per state (childcare, incomeTax). Keyed by state code, then program.
 *
 * collectSources(code) merges both into per-state `Source[]` for the UI. Every
 * URL that reaches either map is a government host — the Vitest guard in
 * __tests__/provenance.test.ts walks the whole structure and fails the build if
 * a non-gov URL ever slips in (see PLAN.md §"Machine-readable provenance").
 */
import { getState, isSupportedState } from './registry';
import type { Provenance, Source, StateCode } from './types';

/**
 * Gov-host allowlist for the provenance guard. A URL is a valid gov source iff
 * its hostname ends in `.gov` (covers federal + every state, e.g. ohio.gov,
 * medicaid.gov, irs.gov, huduser.gov, fns.usda.gov, aspe.hhs.gov) OR exactly
 * matches one of the explicit federal hosts below (belt-and-braces — these are
 * all already `.gov`, listed so the intent reads clearly and stays stable if the
 * `.gov` suffix rule is ever tightened).
 *
 * Every program that exposes a URL cites a gov host, including the ACA
 * applicable-percentage table (§36B), sourced to the IRS Form 8962 instructions.
 */
const GOV_HOST_ALLOWLIST = new Set<string>([
  'federalregister.gov',
  'irs.gov',
  'huduser.gov',
  'medicaid.gov',
]);

/**
 * True iff `url` resolves to a government host (`*.gov` hostname suffix, or an
 * exact match in GOV_HOST_ALLOWLIST). Parses the URL properly so `https://`,
 * `www.`, ports, and paths don't affect the verdict. Returns false for
 * unparseable input rather than throwing.
 */
export function isGovSource(url: string): boolean {
  if (!url) return false;
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return false;
  }
  // Strip a leading www. for the exact-match check (suffix check is unaffected).
  const bare = host.startsWith('www.') ? host.slice(4) : host;
  if (host === 'gov' || host.endsWith('.gov')) return true;
  return GOV_HOST_ALLOWLIST.has(bare);
}

/**
 * Federal / cross-state program provenance, keyed by program. Each entry is
 * transcribed verbatim from the inline citation comments in lib/engine/federal.ts.
 * These sources are identical across supported states (state-specific overrides
 * — Medicaid state profiles, etc. — live in STATE_PROGRAM_PROVENANCE and layer
 * on top in collectSources). Every `url` here is a gov host by construction.
 */
export const PROGRAM_PROVENANCE: Record<string, Provenance> = {
  // Federal Poverty Guidelines — HHS/ASPE, published in the Federal Register.
  fpl: {
    source: 'HHS/ASPE — Federal Poverty Guidelines',
    url: 'https://aspe.hhs.gov/topics/poverty-economic-mobility/poverty-guidelines',
    citation: 'HHS Poverty Guidelines 2026 (Federal Register, 2026-01-15)',
    retrieved: '2026-04-25',
  },
  // SNAP — USDA FNS FY2026 (7 CFR §273.9 + COLA notice).
  snap: {
    source: 'USDA FNS — SNAP eligibility (FY2026)',
    url: 'https://www.fns.usda.gov/snap/recipient/eligibility',
    citation: '7 CFR §273.9 + USDA COLA notice FY2026',
    retrieved: '2026-04-25',
  },
  // ACA applicable-percentage table (§36B) — IRS Form 8962 instructions.
  aca: {
    source: 'IRS — Form 8962 (Premium Tax Credit)',
    url: 'https://www.irs.gov/forms-pubs/about-form-8962',
    citation: 'IRS Form 8962 instructions, applicable-figure table (§36B)',
    retrieved: '2026-07-04',
  },
  // EITC — IRS Rev. Proc. 2024-40 (TY2025 inflation adjustments).
  eitc: {
    source: 'IRS — Earned Income Tax Credit tables',
    url: 'https://www.irs.gov/credits-deductions/individuals/earned-income-tax-credit/eitc-tables',
    citation: 'IRS Rev. Proc. 2024-40 (TY2025 inflation adjustments)',
    retrieved: '2026-04-25',
  },
  // Child Tax Credit (IRC §24) — IRS Instructions for Schedule 8812 (FY2026 current law).
  ctc: {
    source: 'IRS — Child Tax Credit (Schedule 8812)',
    url: 'https://www.irs.gov/instructions/i1040s8',
    citation: 'IRC §24; IRS Schedule 8812 instructions ($2,000/child, $1,700 refundable cap, $2,500 earned-income floor — Rev. Proc. 2024-40)',
    retrieved: '2026-07-31',
  },
  // FICA — SSA contribution/benefit base + IRS Topic 751 (task-181).
  fica: {
    source: 'SSA — Social Security & Medicare tax rates',
    url: 'https://www.ssa.gov/oact/cola/cbb.html',
    citation: 'SSA Contribution and Benefit Base (TY2025 wage base $176,100); OASDI 6.2% + Medicare 1.45%',
    retrieved: '2026-08-02',
  },
  // Federal income tax — TY2025 brackets + standard deduction (task-181).
  fedIncomeTax: {
    source: 'IRS — Federal income tax rates and brackets',
    url: 'https://www.irs.gov/filing/federal-income-tax-rates-and-brackets',
    citation: 'IRS Rev. Proc. 2024-40 (TY2025) as amended by P.L. 119-21 (standard deduction $15,750/$31,500/$23,625)',
    retrieved: '2026-08-02',
  },
  // Medicaid — medicaid.gov state overview (federal default; per-state profile
  // URLs override in STATE_PROGRAM_PROVENANCE where a state file cites one).
  medicaid: {
    source: 'CMS — Medicaid state overviews',
    url: 'https://www.medicaid.gov/state-overviews/stateprofile.html',
    citation: 'medicaid.gov state Medicaid & CHIP profile',
    retrieved: '2026-04-25',
  },
  // Section 8 / Housing Choice Voucher — HUD FY2026 Fair Market Rents dataset.
  housing: {
    source: 'HUD — Fair Market Rents (FY2026)',
    url: 'https://www.huduser.gov/portal/datasets/fmr.html',
    citation: 'HUD FY2026 FMR + Income Limits datasets',
    retrieved: '2026-04-25',
  },
};

/**
 * State-specific program provenance for programs whose gov source varies per
 * state — childcare subsidies and state income tax. Keyed by state code, then
 * program. Transcribed verbatim from the per-state rule-file comments.
 *
 * Where a state file cites a clean gov/state `.gov` URL, it is used. Where none
 * exists (Ohio's flat income tax cites only third-party policy analyses — Policy
 * Matters Ohio and the Tax Foundation, neither a `.gov` host), the program is
 * recorded explicitly source-less: `url` omitted and a `note` explaining why.
 * The guard forbids inventing a URL or citing a non-gov host, so a missing
 * primary source is surfaced honestly rather than papered over.
 */
export const STATE_PROGRAM_PROVENANCE: Record<string, Partial<Record<string, Provenance>>> = {
  OH: {
    childcare: {
      source: 'Ohio DCY — Publicly Funded Child Care (PFCC)',
      url: 'https://childrenandyouth.ohio.gov/for-providers/resources/pfcc',
      citation: 'Ohio Dept. of Children & Youth — PFCC provider resources',
      retrieved: '2026-04-25',
    },
    // Ohio flat income tax (post-HB 96, 2025) is transcribed from third-party
    // analyses — Policy Matters Ohio and the Tax Foundation. Neither is a `.gov`
    // host, so no machine-readable primary source is exposed here.
    incomeTax: {
      source: 'Ohio flat income tax (HB 96, 2025)',
      url: '',
      citation:
        'Policy Matters Ohio "The Great Ohio Tax Shift, 2026"; Tax Foundation 2026 State Tax Changes',
      retrieved: '2026-04-27',
      note: 'These Ohio income-tax figures are transcribed from third-party policy analyses (Policy Matters Ohio and the Tax Foundation) rather than a primary state source, so this citation appears without an official .gov link. The figure itself is disclosed above.',
    },
  },
  TX: {
    childcare: {
      source: 'Texas Workforce Commission — Child Care Services (CCS)',
      url: 'https://www.twc.texas.gov/programs/child-care',
      citation: 'TWC Child Care Services program page',
      retrieved: '2026-04-25',
    },
    // Texas has no state income tax — no incomeTax program to source.
  },
  NC: {
    childcare: {
      source: 'NC DHHS DCDEE — Subsidized Child Care Assistance (SCCAP)',
      url: 'https://ncchildcare.ncdhhs.gov/Home/Work-With-Parents/Financial-Assistance',
      citation: 'NC DCDEE — financial assistance for families',
      retrieved: '2026-04-25',
    },
    // NC flat income tax — 3.99% (2026 legislated step-down), NC standard
    // deduction $25,500 MFJ. Primary source is the NC Dept. of Revenue.
    incomeTax: {
      source: 'NC Dept. of Revenue — individual income tax',
      url: 'https://www.ncdor.gov/taxes-forms/individual-income-tax',
      citation: 'NCDOR — 2026 flat rate 3.99%; $25,500 MFJ standard deduction',
      retrieved: '2026-07-07',
    },
  },
  MI: {
    childcare: {
      source: 'Michigan MDHHS — Child Development and Care (CDC)',
      url: 'https://www.michigan.gov/mdhhs/assistance-programs/childcare',
      citation: 'MDHHS Child Development and Care scholarship',
      retrieved: '2026-04-25',
    },
    // MI flat income tax — 4.25% (statutory 2026), family-of-4 personal-exemption
    // floor (~$5,800/exemption, 2025 figure carried as a 2026 estimate). Primary
    // source is the Michigan Dept. of Treasury.
    incomeTax: {
      source: 'Michigan Dept. of Treasury — individual income tax',
      url: 'https://www.michigan.gov/taxes/iit',
      citation: 'MI Treasury — 2026 flat rate 4.25%; ~$5,800/exemption (2025 est.)',
      retrieved: '2026-07-07',
    },
  },
  FL: {
    // Florida's School Readiness program is documented on fldoe.org — the Florida
    // Dept. of Education site, which is a `.org` host, NOT `.gov`. Per the gov-only
    // guard, the non-gov URL is not exposed; the citation is surfaced source-less
    // with a note so the number stays disclosed and the gap is honest.
    childcare: {
      source: 'Florida DOE — School Readiness Program',
      url: '',
      citation:
        'Florida Office of Early Learning — School Readiness (fldoe.org/schools/early-learning/parents/school-readiness.stml)',
      retrieved: '2026-04-25',
      note: 'Florida publishes its School Readiness program on fldoe.org, the state education department’s site, which is not a .gov domain. We link only to official .gov sources, so this citation appears without a link rather than point to a page we cannot confirm as the primary record. The figure itself is disclosed above.',
    },
    // Florida has no state income tax — no incomeTax program to source.
  },
  GA: {
    childcare: {
      source: 'Georgia DECAL — Childcare and Parent Services (CAPS)',
      url: 'https://www.decal.ga.gov/qualityinitiatives/CAPS.aspx',
      citation: 'Bright from the Start / DECAL — CAPS',
      retrieved: '2026-04-25',
    },
    incomeTax: {
      source: 'Georgia DOR — flat income tax (HB 1437, 2026)',
      url: 'https://dor.georgia.gov/taxes/important-tax-updates',
      citation: 'Georgia Dept. of Revenue — important tax updates',
      retrieved: '2026-04-25',
    },
  },
  PA: {
    childcare: {
      source: 'Pennsylvania DHS — Child Care Works (CCW)',
      url: 'https://www.pa.gov/agencies/dhs/resources/early-learning-child-care/child-care-works',
      citation: 'PA DHS — Child Care Works (via ELRCs)',
      retrieved: '2026-04-25',
    },
    incomeTax: {
      source: 'Pennsylvania DOR — flat income tax (3.07%)',
      url: 'https://www.revenue.pa.gov/',
      citation: 'PA Dept. of Revenue (Schedule SP Tax Forgiveness)',
      retrieved: '2026-04-25',
    },
  },
  NY: {
    // NY-specific SNAP (OTDA) — BBCE 200% FPL gross limit (GIS 25DC024).
    snap: {
      source: 'NY OTDA — SNAP (GIS 25DC024)',
      url: 'https://otda.ny.gov/programs/snap/',
      citation: 'NY OTDA — SNAP eligibility; GIS 25DC024 (2025-2026 income guidelines, 200% FPL BBCE)',
      retrieved: '2026-07-06',
    },
    // NY Medicaid MAGI levels — NY DOH GIS 26 MA/05 (2026).
    medicaid: {
      source: 'NY DOH — Medicaid MAGI income levels (GIS 26 MA/05)',
      url: 'https://www.health.ny.gov/health_care/medicaid/publications/docs/gis/26ma05_att1.pdf',
      citation: 'NY State DOH GIS 26 MA/05 — 2026 MAGI eligibility levels',
      retrieved: '2026-07-06',
    },
    // NY State of Health — Essential Plan (§1331 BHP, $0 premium, ≤200% FPL).
    // Overrides the federal IRS-8962 default with the NY-specific exchange source
    // that also documents the Essential-Plan second cliff.
    aca: {
      source: 'NY State of Health — Essential Plan',
      url: 'https://info.nystateofhealth.ny.gov/EssentialPlan',
      citation:
        'NY State of Health — Essential Plan ($0 premium; ≤200% FPL from 2026-07-01 per DOH 2026-03-23 CMS approval)',
      retrieved: '2026-07-06',
    },
    // NY childcare subsidy — OCFS CCAP (85% SMI ceiling, 26-OCFS-INF-06).
    childcare: {
      source: 'NY OCFS — Child Care Assistance Program (CCAP)',
      url: 'https://ocfs.ny.gov/programs/childcare/ccap/',
      citation: 'NY OCFS — CCAP eligibility; 26-OCFS-INF-06 (2026 income levels, 85% SMI)',
      retrieved: '2026-07-06',
    },
    // NY progressive income tax — modelled with real marginal MFJ brackets via
    // the engine's bracketed path. Primary source is the NY Dept. of Taxation &
    // Finance 2026 rate schedule (Tax Law §601).
    incomeTax: {
      source: 'NY Dept. of Taxation and Finance — income tax rates',
      url: 'https://www.tax.ny.gov/',
      citation:
        'NY DTF — 2026 MFJ progressive rate schedule (Tax Law §601: 4%/4.5%/5.25%/5.5% within the $0–$120k range; NYC city tax excluded)',
      retrieved: '2026-07-07',
    },
  },
  // ── Cycle 25 batch (states 9→16), sourced 2026-07-31 ─────────────────────
  // SNAP / Medicaid / ACA / housing fall back to the federal PROGRAM_PROVENANCE
  // defaults (USDA / medicaid.gov / IRS / HUD — the authoritative cross-state
  // sources). Only childcare (state-run program) and incomeTax (state-specific,
  // omitted for the no-income-tax states WA/TN) carry per-state overrides here,
  // transcribed from each state module's citation comments — same pattern as the
  // first-8 states above. retrieved reflects this batch's capture date.
  AZ: {
    childcare: {
      source: 'Arizona DES — Child Care Assistance',
      url: 'https://des.az.gov/services/child-and-family/child-care',
      citation: 'AZ Dept. of Economic Security — Child Care Assistance',
      retrieved: '2026-07-31',
    },
    incomeTax: {
      source: 'Arizona DOR — individual income tax',
      url: 'https://azdor.gov/individual-income-tax-information',
      citation: 'AZ DOR — 2.5% flat individual income tax (single rate from TY2023)',
      retrieved: '2026-07-31',
    },
  },
  IL: {
    childcare: {
      source: 'Illinois DHS — Child Care Assistance Program (CCAP)',
      url: '',
      citation: 'IL DHS — Child Care Assistance Program (CCAP) (dhs.state.il.us/page.aspx?item=30355)',
      retrieved: '2026-07-31',
      note: 'Illinois DHS publishes CCAP on dhs.state.il.us, a state .us host rather than a .gov domain. We link only to official .gov sources, so this citation appears without a link. The figures themselves are disclosed above.',
    },
    incomeTax: {
      source: 'Illinois DOR — individual income tax',
      url: 'https://tax.illinois.gov/',
      citation: 'IL DOR — 4.95% flat rate (35 ILCS 5/201); $2,925/person exemption (IL-700-T, TY2026)',
      retrieved: '2026-07-31',
    },
  },
  CA: {
    childcare: {
      source: 'California CDSS/CDE — CalWORKs Child Care / Alternative Payment',
      url: 'https://www.cdss.ca.gov/inforesources/child-care-and-development',
      citation: 'CA Dept. of Social Services — Child Care & Development',
      retrieved: '2026-07-31',
    },
    incomeTax: {
      source: 'California FTB — individual income tax',
      url: 'https://www.ftb.ca.gov/',
      citation: 'CA Franchise Tax Board — 2026 MFJ progressive schedule (1%–9.3% within chart range)',
      retrieved: '2026-07-31',
    },
  },
  WA: {
    childcare: {
      source: 'Washington DCYF — Working Connections Child Care (WCCC)',
      url: 'https://dcyf.wa.gov/services/earlylearning-childcare/getting-help/wccc',
      citation: 'WA Dept. of Children, Youth & Families — WCCC',
      retrieved: '2026-07-31',
    },
    // Washington has no state income tax — no incomeTax program to source.
  },
  VA: {
    childcare: {
      source: 'Virginia DOE — Child Care Subsidy Program (CCSP)',
      url: 'https://www.childcare.virginia.gov/families/paying-for-child-care',
      citation: 'VA Dept. of Education — Child Care Subsidy Program',
      retrieved: '2026-07-31',
    },
    incomeTax: {
      source: 'Virginia Dept. of Taxation — individual income tax',
      url: 'https://www.tax.virginia.gov/income-tax-calculator',
      citation: 'VA Tax — 2%–5.75% progressive schedule (Va. Code §58.1-320)',
      retrieved: '2026-07-31',
    },
  },
  TN: {
    childcare: {
      source: 'Tennessee DHS — Child Care Certificate Program',
      url: 'https://www.tn.gov/humanservices/for-families/child-care-services/child-care-payment-assistance/child-care-certificate-program.html',
      citation: 'TN Dept. of Human Services — Child Care Certificate Program',
      retrieved: '2026-07-31',
    },
    // Tennessee has no state income tax (Hall tax repealed TY2021) — no incomeTax program to source.
  },
  MO: {
    childcare: {
      source: 'Missouri DESE — Child Care Subsidy Program',
      url: 'https://dese.mo.gov/childhood/child-care-subsidy/families',
      citation: 'MO Dept. of Elementary & Secondary Education — Child Care Subsidy',
      retrieved: '2026-07-31',
    },
    incomeTax: {
      source: 'Missouri DOR — individual income tax',
      url: 'https://dor.mo.gov/',
      citation: 'MO DOR — 2026 graduated schedule, top marginal rate 4.7%',
      retrieved: '2026-07-31',
    },
  },
  IN: {
    childcare: {
      source: 'Indiana FSSA — CCDF Voucher',
      url: 'https://www.in.gov/fssa/carefinder/child-care-vouchers/',
      citation: 'IN Family & Social Services Admin. — CCDF child care vouchers',
      retrieved: '2026-07-31',
    },
    incomeTax: {
      source: 'Indiana DOR — individual income tax',
      url: 'https://www.in.gov/dor/resources/tax-rates-and-reports/rates-fees-and-penalties/',
      citation: 'IN DOR — 2.95% flat rate TY2026 (SB451 phase-down); county LIT excluded',
      retrieved: '2026-07-31',
    },
  },
};

/** Human labels for the programs a state can expose, in stable display order. */
const PROGRAM_LABELS = {
  snap: 'SNAP (USDA FNS FY2026)',
  medicaid: 'Medicaid',
  aca: 'ACA marketplace (SLCSP benchmark)',
  childcare: 'Childcare subsidy',
  housing: 'Section 8 / HCV (HUD FY2026)',
  incomeTax: 'State income tax',
} as const;

/**
 * Resolve the effective Provenance for a program in a given state: a
 * state-specific override (STATE_PROGRAM_PROVENANCE) takes precedence, falling
 * back to the federal/cross-state default (PROGRAM_PROVENANCE). Returns
 * undefined when neither map has an entry (program modelled but not yet sourced).
 */
function resolveProvenance(code: StateCode, program: string): Provenance | undefined {
  return STATE_PROGRAM_PROVENANCE[code]?.[program] ?? PROGRAM_PROVENANCE[program];
}

/**
 * Build a Source from a program key + resolved Provenance. The Source carries the
 * program's display label plus url/citation/retrieved lifted off the Provenance.
 * A source-less-with-note program (Provenance present but `url === ''`) yields a
 * Source with `url` omitted but citation/retrieved still surfaced — the number is
 * disclosed, its primary source is just not a gov link.
 */
function toSource(program: string, label: string, prov: Provenance | undefined): Source {
  const url = prov?.url && prov.url.length > 0 ? prov.url : undefined;
  return {
    program,
    label,
    url,
    citation: prov?.citation,
    retrieved: prov?.retrieved,
  };
}

/**
 * Walk a state's rule object and emit one enriched Source per program present.
 * Each Source carries url + citation + retrieved from the resolved Provenance
 * (state override → federal default). Programs whose only source is non-gov
 * (e.g. OH income tax) surface with citation/retrieved but no url. Medicaid's
 * label is specialised with expansion status; childcare's with the subsidy name.
 * Returns [] for unsupported states.
 */
export function collectSources(code: StateCode): Source[] {
  if (!isSupportedState(code)) return [];
  const state = getState(code);
  const sources: Source[] = [];

  if (state.snap) {
    sources.push(toSource('snap', PROGRAM_LABELS.snap, resolveProvenance(code, 'snap')));
  }
  if (state.medicaid) {
    const label = `${PROGRAM_LABELS.medicaid} (${state.medicaid.expanded ? 'expansion' : 'non-expansion'})`;
    sources.push(toSource('medicaid', label, resolveProvenance(code, 'medicaid')));
  }
  if (state.aca) {
    sources.push(toSource('aca', PROGRAM_LABELS.aca, resolveProvenance(code, 'aca')));
  }
  if (state.childcare) {
    const label = `${PROGRAM_LABELS.childcare} (${state.childcare.subsidyName})`;
    sources.push(toSource('childcare', label, resolveProvenance(code, 'childcare')));
  }
  if (state.housing) {
    sources.push(toSource('housing', PROGRAM_LABELS.housing, resolveProvenance(code, 'housing')));
  }
  if (state.incomeTax) {
    sources.push(toSource('incomeTax', PROGRAM_LABELS.incomeTax, resolveProvenance(code, 'incomeTax')));
  }

  return sources;
}

/** Public alias used by the methodology page / source chips. */
export function getStateSources(code: StateCode): Source[] {
  return collectSources(code);
}
