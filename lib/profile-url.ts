/**
 * lib/profile-url.ts — share-a-scenario URL hash encode/parse (typed).
 *
 * The calculator syncs its non-identifying scenario inputs to the URL hash so a
 * scenario can be shared by copying the link. ONLY scenario shape leaves the
 * device this way — state, incomes, family size, adult count, and the benefit
 * flags. There is no name, no PII, no API call: this is share-a-scenario, not
 * data egress (DESIGN.md privacy promise holds). Financial inputs the user types
 * are the *scenario* itself; nothing about identity is encoded.
 *
 * Scheme: a versioned, compact `key=value` hash (`#v=1&st=OH&fs=4&...`) — short,
 * human-skimmable, and forward-compatible (unknown keys ignored; missing keys
 * fall back to defaults). Every parsed value is clamped/validated so a hand-
 * mangled link can never crash the tool or surface out-of-range numbers.
 *
 * v1 (index.html) persisted this profile via TinyBase; the replatform keeps the
 * exact same field set + defaults but moves the transport to the URL hash.
 */

/** The full scenario profile the calculator owns. All money is annual dollars. */
export interface Profile {
  /** Two-letter state code (e.g. 'OH'). */
  state: string;
  /** Total household size (adults + children), 1–8. */
  familySize: number;
  /** Number of adults in the household, 1 or 2. */
  adultCount: number;
  /** Current annual gross wages. */
  currentIncome: number;
  /** Offered / target annual gross wages. */
  offeredIncome: number;
  /** Holds a Section 8 / Housing Choice Voucher. */
  hasVoucher: boolean;
  /** Enrolled in subsidised childcare (continuation eligibility). */
  pfccEnrolled: boolean;
  /** Has employer-sponsored health insurance (short-circuits ACA). */
  employerHealthInsurance: boolean;
  /** Employer 401(k) match rate, % of salary (0–20). */
  matchRate: number;
  /** Annual HSA contribution (0–9000), reduces MAGI. */
  hsaContribution: number;
  /** Annual pre-tax 401(k) contribution (0–24000), reduces MAGI. */
  pretax401k: number;
  /** Annual dependent-care FSA election (0–5000), reduces MAGI. */
  dependentCareFsa: number;
  /** "Should the second adult work?" comparison panel open (needs 2 adults). */
  dualIncomeOn: boolean;
}

/** Canonical default scenario — the Ohio family-of-4 demo (matches v1 DEFAULTS). */
export const DEFAULT_PROFILE: Profile = {
  state: "OH",
  familySize: 4,
  adultCount: 2,
  currentIncome: 44000,
  offeredIncome: 70000,
  hasVoucher: false,
  pfccEnrolled: false,
  employerHealthInsurance: false,
  matchRate: 0,
  hsaContribution: 0,
  pretax401k: 0,
  dependentCareFsa: 0,
  dualIncomeOn: false,
};

/**
 * URL-hash schema: maps each Profile field to a short hash key plus the encode/
 * decode + clamp rules. The single source of truth for both directions — adding
 * a field means adding one entry here.
 */
export const PROFILE_URL_SCHEMA = {
  version: 1,
  versionKey: "v",
  fields: {
    state: { key: "st" },
    familySize: { key: "fs", min: 1, max: 8 },
    adultCount: { key: "ad", min: 1, max: 2 },
    currentIncome: { key: "ci", min: 0, max: 200000 },
    offeredIncome: { key: "oi", min: 0, max: 200000 },
    matchRate: { key: "mr", min: 0, max: 20 },
    hsaContribution: { key: "hsa", min: 0, max: 9000 },
    pretax401k: { key: "k", min: 0, max: 24000 },
    dependentCareFsa: { key: "dcf", min: 0, max: 5000 },
    hasVoucher: { key: "v8" },
    pfccEnrolled: { key: "cc" },
    employerHealthInsurance: { key: "eh" },
    dualIncomeOn: { key: "di" },
  },
} as const;

// Numeric fields with clamp bounds, derived from the schema.
const NUMERIC_FIELDS = [
  "familySize",
  "adultCount",
  "currentIncome",
  "offeredIncome",
  "matchRate",
  "hsaContribution",
  "pretax401k",
  "dependentCareFsa",
] as const;
type NumericField = (typeof NUMERIC_FIELDS)[number];

const BOOL_FIELDS = [
  "hasVoucher",
  "pfccEnrolled",
  "employerHealthInsurance",
  "dualIncomeOn",
] as const;
type BoolField = (typeof BOOL_FIELDS)[number];

function clampInt(raw: string, min: number, max: number, fallback: number): number {
  const n = Math.round(Number(raw));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

/**
 * Serialise a Profile into a compact URL hash string (no leading `#`). Only keys
 * that differ from the default are emitted, keeping shared links short; the
 * version key is always present. The state code is always emitted so a shared
 * link is self-describing.
 */
export function encodeProfileHash(profile: Profile): string {
  const f = PROFILE_URL_SCHEMA.fields;
  const parts: string[] = [`${PROFILE_URL_SCHEMA.versionKey}=${PROFILE_URL_SCHEMA.version}`];

  // State always emitted (the link should name its state explicitly).
  parts.push(`${f.state.key}=${encodeURIComponent(profile.state)}`);

  for (const field of NUMERIC_FIELDS) {
    const val = profile[field];
    if (val !== DEFAULT_PROFILE[field]) {
      parts.push(`${f[field].key}=${val}`);
    }
  }
  for (const field of BOOL_FIELDS) {
    if (profile[field] !== DEFAULT_PROFILE[field]) {
      parts.push(`${f[field].key}=${profile[field] ? 1 : 0}`);
    }
  }
  return parts.join("&");
}

/**
 * Parse a URL hash string (with or without a leading `#`) back into a full
 * Profile. Missing keys fall back to DEFAULT_PROFILE; out-of-range numbers are
 * clamped; unknown keys are ignored; a malformed hash yields the default
 * profile. Never throws — a hand-mangled link degrades gracefully.
 */
export function parseProfileHash(hash: string | null | undefined): Profile {
  const result: Profile = { ...DEFAULT_PROFILE };
  if (!hash) return result;

  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!raw) return result;

  let params: URLSearchParams;
  try {
    params = new URLSearchParams(raw);
  } catch {
    return result;
  }

  const f = PROFILE_URL_SCHEMA.fields;

  // State — keep as a non-empty string; validity (supported?) is gated by the UI.
  const st = params.get(f.state.key);
  if (st) result.state = st.trim().toUpperCase().slice(0, 4);

  for (const field of NUMERIC_FIELDS) {
    const spec = f[field] as { key: string; min: number; max: number };
    const v = params.get(spec.key);
    if (v !== null) {
      result[field as NumericField] = clampInt(
        v,
        spec.min,
        spec.max,
        DEFAULT_PROFILE[field]
      );
    }
  }

  for (const field of BOOL_FIELDS) {
    const v = params.get(f[field].key);
    if (v !== null) {
      result[field as BoolField] = v === "1" || v === "true";
    }
  }

  // Coherence guard: adultCount can never exceed familySize.
  if (result.adultCount > result.familySize) {
    result.adultCount = Math.min(2, result.familySize);
  }

  // Coherence guard: the dual-income comparison needs two adults. A shared link
  // with di=1 but a single-adult household resolves the flag off (inert) rather
  // than rendering a panel the UI gates away — mirrors the adultCount clamp.
  if (result.dualIncomeOn && result.adultCount < 2) {
    result.dualIncomeOn = false;
  }

  return result;
}
