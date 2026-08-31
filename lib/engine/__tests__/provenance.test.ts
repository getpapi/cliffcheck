/**
 * provenance.test.ts — build-time gov-source provenance guard.
 *
 * The integrity story of CliffCheck is that every number traces to a government
 * source. This suite walks the machine-readable provenance structure
 * (PROGRAM_PROVENANCE + STATE_PROGRAM_PROVENANCE) AND the per-state collectSources
 * output, asserting every source URL the engine exposes is a gov host (see
 * PLAN.md §"Machine-readable provenance"). No exceptions: if a non-gov URL ever
 * reaches provenance, the build fails here.
 *
 * A program may be deliberately source-less (Provenance present with `url === ''`
 * plus a `note` — e.g. OH income tax, whose only citations are third-party policy
 * analyses). Those carry NO url, so they never expose a non-gov link; the guard
 * verifies that invariant too (a `note`-bearing empty-url entry is allowed; a
 * non-empty non-gov url is not).
 */
import { describe, it, expect } from 'vitest';
import {
  isGovSource,
  collectSources,
  getSupportedStates,
  PROGRAM_PROVENANCE,
  STATE_PROGRAM_PROVENANCE,
} from '@/lib/engine';
import type { Provenance } from '@/lib/engine';

/** Every Provenance record across both maps, tagged with where it came from. */
function allProvenanceEntries(): Array<{ where: string; prov: Provenance }> {
  const entries: Array<{ where: string; prov: Provenance }> = [];
  for (const [program, prov] of Object.entries(PROGRAM_PROVENANCE)) {
    entries.push({ where: `PROGRAM_PROVENANCE.${program}`, prov });
  }
  for (const [code, byProgram] of Object.entries(STATE_PROGRAM_PROVENANCE)) {
    for (const [program, prov] of Object.entries(byProgram)) {
      if (prov) entries.push({ where: `STATE_PROGRAM_PROVENANCE.${code}.${program}`, prov });
    }
  }
  return entries;
}

/** Every distinct source URL the engine exposes across all supported states. */
function collectAllSourceUrls(): string[] {
  const urls = new Set<string>();
  for (const { code } of getSupportedStates()) {
    for (const src of collectSources(code)) {
      if (src.url) urls.add(src.url);
    }
  }
  return [...urls];
}

describe('gov-source provenance guard', () => {
  it('every PROGRAM_PROVENANCE / STATE_PROGRAM_PROVENANCE url is gov or empty-with-note', () => {
    const entries = allProvenanceEntries();
    expect(entries.length).toBeGreaterThan(0); // sanity: the structure is populated
    for (const { where, prov } of entries) {
      expect(prov.source, `missing source: ${where}`).toBeTruthy();
      expect(prov.citation, `missing citation: ${where}`).toBeTruthy();
      expect(prov.retrieved, `missing retrieved: ${where}`).toBeTruthy();
      if (prov.url && prov.url.length > 0) {
        // A URL is exposed — it MUST be a gov host.
        expect(isGovSource(prov.url), `non-gov source: ${where} → ${prov.url}`).toBe(true);
      } else {
        // Source-less-with-note: no gov URL, so a note MUST explain why.
        expect(prov.note, `empty url without explanatory note: ${where}`).toBeTruthy();
      }
    }
  });

  it('every exposed source URL (per-state collectSources) is a gov host', () => {
    const urls = collectAllSourceUrls();
    expect(urls.length).toBeGreaterThan(0); // sanity: we actually collected URLs
    for (const url of urls) {
      expect(isGovSource(url), `non-gov source: ${url}`).toBe(true);
    }
  });

  it('collectSources enriches gov-sourced programs with url + citation + retrieved', () => {
    // Pick a state with a full gov-sourced spread and assert the enrichment
    // round-trips (guards against collectSources silently dropping metadata).
    const sources = collectSources('OH');
    const snap = sources.find((s) => s.program === 'snap');
    expect(snap?.url).toBe(PROGRAM_PROVENANCE.snap.url);
    expect(snap?.citation).toBe(PROGRAM_PROVENANCE.snap.citation);
    expect(snap?.retrieved).toBe(PROGRAM_PROVENANCE.snap.retrieved);

    // OH income tax is source-less-with-note: exposed as a Source (the number is
    // disclosed) but with no url, citation still surfaced.
    const incomeTax = sources.find((s) => s.program === 'incomeTax');
    expect(incomeTax).toBeDefined();
    expect(incomeTax?.url).toBeUndefined();
    expect(incomeTax?.citation).toBeTruthy();
  });
});

describe('isGovSource', () => {
  it.each([
    'https://www.irs.gov/credits-deductions/individuals/earned-income-tax-credit/eitc-tables',
    'https://www.fns.usda.gov/snap/recipient/eligibility',
    'https://aspe.hhs.gov/topics/poverty-economic-mobility/poverty-guidelines',
    'https://www.huduser.gov/portal/datasets/fmr.html',
    'https://www.medicaid.gov/state-overviews/stateprofile.html',
    'https://medicaid.ncdhhs.gov/', // a state .gov
    'https://www.michigan.gov/mdhhs/assistance-programs/medicaid',
  ])('accepts gov host: %s', (url) => {
    expect(isGovSource(url)).toBe(true);
  });

  it.each([
    'https://thefinancebuff.com/aca-premium-tax-credit-percentages.html',
    'https://example.com',
    'https://www.govtech.com/notgov', // .com that merely contains "gov"
    'not a url',
    '',
  ])('rejects non-gov / invalid: %s', (url) => {
    expect(isGovSource(url)).toBe(false);
  });
});
