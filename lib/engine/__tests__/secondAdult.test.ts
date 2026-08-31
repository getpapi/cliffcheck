/**
 * secondAdult.test.ts — adultCount (second-adult) effect on the orchestrator.
 *
 * 1:1 conversion of the inline validateDemoScenario console.assert specs
 * (Case 2, single-parent vs default two-adult) from the v1 single-file build.
 * The IIFE's only adultCount-varying scenario is the single-parent (adultCount:1)
 * contrasted with the default two-adult (adultCount:2) household. No new cases:
 * Medicaid proxy scales per adult; childcare covers the extra child when one
 * adult is replaced by a child at the same family size.
 */
import { describe, it, expect } from 'vitest';
import { getEffectiveTakeHome, FED } from '@/lib/engine';

describe('Second-adult vs single-parent (family of 4, OH, $44k)', () => {
  const twoAdult = () => getEffectiveTakeHome({ annualIncome: 44000, familySize: 4, state: 'OH', adultCount: 2 });
  const oneAdult = () => getEffectiveTakeHome({ annualIncome: 44000, familySize: 4, state: 'OH', adultCount: 1 });

  it('two-adult Medicaid value is 2× adult proxy', () => {
    expect(twoAdult().medicaidValue).toBe(2 * FED.medicaid.adultAnnualValueProxy);
  });

  it('single-parent Medicaid value is 1-adult proxy', () => {
    expect(oneAdult().medicaidValue).toBe(FED.medicaid.adultAnnualValueProxy);
  });

  it('single-parent childcare covers 3 children (> $20,000)', () => {
    expect(oneAdult().childcareValue).toBeGreaterThan(20000);
  });
});
