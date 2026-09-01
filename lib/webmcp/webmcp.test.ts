/**
 * lib/webmcp/webmcp.test.ts — registration + tool-contract checks.
 *
 * This does NOT prove the tools work in a real WebMCP browser (that needs Chrome
 * with the origin-trial flag or the ChatGPT in-app browser — a manual step). It
 * proves the wiring is sound: the adapter registers four well-formed tools, each
 * one returns parseable JSON, and the numbers match the engine, so a failure in
 * a real browser is a browser/spec issue and not our code.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { buildTools } from "./tools";
import { registerCliffCheckTools } from "./register";
import type { WebMcpTool } from "./types";

const signal = new AbortController().signal;
const run = (t: WebMcpTool, args: Record<string, unknown>) => t.execute(args, { signal });

afterEach(() => {
  delete document.modelContext;
});

describe("registerCliffCheckTools", () => {
  it("no-ops (returns null) when the browser has no WebMCP", () => {
    expect(document.modelContext).toBeUndefined();
    expect(registerCliffCheckTools()).toBeNull();
  });

  it("registers all four tools with the WebMCP API and returns an AbortController", async () => {
    const registerTool = vi.fn().mockResolvedValue(undefined);
    document.modelContext = { registerTool };

    const controller = registerCliffCheckTools();
    expect(controller).toBeInstanceOf(AbortController);

    // flush the .catch() microtasks in register.ts
    await Promise.resolve();

    expect(registerTool).toHaveBeenCalledTimes(4);
    const names = registerTool.mock.calls.map((c) => (c[0] as WebMcpTool).name).sort();
    expect(names).toEqual([
      "calculate_cliff",
      "get_cliff_curve",
      "get_safe_exit",
      "list_supported_states",
    ]);
    // each call passes the AbortController's signal for lifecycle cleanup
    for (const call of registerTool.mock.calls) {
      expect(call[1]).toMatchObject({ signal: controller!.signal });
    }
    expect(() => controller!.abort()).not.toThrow();
  });
});

describe("tool contracts", () => {
  const tools = buildTools();
  const byName = Object.fromEntries(tools.map((t) => [t.name, t]));

  it("every tool has a name, description, object input schema, and execute fn", () => {
    expect(tools).toHaveLength(4);
    for (const t of tools) {
      expect(typeof t.name).toBe("string");
      expect(t.description.length).toBeGreaterThan(20);
      expect(t.inputSchema.type).toBe("object");
      expect(typeof t.execute).toBe("function");
      expect(t.annotations?.readOnlyHint).toBe(true);
    }
  });

  it("every tool returns a JSON-parseable string", async () => {
    const base = { state: "OH", familySize: 4, currentIncome: 44000, offeredIncome: 70000 };
    for (const t of tools) {
      const out = await run(t, base);
      expect(typeof out).toBe("string");
      expect(() => JSON.parse(out)).not.toThrow();
    }
  });

  it("calculate_cliff reproduces the canonical Ohio demo (engine parity)", async () => {
    const out = JSON.parse(
      await run(byName.calculate_cliff, {
        state: "OH",
        familySize: 4,
        adultCount: 2,
        currentIncome: 44000,
        offeredIncome: 70000,
      }),
    );
    expect(out.isCliff).toBe(true);
    expect(out.netChange).toBe(-14636);
    expect(out.effectiveTakeHomeNow).toBe(73797);
    expect(out.verdict).toMatch(/worse off/);
  });

  it("get_safe_exit returns the same $96k target the calculator shows", async () => {
    const out = JSON.parse(
      await run(byName.get_safe_exit, { state: "OH", familySize: 4, currentIncome: 44000 }),
    );
    expect(out.safeExitIncome).toBe(96000);
  });

  it("get_cliff_curve returns 201 points and flags the childcare drop after $47k", async () => {
    const out = JSON.parse(await run(byName.get_cliff_curve, { state: "OH", familySize: 4 }));
    expect(out.points).toHaveLength(201);
    expect(out.steepestDrop.fromIncome).toBe(47000);
    expect(out.steepestDrop.cause).toBe("childcare subsidy");
  });

  it("list_supported_states returns the 16 live states", async () => {
    const out = JSON.parse(await run(byName.list_supported_states, {}));
    expect(out.count).toBe(16);
    expect(out.states.map((s: { code: string }) => s.code)).toContain("OH");
  });

  it("rejects an unknown state code with a message that lists valid ones", async () => {
    await expect(
      run(byName.calculate_cliff, {
        state: "ZZ",
        familySize: 4,
        currentIncome: 44000,
        offeredIncome: 70000,
      }),
    ).rejects.toThrow(/not supported.*OH/s);
  });

  it("clamps out-of-range numeric input instead of throwing", async () => {
    const out = JSON.parse(
      await run(byName.calculate_cliff, {
        state: "OH",
        familySize: 999,
        currentIncome: -5000,
        offeredIncome: 9_999_999,
      }),
    );
    expect(out.familySize).toBe(12);
    expect(out.currentIncome).toBe(0);
    expect(out.offeredIncome).toBe(500000);
  });
});
