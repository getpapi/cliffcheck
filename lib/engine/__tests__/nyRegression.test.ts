/**
 * nyRegression.test.ts — the load-bearing guard for the NY / Essential-Plan
 * engine change (task-94).
 *
 * Adding NY required an optional `essentialPlan` field on StateAcaRules and a
 * new branch in calcACAPremium. The contract is that this field is undefined for
 * every pre-NY state (OH/TX/NC/MI/FL/GA/PA), so their cliff math must be
 * BYTE-IDENTICAL to before the change. This suite rehashes each state's full
 * 201-point cliff curve and compares against the frozen SHA-256 baseline in
 * fixtures/engineCurveBaseline.json — captured from the engine and verified
 * byte-for-byte equal to the pre-change output when the field was introduced.
 *
 * A failure means either the Essential-Plan branch leaked into a state that does
 * not set essentialPlan (the regression the pre-mortem flagged), OR one of these
 * states' rules was changed intentionally — in which case regenerate the baseline
 * on purpose: `npx tsx scripts/gen-regression-baseline.ts`.
 */
import { createHash } from 'node:crypto';
import { describe, it, expect } from 'vitest';
import { getCliffData } from '@/lib/engine';
import baseline from './fixtures/engineCurveBaseline.json';

const BASELINE = baseline as Record<string, Record<string, string>>;

function curveHash(state: string, familySize: number, adultCount: number): string {
  const curve = getCliffData({ state, familySize, adultCount });
  return createHash('sha256').update(JSON.stringify(curve)).digest('hex');
}

describe('NY change: pre-NY states are byte-identical (regression guard)', () => {
  for (const [state, scenarios] of Object.entries(BASELINE)) {
    describe(`${state}`, () => {
      for (const [key, expectedHash] of Object.entries(scenarios)) {
        it(`${key} cliff curve unchanged`, () => {
          // key format: fs<familySize>_ad<adultCount>
          const [, fs, ad] = key.match(/^fs(\d+)_ad(\d+)$/)!;
          expect(curveHash(state, Number(fs), Number(ad))).toBe(expectedHash);
        });
      }
    });
  }

  it('baseline covers exactly the 7 pre-NY states (NY must be excluded)', () => {
    expect(Object.keys(BASELINE).sort()).toEqual(['FL', 'GA', 'MI', 'NC', 'OH', 'PA', 'TX']);
  });
});
