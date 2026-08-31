/**
 * fedTax.test.ts — FICA + federal income tax (task-181, Option C).
 *
 * Covers the FICA OASDI wage-base cap (the $176,100–$200k chart band must only
 * pay the Medicare portion on marginal dollars), filing-status derivation from
 * household shape, bracket math against hand-computed TY2025 values, and the
 * credit-offset no-double-count invariant the task-165 findings flagged as the
 * single most important correctness subtlety.
 */
import { describe, it, expect } from 'vitest';
import {
  calcFICA,
  calcFederalIncomeTax,
  calcFederalCTC,
  deriveFilingStatus,
  getEffectiveTakeHome,
  FED,
} from '@/lib/engine';

describe('FICA (employee side)', () => {
  it('7.65% flat below the wage base: $44k → $3,366', () => {
    expect(calcFICA(44000)).toBe(3366); // 6.2% + 1.45% of 44000
  });

  it('$70k → $5,355', () => {
    expect(calcFICA(70000)).toBe(5355);
  });

  it('OASDI caps at the wage base; Medicare continues uncapped', () => {
    const atBase = calcFICA(FED.fica.oasdiWageBase);
    const above = calcFICA(200000);
    // Marginal dollars above the base pay ONLY the 1.45% Medicare portion.
    const marginal = above - atBase;
    const expected = Math.round(0.0145 * (200000 - FED.fica.oasdiWageBase));
    expect(Math.abs(marginal - expected)).toBeLessThanOrEqual(1); // rounding
  });

  it('zero / negative income → $0', () => {
    expect(calcFICA(0)).toBe(0);
    expect(calcFICA(-5000)).toBe(0);
  });
});

describe('Filing status derivation (no UI control — household shape decides)', () => {
  it('2 adults → MFJ', () => {
    expect(deriveFilingStatus(4, 2)).toBe('mfj');
    expect(deriveFilingStatus(2, 2)).toBe('mfj');
  });

  it('1 adult with children → head of household', () => {
    expect(deriveFilingStatus(3, 1)).toBe('hoh');
  });

  it('1 adult, no children → single', () => {
    expect(deriveFilingStatus(1, 1)).toBe('single');
  });
});

describe('Federal income tax (TY2025 brackets, gross of credits)', () => {
  it('below the standard deduction → $0 (MFJ at $30k)', () => {
    expect(calcFederalIncomeTax(30000, 4, { adultCount: 2 })).toBe(0);
  });

  it('MFJ at $44k → $1,250 (10% of $12,500 taxable)', () => {
    expect(calcFederalIncomeTax(44000, 4, { adultCount: 2 })).toBe(1250);
  });

  it('MFJ at $70k → $4,143 ($2,385 + 12% of the excess over $23,850)', () => {
    expect(calcFederalIncomeTax(70000, 4, { adultCount: 2 })).toBe(4143);
  });

  it('single filer pays more than MFJ at the same wage (smaller deduction + tighter brackets)', () => {
    const single = calcFederalIncomeTax(44000, 1, { adultCount: 1 });
    const mfj = calcFederalIncomeTax(44000, 4, { adultCount: 2 });
    expect(single).toBeGreaterThan(mfj);
  });

  it('head of household sits between single and MFJ at $44k', () => {
    const single = calcFederalIncomeTax(44000, 1, { adultCount: 1 });
    const hoh = calcFederalIncomeTax(44000, 3, { adultCount: 1 });
    const mfj = calcFederalIncomeTax(44000, 4, { adultCount: 2 });
    expect(hoh).toBeLessThan(single);
    expect(hoh).toBeGreaterThan(mfj);
  });
});

describe('Credit-offset invariant: no double-count (the task-165 trap)', () => {
  // A family must never both "receive the full CTC as cash" AND "pay the tax
  // the CTC erased". Net federal position = delivered credits − gross tax; the
  // orchestrator adds ctcValue/eitcValue and subtracts federalTaxOwed, so the
  // delivered CTC minus gross tax must equal offset+refundable−tax exactly.
  it('MFJ at $44k: net federal position is +$2,750 (offset $1,250, refund $2,750)', () => {
    const grossTax = calcFederalIncomeTax(44000, 4, { adultCount: 2 });
    const ctc = calcFederalCTC(44000, 4, { adultCount: 2 });
    expect(grossTax).toBe(1250);
    expect(ctc).toBe(4000); // 1250 offset + 2750 refundable (≤ $3,400 cap)
    expect(ctc - grossTax).toBe(2750);
  });

  it('MFJ at $70k: credit fully consumed by offset — net tax $143', () => {
    const grossTax = calcFederalIncomeTax(70000, 4, { adultCount: 2 });
    const ctc = calcFederalCTC(70000, 4, { adultCount: 2 });
    expect(grossTax).toBe(4143);
    expect(ctc).toBe(4000); // all offset, no refundable remainder
    expect(ctc - grossTax).toBe(-143);
  });

  it('orchestrator wires both into totalEffective (band point $60k, OH)', () => {
    const b = getEffectiveTakeHome({ annualIncome: 60000, familySize: 4, state: 'OH', adultCount: 2 });
    expect(b.ficaOwed).toBe(calcFICA(60000));
    expect(b.federalTaxOwed).toBe(calcFederalIncomeTax(60000, 4, { adultCount: 2 }));
    expect(b.ctcValue).toBe(calcFederalCTC(60000, 4, { adultCount: 2 }));
    // Re-derive the sum from the breakdown fields — the identity must hold.
    const rebuilt =
      b.grossWages +
      b.snapValue +
      b.medicaidValue +
      b.section8Value +
      b.childcareValue +
      b.eitcValue +
      b.ctcValue +
      b.acaCSRValue +
      b.matchValue -
      b.acaCost -
      b.stateTaxOwed -
      b.ficaOwed -
      b.federalTaxOwed;
    expect(b.totalEffective).toBe(Math.round(rebuilt));
  });
});
