/**
 * ctc.test.ts — Federal Child Tax Credit (IRC §24, FY2026 current law).
 *
 * Covers the refundable phase-in (15% of earned income above $2,500), the
 * $1,700/child ACTC refundable cap (binding once liability is $0 and the
 * phase-in clears the cap — task-181), the delivered full credit in the target
 * band, the childless zero case, and the high-income phase-out for single
 * filers. Since task-181 the delivered value = non-refundable offset against
 * gross federal income tax + the capped refundable ACTC remainder.
 */
import { describe, it, expect } from 'vitest';
import { calcFederalCTC } from '@/lib/engine';

describe('Federal CTC (IRC §24, FY2026)', () => {
  it('phase-in: 2-child MFJ at $10K → 15% × ($10K − $2.5K) = $1,125', () => {
    expect(calcFederalCTC(10000, 4, { adultCount: 2 })).toBe(1125);
  });

  it('full credit: 2-child MFJ at target-band $44K → $4,000 (2 × $2,000)', () => {
    expect(calcFederalCTC(44000, 4, { adultCount: 2 })).toBe(4000);
  });

  it('ACTC refundable cap binds at $0 liability: 2-child MFJ at $29.2K → $3,400 (2 × $1,700)', () => {
    // Below the MFJ standard deduction there is no federal tax liability to
    // offset, so only the REFUNDABLE portion is real — capped at $1,700/child
    // even though the 15% phase-in formula alone would reach $4,005 here.
    // (Pre-task-181 the cap was unmodelled and this returned the full $4,000.)
    expect(calcFederalCTC(29200, 4, { adultCount: 2 })).toBe(3400);
    expect(calcFederalCTC(20000, 4, { adultCount: 2 })).toBeLessThan(3400);
  });

  it('full $4,000 delivered requires tax liability: MFJ plateau at $3,400 until the standard deduction clears', () => {
    // At $31.5k (MFJ standard deduction) liability is still ~$0 → capped $3,400.
    expect(calcFederalCTC(31500, 4, { adultCount: 2 })).toBe(3400);
    // At $44k gross tax is $1,250: offset $1,250 + refundable $2,750 = $4,000.
    expect(calcFederalCTC(44000, 4, { adultCount: 2 })).toBe(4000);
  });

  it('childless household → $0', () => {
    expect(calcFederalCTC(44000, 2, { adultCount: 2 })).toBe(0);
  });

  it('zero / negative income → $0', () => {
    expect(calcFederalCTC(0, 4, { adultCount: 2 })).toBe(0);
  });

  it('high-income phase-out: single filer above $200K loses 5% per dollar', () => {
    // MFJ threshold is $400K, so a single (adultCount 1) filer phases out first.
    expect(calcFederalCTC(200000, 3, { adultCount: 1 })).toBe(4000);
    expect(calcFederalCTC(205000, 3, { adultCount: 1 })).toBe(3750); // 4000 − 5% × 5000
    // MFJ at $205K is still below its $400K threshold → full credit.
    expect(calcFederalCTC(205000, 4, { adultCount: 2 })).toBe(4000);
  });
});
