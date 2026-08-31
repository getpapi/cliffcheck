/**
 * lib/engine/registry.ts — builds the state map from the per-state files and
 * exposes lookup helpers. Extracted verbatim from getState / isSupportedState /
 * getSupportedStates in _archive/index.html. Adding a state = adding a file +
 * one entry here.
 */
import type { StateCode, StateRules } from './types';
import { OH } from './states/oh';
import { TX } from './states/tx';
import { NC } from './states/nc';
import { MI } from './states/mi';
import { FL } from './states/fl';
import { GA } from './states/ga';
import { PA } from './states/pa';
import { NY } from './states/ny';
import { AZ } from './states/az';
import { IL } from './states/il';
import { CA } from './states/ca';
import { WA } from './states/wa';
import { VA } from './states/va';
import { TN } from './states/tn';
import { MO } from './states/mo';
import { IN } from './states/in';

// ── STATES: Per-state rule tables keyed by 2-letter code ───────────────
// Each state exposes: supported, label, snap, medicaid, aca, childcare, housing.
// To add a state: create states/XX.ts with these fields and a validateXX() test.
export const STATES: Record<string, StateRules> = { OH, TX, NC, MI, FL, GA, PA, NY, AZ, IL, CA, WA, VA, TN, MO, IN };

export function getState(stateCode: StateCode): StateRules {
  const state = STATES[stateCode];
  if (state) return state;
  // Defence-in-depth fallback. UI consumers gate on isSupportedState so users
  // never SEE these fallback numbers, but engine callers (validate assertions,
  // tests) still get a coherent state object.
  if (globalThis.process?.env?.NODE_ENV !== 'production') {
    console.warn(`[CliffCheck] getState fallback: unsupported stateCode "${stateCode}", returning OH`);
  }
  return STATES.OH;
}

// Whether a stateCode resolves to a fully-supported state. UI consumers
// that render dollar values must gate on this to avoid showing OH
// numbers for an unsupported state code (deeplinks, persisted profiles
// from a removed state, manual URL params).
export function isSupportedState(stateCode: StateCode): boolean {
  return !!(STATES[stateCode] && STATES[stateCode].supported);
}

// Supported states for UI selector, ordered by label for predictable menu order.
export function getSupportedStates(): Array<{ code: string; label: string }> {
  return Object.entries(STATES)
    .filter(([, s]) => s.supported)
    .map(([code, s]) => ({ code, label: s.label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
