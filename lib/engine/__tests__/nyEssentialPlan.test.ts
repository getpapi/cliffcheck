/**
 * nyEssentialPlan.test.ts — New York support + the Essential-Plan second cliff.
 *
 * NY is the first state with a Basic Health Program (ACA §1331). Its Essential
 * Plan is $0-premium up to 200% FPL (contracted from 250% on 2026-07-01), then
 * the household ages into marketplace PTC premiums — a SECOND benefits cliff
 * distinct from the standard Medicaid/childcare cliff. This suite proves NY is
 * wired in and that the second cliff actually appears in the engine curve at the
 * EP ceiling. The byte-identical guard for the other 7 states lives in
 * nyRegression.test.ts.
 */
import { describe, it, expect } from 'vitest';
import { getEffectiveTakeHome, getCliffData, getSupportedStates } from '@/lib/engine';
import { NY } from '@/lib/engine/states/ny';

const FPL_FS4 = 33000; // 100% FPL, family of 4 (FED base + 3 × increment)

describe('New York registration', () => {
  it('NY appears in getSupportedStates()', () => {
    expect(getSupportedStates().some((s) => s.code === 'NY')).toBe(true);
  });

  it('NY declares an Essential Plan with a $0 premium and a 200% FPL ceiling', () => {
    expect(NY.aca.essentialPlan).toBeDefined();
    expect(NY.aca.essentialPlan!.monthlyPremium).toBe(0);
    expect(NY.aca.essentialPlan!.maxFPL).toBe(2.0);
  });

  it('getCliffData produces 201 points for NY (no render error)', () => {
    const pts = getCliffData({ familySize: 4, state: 'NY', adultCount: 2 });
    expect(pts).toHaveLength(201);
    expect(pts.every((p) => Number.isFinite(p.totalEffective))).toBe(true);
  });
});

describe('Essential-Plan second cliff (NY family of 4)', () => {
  const maxFPL = NY.aca.essentialPlan!.maxFPL; // 2.0
  // Incomes bracketing the EP ceiling (200% FPL = $66,000 for a family of 4).
  const belowCeiling = Math.round(FPL_FS4 * maxFPL); // 66000 — last EP-eligible $1k point
  const aboveCeiling = belowCeiling + 1000; // 67000 — first marketplace point

  const below = getEffectiveTakeHome({ annualIncome: belowCeiling, familySize: 4, state: 'NY', adultCount: 2 });
  const above = getEffectiveTakeHome({ annualIncome: aboveCeiling, familySize: 4, state: 'NY', adultCount: 2 });

  it('pays $0 ACA premium while on the Essential Plan (≤200% FPL)', () => {
    expect(below.acaCost).toBe(0);
  });

  it('pays a marketplace premium the moment income clears 200% FPL', () => {
    expect(above.acaCost).toBeGreaterThan(0);
  });

  it('effective take-home DROPS across the ceiling despite higher wages (a real cliff)', () => {
    // Wages rose $1k but effective falls — the defining shape of a cliff.
    expect(above.totalEffective).toBeLessThan(below.totalEffective);
    expect(below.totalEffective - above.totalEffective).toBeGreaterThan(2000);
  });

  it('the EP ceiling is a DISTINCT cliff from the Medicaid loss at 138% FPL', () => {
    // A separate, earlier step-down exists near 138% FPL (Medicaid → EP), so the
    // curve has two distinct cliffs, not one.
    const medicaidEdge = Math.round(FPL_FS4 * 1.38); // ~45540
    const justUnder = getEffectiveTakeHome({ annualIncome: 45000, familySize: 4, state: 'NY', adultCount: 2 });
    const justOver = getEffectiveTakeHome({ annualIncome: 46000, familySize: 4, state: 'NY', adultCount: 2 });
    expect(justUnder.medicaidValue).toBeGreaterThan(0);
    expect(justOver.medicaidValue).toBe(0);
    // And that edge is well below the EP ceiling — two separate cliffs.
    expect(medicaidEdge).toBeLessThan(belowCeiling);
  });
});
