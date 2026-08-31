/**
 * derive.test.ts — cliff-cause attribution (task-97).
 *
 * deriveResults scans the engine's 201-point curve and reports the single
 * GLOBAL steepest-step drop plus its dominant program cause (cliffAnnotation).
 * task-97 added CSR (ACA cost-sharing reduction) to the candidate set alongside
 * SNAP / Medicaid / Childcare / ACA / EITC (EITC added in C18/task-131).
 *
 * These tests lock two things:
 *  1. Adding the CSR (and EITC) candidates did NOT regress the dominant-cause
 *     label on the canonical scenarios — the real cliffs are still attributed to
 *     childcare / Medicaid / ACA-premium, never spuriously to the gentle candidates.
 *  2. The reported cause is always a member of the known candidate set.
 *
 * Finding worth recording (verified by sweeping all 7 live states × family sizes
 * 1–4): CSR and EITC never win the GLOBAL steepest step — childcare/Medicaid
 * termination and the ACA-premium cliff always drop more in a single $1k step. So
 * both are honest, non-noisy candidates: present for completeness, dominant only
 * if a scenario ever made them the steepest single step.
 */
import { describe, it, expect } from "vitest";
import { deriveResults, type ScenarioOpts } from "../derive";

const BASE: Omit<ScenarioOpts, "state" | "familySize" | "adultCount"> = {
  hasVoucher: false,
  pfccEnrolled: false,
  employerHealthInsurance: false,
  matchRate: 0,
  hsaContribution: 0,
  pretax401k: 0,
  dependentCareFsa: 0,
};

const VALID_CAUSES = ["SNAP", "Medicaid", "Childcare", "ACA", "EITC", "CSR"];

function causeFor(
  state: string,
  familySize: number,
  adultCount: number,
  currentIncome: number,
  offeredIncome: number
): string | null {
  const r = deriveResults(
    { ...BASE, state, familySize, adultCount },
    currentIncome,
    offeredIncome
  );
  return r.cliffAnnotation?.cause ?? null;
}

describe("cliff-cause attribution", () => {
  it("attributes the canonical Ohio cliff to childcare (unchanged by the CSR/EITC candidates)", () => {
    expect(causeFor("OH", 4, 2, 44000, 70000)).toBe("Childcare");
  });

  it("attributes a two-adult Texas ACA-premium cliff to ACA", () => {
    expect(causeFor("TX", 2, 2, 20000, 80000)).toBe("ACA");
  });

  it("reports a cause from the known candidate set for every live state", () => {
    const states = ["OH", "TX", "NC", "MI", "FL", "GA", "PA"];
    for (const state of states) {
      const cause = causeFor(state, 4, 2, 15000, 100000);
      expect(cause === null || VALID_CAUSES.includes(cause)).toBe(true);
    }
  });

  it("does not spuriously attribute a real childcare cliff to CSR or EITC (non-noisy)", () => {
    // A wide-span single-adult family scenario across every live state: the real
    // cliff is always a childcare/Medicaid/ACA drop, never the gentle candidates.
    const states = ["OH", "TX", "NC", "MI", "FL", "GA", "PA"];
    for (const state of states) {
      const cause = causeFor(state, 4, 1, 15000, 100000);
      expect(["CSR", "EITC"]).not.toContain(cause);
    }
  });
});

describe("per-program cliff thresholds (programCliffs)", () => {
  function programCliffsFor(state: string, familySize: number, adultCount: number) {
    return deriveResults(
      { ...BASE, state, familySize, adultCount },
      15000,
      100000
    ).programCliffs;
  }

  it("emits an Essential-Plan / free-coverage boundary for a NY profile crossing the EP ceiling", () => {
    const cliffs = programCliffsFor("NY", 4, 2);
    const ep = cliffs.find((c) => c.label === "Free health coverage ends");
    expect(ep).toBeDefined();
    // The boundary income must be a real, positive reading off the curve.
    expect(ep!.income).toBeGreaterThan(0);
  });

  it("does NOT emit a free-coverage boundary for non-BHP states", () => {
    for (const state of ["OH", "TX", "NC", "MI", "FL", "GA", "PA"]) {
      const cliffs = programCliffsFor(state, 4, 2);
      expect(cliffs.some((c) => c.label === "Free health coverage ends")).toBe(false);
    }
  });
});
