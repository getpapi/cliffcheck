/**
 * tax.test.ts — state income tax. Covers the flat path (OH HB 96 2025, NC, MI)
 * and the bracketed progressive path (NY MFJ, task-147). The OH cases are the
 * original 1:1 conversion of the inline validateDemoScenario console.assert specs
 * (Case 10) and MUST stay byte-identical — they guard the flat path against the
 * progressive-bracket change.
 */
import { describe, it, expect } from 'vitest';
import { calcStateIncomeTax } from '@/lib/engine';

describe('OH state tax (HB 96 flat 2.75%) — flat path unchanged by brackets', () => {
  it('OH state tax at $44k should be $494 ((44000-26050)*0.0275)', () => {
    const ohTaxAt44k = calcStateIncomeTax(44000, { stateCode: 'OH' });
    expect(ohTaxAt44k).toBe(494);
  });

  it('OH state tax at $70k should be $1,209 ((70000-26050)*0.0275)', () => {
    const ohTaxAt70k = calcStateIncomeTax(70000, { stateCode: 'OH' });
    expect(ohTaxAt70k).toBe(1209);
  });

  it('OH state tax below $26,050 should be 0', () => {
    const ohTaxBelowFloor = calcStateIncomeTax(20000, { stateCode: 'OH' });
    expect(ohTaxBelowFloor).toBe(0);
  });
});

describe('flat-tax states now modelled (NC 3.99%, MI 4.25%)', () => {
  it('TX has no state income tax → should be 0', () => {
    const txTaxAt70k = calcStateIncomeTax(70000, { stateCode: 'TX' });
    expect(txTaxAt70k).toBe(0);
  });

  it('NC flat 3.99% above $25,500 → $70k should be $1,776 ((70000-25500)*0.0399)', () => {
    const ncTaxAt70k = calcStateIncomeTax(70000, { stateCode: 'NC' });
    expect(ncTaxAt70k).toBe(1776);
  });

  it('NC below the $25,500 floor → 0', () => {
    expect(calcStateIncomeTax(20000, { stateCode: 'NC' })).toBe(0);
  });

  it('MI flat 4.25% above $23,200 → $70k should be $1,989 ((70000-23200)*0.0425)', () => {
    const miTaxAt70k = calcStateIncomeTax(70000, { stateCode: 'MI' });
    expect(miTaxAt70k).toBe(1989);
  });

  it('MI below the $23,200 floor → 0', () => {
    expect(calcStateIncomeTax(20000, { stateCode: 'MI' })).toBe(0);
  });
});

describe('NY progressive brackets (MFJ, post-floor base above $25,000)', () => {
  // Marginal schedule on (income − 25,000): 4% ≤8,200, 4.5% ≤14,650,
  // 5.25% ≤18,950, 5.5% above.
  it('below the $25,000 floor → 0', () => {
    expect(calcStateIncomeTax(20000, { stateCode: 'NY' })).toBe(0);
  });

  it('$44k: taxable 19,000 → $847 (328 + 290.25 + 225.75 + 2.75)', () => {
    expect(calcStateIncomeTax(44000, { stateCode: 'NY' })).toBe(847);
  });

  it('$67k (EP double-cliff income): taxable 42,000 → $2,112', () => {
    // 8200*.04 + 6450*.045 + 4300*.0525 + 23050*.055 = 2111.75 → 2112
    expect(calcStateIncomeTax(67000, { stateCode: 'NY' })).toBe(2112);
  });

  it('is lower than the old flat-5.5% approximation at $67k (was $2,310)', () => {
    // Progressive path refines the low brackets → strictly less tax than flat 5.5%.
    expect(calcStateIncomeTax(67000, { stateCode: 'NY' })).toBeLessThan(2310);
  });
});
