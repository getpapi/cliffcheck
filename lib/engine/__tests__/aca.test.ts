/**
 * aca.test.ts — ACA Cost-Sharing Reduction three-tier piecewise
 * (HHS NBPP 2026, 45 CFR 156.420) + orchestrator gating.
 *
 * 1:1 conversion of the inline validateDemoScenario console.assert specs
 * (Case 8b) from the v1 single-file build. No new cases.
 */
import { describe, it, expect } from 'vitest';
import { calcACACSR, getEffectiveTakeHome } from '@/lib/engine';

describe('ACA CSR tiers (HHS NBPP 2026)', () => {
  it('CSR 94% AV: family of 4 at 134% FPL should be $1,400 × 4 = $5,600', () => {
    const csr94 = calcACACSR(44000, 4);
    expect(csr94).toBe(5600);
  });

  it('CSR 87% AV: family of 4 at 182% FPL should be $900 × 4 = $3,600', () => {
    const csr87 = calcACACSR(60000, 4);
    expect(csr87).toBe(3600);
  });

  it('CSR 73% AV: family of 4 at 228% FPL should be $200 × 4 = $800', () => {
    const csr73 = calcACACSR(75000, 4);
    expect(csr73).toBe(800);
  });

  it('above 250% FPL: family of 4 at 304% FPL should be 0', () => {
    const csrNone = calcACACSR(100000, 4);
    expect(csrNone).toBe(0);
  });

  it('below 100% FPL: family of 4 should be 0 (Medicaid territory)', () => {
    const csrSubFPL = calcACACSR(10000, 4);
    expect(csrSubFPL).toBe(0);
  });
});

describe('ACA CSR orchestrator gating', () => {
  it('OH at $44k on Medicaid → orchestrator should suppress CSR', () => {
    const csrOH = getEffectiveTakeHome({ annualIncome: 44000, familySize: 4, state: 'OH', adultCount: 2 });
    expect(csrOH.acaCSRValue).toBe(0);
  });

  it('TX at $44k on marketplace → orchestrator should pass CSR through', () => {
    const csrTX = getEffectiveTakeHome({ annualIncome: 44000, familySize: 4, state: 'TX', adultCount: 2 });
    expect(csrTX.acaCSRValue).toBe(5600);
  });

  it('TX with employer insurance → orchestrator should suppress CSR', () => {
    const csrEmployer = getEffectiveTakeHome({
      annualIncome: 44000,
      familySize: 4,
      state: 'TX',
      adultCount: 2,
      employerHealthInsurance: true,
    });
    expect(csrEmployer.acaCSRValue).toBe(0);
  });
});
