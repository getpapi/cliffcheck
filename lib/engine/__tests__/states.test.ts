/**
 * states.test.ts — per-state invariants, iterated over getSupportedStates().
 *
 * Converts the inline validateDemoScenario per-state console.assert specs
 * (Cases 4/6/7 for totalEffective bounds, Cases 4/6/7 + childless for Medicaid
 * expansion behaviour) into a single data-driven sweep, plus the getCliffData
 * 201-point invariant (chart range $0–$200k in $1k increments).
 *
 * Property: every supported state must have an EXPECTATIONS entry. Adding a
 * state to the registry without adding its expected bounds here fails the
 * sweep — so "add a state = add a file + a passing test".
 *
 * Medicaid expansion expectations mirror the IIFE: at $44k/family-of-4/2-adults
 * (~133% FPL) expansion states cover both adults (2 × $2,250 proxy = $4,500);
 * non-expansion states (parents above the low parentFPL ceiling) → Medicaid 0.
 */
import { describe, it, expect } from 'vitest';
import { getEffectiveTakeHome, getCliffData, getSupportedStates, FED } from '@/lib/engine';

const PROXY = FED.medicaid.adultAnnualValueProxy; // 2250

interface StateExpectation {
  expansion: boolean;
  // totalEffective bounds at $44k / family of 4 / 2 adults (exclusive, per IIFE).
  minTotal: number;
  maxTotal: number;
}

// Bounds are the engine-true totalEffective at $44k / family-of-4 / 2-adults
// (so childCount = 2) ±$3k, recomputed after task-181 folded FICA + federal
// income tax into totalEffective (a uniform federal-layer -$4,616 at this
// point: FICA $3,366 + gross federal tax $1,250; delivered CTC unchanged).
// Expansion states cover both adults (Medicaid 2×$2,250);
// TN non-expansion (Medicaid 0 — ACA cliff dominates). GA/MO/IN drop SNAP
// (narrow/absent BBCE, 130% gross limit binds at $44k); TN drops SNAP + Medicaid.
const EXPECTATIONS: Record<string, StateExpectation> = {
  OH: { expansion: true, minTotal: 71000, maxTotal: 77000 },
  TX: { expansion: false, minTotal: 68000, maxTotal: 74000 },
  NC: { expansion: true, minTotal: 63000, maxTotal: 69000 },
  MI: { expansion: true, minTotal: 67000, maxTotal: 73000 },
  FL: { expansion: false, minTotal: 68000, maxTotal: 74000 },
  GA: { expansion: false, minTotal: 63000, maxTotal: 69000 },
  PA: { expansion: true, minTotal: 70000, maxTotal: 76000 },
  NY: { expansion: true, minTotal: 74000, maxTotal: 80000 },
  // Cycle 25 batch 9→16.
  AZ: { expansion: true, minTotal: 69000, maxTotal: 75000 },
  IL: { expansion: true, minTotal: 71000, maxTotal: 77000 },
  CA: { expansion: true, minTotal: 77000, maxTotal: 83000 },
  WA: { expansion: true, minTotal: 79000, maxTotal: 85000 },
  VA: { expansion: true, minTotal: 69000, maxTotal: 75000 },
  TN: { expansion: false, minTotal: 65000, maxTotal: 71000 },
  MO: { expansion: true, minTotal: 63000, maxTotal: 69000 },
  IN: { expansion: true, minTotal: 65000, maxTotal: 71000 },
};

const supported = getSupportedStates();

describe('Supported state registry', () => {
  it('every supported state has an EXPECTATIONS entry (add a state = add a test)', () => {
    for (const { code } of supported) {
      expect(EXPECTATIONS[code], `missing EXPECTATIONS for state ${code}`).toBeDefined();
    }
  });
});

describe.each(supported)('State invariants: $code ($label)', ({ code }) => {
  const exp = EXPECTATIONS[code];
  const breakdown = () => getEffectiveTakeHome({ annualIncome: 44000, familySize: 4, state: code, adultCount: 2 });

  it('totalEffective at $44k/4/2-adults within documented bounds', () => {
    const total = breakdown().totalEffective;
    expect(total).toBeGreaterThanOrEqual(exp.minTotal);
    expect(total).toBeLessThanOrEqual(exp.maxTotal);
  });

  it('Medicaid behaviour matches expansion status', () => {
    const medicaid = breakdown().medicaidValue;
    if (exp.expansion) {
      // Expansion state at ~133% FPL → both adults covered.
      expect(medicaid).toBe(2 * PROXY);
    } else {
      // Non-expansion: parents above low parentFPL ceiling → no Medicaid.
      expect(medicaid).toBe(0);
    }
  });

  it('getCliffData returns exactly 201 points ($0–$200k, $1k step)', () => {
    const points = getCliffData({ familySize: 4, state: code, adultCount: 2 });
    expect(points).toHaveLength(201);
    expect(points[0].income).toBe(0);
    expect(points[points.length - 1].income).toBe(200000);
  });
});
