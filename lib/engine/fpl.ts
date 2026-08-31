/**
 * lib/engine/fpl.ts — Federal Poverty Level helpers. Extracted verbatim.
 */
import { FED } from './federal';

export function getFPL(familySize: number): number {
  return FED.fpl.base2026 + (Math.max(1, familySize) - 1) * FED.fpl.increment2026;
}

export function getFPLPercent(annualIncome: number, familySize: number): number {
  return annualIncome / getFPL(familySize);
}
