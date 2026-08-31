/**
 * scripts/gen-regression-baseline.ts — regenerate the engine cliff-curve
 * baseline used by lib/engine/__tests__/nyRegression.test.ts.
 *
 * The baseline freezes a SHA-256 of each pre-NY state's full 121-point cliff
 * curve across a set of scenarios. The regression test rehashes the live engine
 * and fails on any drift, so an intentional rule change to one of these states
 * requires regenerating the baseline on purpose:
 *
 *     npx tsx scripts/gen-regression-baseline.ts
 *
 * Relative imports so tsx needs no path-alias resolution.
 */
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { getCliffData } from '../lib/engine/takeHome';

// The seven states that predate NY's Essential-Plan engine change. NY is
// deliberately excluded — it is the state whose addition this guard protects.
const STATES = ['OH', 'TX', 'NC', 'MI', 'FL', 'GA', 'PA'] as const;

// Scenarios chosen to exercise every code path: Medicaid expansion vs
// non-expansion, childless vs parent, SNAP, ACA PTC, and CSR tiers.
const SCENARIOS: Array<{ familySize: number; adultCount: number }> = [
  { familySize: 1, adultCount: 1 },
  { familySize: 2, adultCount: 2 },
  { familySize: 3, adultCount: 2 },
  { familySize: 4, adultCount: 2 },
];

function curveHash(state: string, familySize: number, adultCount: number): string {
  const curve = getCliffData({ state, familySize, adultCount });
  return createHash('sha256').update(JSON.stringify(curve)).digest('hex');
}

const baseline: Record<string, Record<string, string>> = {};
for (const state of STATES) {
  baseline[state] = {};
  for (const s of SCENARIOS) {
    baseline[state][`fs${s.familySize}_ad${s.adultCount}`] = curveHash(state, s.familySize, s.adultCount);
  }
}

writeFileSync(
  'lib/engine/__tests__/fixtures/engineCurveBaseline.json',
  JSON.stringify(baseline, null, 2) + '\n'
);
console.log(`wrote hash baseline for ${STATES.join(', ')} (${SCENARIOS.length} scenarios each)`);
