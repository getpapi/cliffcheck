/**
 * housing.test.ts — Section 8 / Housing Choice Voucher subsidy.
 *
 * 1:1 conversion of the inline validateDemoScenario console.assert specs
 * (Case 3, voucher holder) from the v1 single-file build. No new cases.
 *
 * IIFE input: calcEffectiveTakeHome(30000, 3, { adultCount: 2, hasVoucher: true })
 * mapped to the options-object API.
 */
import { describe, it, expect } from 'vitest';
import { getEffectiveTakeHome } from '@/lib/engine';

describe('Section 8 voucher (family of 3)', () => {
  const vCurrent = () => getEffectiveTakeHome({ annualIncome: 30000, familySize: 3, state: 'OH', adultCount: 2, hasVoucher: true });
  const vHigher = () => getEffectiveTakeHome({ annualIncome: 50000, familySize: 3, state: 'OH', adultCount: 2, hasVoucher: true });

  it('voucher holder at $30K should have positive subsidy', () => {
    expect(vCurrent().section8Value).toBeGreaterThan(0);
  });

  it('voucher subsidy should decline as income rises ($30K → $50K)', () => {
    expect(vHigher().section8Value).toBeLessThan(vCurrent().section8Value);
  });
});
