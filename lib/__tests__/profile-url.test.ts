/**
 * profile-url.test.ts — share-a-scenario URL hash round-trip (task-93).
 *
 * The calculator's scenario profile is encoded into the URL hash so a link is
 * shareable. Every field must survive encode → parse unchanged, and out-of-range
 * values must clamp. Added with the dependent-care FSA lever (task-93) to lock the
 * new field's round-trip and clamp behaviour.
 */
import { describe, it, expect } from 'vitest';
import {
  DEFAULT_PROFILE,
  encodeProfileHash,
  parseProfileHash,
  type Profile,
} from '@/lib/profile-url';

describe('profile URL hash round-trip', () => {
  it('default profile round-trips to itself', () => {
    const back = parseProfileHash(encodeProfileHash(DEFAULT_PROFILE));
    expect(back).toEqual(DEFAULT_PROFILE);
  });

  it('a fully-populated profile round-trips identically', () => {
    const profile: Profile = {
      state: 'TX',
      familySize: 5,
      adultCount: 2,
      currentIncome: 38000,
      offeredIncome: 61000,
      hasVoucher: true,
      pfccEnrolled: true,
      employerHealthInsurance: true,
      matchRate: 4,
      hsaContribution: 3000,
      pretax401k: 6000,
      dependentCareFsa: 5000,
      dualIncomeOn: true,
    };
    const back = parseProfileHash(encodeProfileHash(profile));
    expect(back).toEqual(profile);
  });

  it('dependentCareFsa survives encode → parse (uses the dcf key)', () => {
    const profile: Profile = { ...DEFAULT_PROFILE, dependentCareFsa: 2500 };
    const hash = encodeProfileHash(profile);
    expect(hash).toContain('dcf=2500');
    expect(parseProfileHash(hash).dependentCareFsa).toBe(2500);
  });

  it('dependentCareFsa is clamped to 0..5000 on parse', () => {
    expect(parseProfileHash('dcf=9000').dependentCareFsa).toBe(5000);
    expect(parseProfileHash('dcf=-500').dependentCareFsa).toBe(0);
  });

  it('default dependentCareFsa (0) is omitted from the hash to keep links short', () => {
    expect(encodeProfileHash(DEFAULT_PROFILE)).not.toContain('dcf=');
  });

  it('a missing dcf key falls back to the default (0)', () => {
    expect(parseProfileHash('st=OH&fs=4').dependentCareFsa).toBe(0);
  });

  it('dualIncomeOn survives encode → parse (uses the di key)', () => {
    const profile: Profile = {
      ...DEFAULT_PROFILE,
      adultCount: 2,
      dualIncomeOn: true,
    };
    const hash = encodeProfileHash(profile);
    expect(hash).toContain('di=1');
    expect(parseProfileHash(hash).dualIncomeOn).toBe(true);
  });

  it('default dualIncomeOn (false) is omitted from the hash', () => {
    expect(encodeProfileHash(DEFAULT_PROFILE)).not.toContain('di=');
  });

  it('dualIncomeOn is forced off when the household has fewer than two adults', () => {
    // A shared link with di=1 but a single adult resolves the flag off (inert),
    // mirroring the adultCount coherence clamp.
    const back = parseProfileHash('st=OH&fs=4&ad=1&di=1');
    expect(back.adultCount).toBe(1);
    expect(back.dualIncomeOn).toBe(false);
  });
});
