/**
 * lib/engine/index.ts — public barrel for the CliffCheck benefit engine.
 *
 * Pure, typed, framework-free. UI imports only from `@/lib/engine`.
 * Extracted from the v1 single-file build (_archive/index.html) — see
 * docs/replatform/PLAN.md §"Engine extraction".
 */

// Public API
export { getEffectiveTakeHome, getCliffData } from './takeHome';
export { getSupportedStates, isSupportedState, getState } from './registry';
export {
  getStateSources,
  collectSources,
  isGovSource,
  PROGRAM_PROVENANCE,
  STATE_PROGRAM_PROVENANCE,
} from './provenance';

// Per-program calc functions — exposed for the engine validation suite, which
// converts the inline console.assert specs that called these directly. Tests
// import only from this barrel.
export { calcFederalEITC } from './eitc';
export { calcFederalCTC } from './ctc';
export { calcACACSR } from './aca';
export { calcStateIncomeTax } from './tax';
export { calcFICA, calcFederalIncomeTax, deriveFilingStatus } from './fedTax';
export { FED } from './federal';

// Public types
export type {
  TakeHomeInput,
  TakeHomeBreakdown,
  Provenance,
  Rule,
  StateCode,
  StateRules,
  Source,
} from './types';
