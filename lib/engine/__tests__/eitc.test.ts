/**
 * eitc.test.ts — Federal EITC three-region piecewise (TY2025 IRS Rev. Proc. 2024-40).
 *
 * 1:1 conversion of the inline validateDemoScenario console.assert specs (Case 9)
 * from the v1 single-file build. Exact-value asserts → toBe; range asserts →
 * toBeGreaterThan/toBeLessThan. No new cases beyond the inline suite.
 */
import { describe, it, expect } from 'vitest';
import { calcFederalEITC } from '@/lib/engine';

describe('Federal EITC (TY2025)', () => {
  it('phase-in: 2-child MFJ at $10K should be $10K × 40% = $4,000', () => {
    const eitcPhaseIn = calcFederalEITC(10000, 4, { adultCount: 2 });
    expect(eitcPhaseIn).toBe(4000);
  });

  it('plateau: 2-child MFJ at $25K should be max credit $7,152', () => {
    const eitcPlateau = calcFederalEITC(25000, 4, { adultCount: 2 });
    expect(eitcPlateau).toBe(7152);
  });

  it('phase-out: 2-child MFJ at $65K should be 0', () => {
    const eitcZero = calcFederalEITC(65000, 4, { adultCount: 2 });
    expect(eitcZero).toBe(0);
  });

  it('childless MFJ at $20K should be small and positive', () => {
    const eitcChildless = calcFederalEITC(20000, 2, { adultCount: 2 });
    expect(eitcChildless).toBeGreaterThan(0);
    expect(eitcChildless).toBeLessThan(700);
  });
});
