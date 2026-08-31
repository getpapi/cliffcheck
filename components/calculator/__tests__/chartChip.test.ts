import { describe, it, expect } from "vitest";
import { clampChipCenter } from "../chartChip";

/**
 * Regression for task-154: the steepest-drop chip had a left clamp but no right
 * clamp, so a high-income cliff near the $200k axis end pushed the chip off the
 * right edge. clampChipCenter must keep BOTH edges on-canvas.
 */
describe("clampChipCenter", () => {
  const CHART = 400; // rendered chart/SVG width in px
  const CHIP = 80; // chip width in px → half = 40

  it("left-clamps a low-income cliff so the chip's left edge stays on-canvas", () => {
    // cliff near $0 → line at x=5; centring there would clip the left edge (5-40)
    const cx = clampChipCenter(5, CHIP, CHART);
    expect(cx).toBe(CHIP / 2 + 2); // 42
    expect(cx - CHIP / 2).toBeGreaterThanOrEqual(0); // fully visible
  });

  it("right-clamps a high-income cliff near the axis end (the bug)", () => {
    // cliff near $200k → line at x=398; centring there would clip past 400 (398+40=438)
    const cx = clampChipCenter(398, CHIP, CHART);
    expect(cx).toBe(CHART - CHIP / 2 - 2); // 358
    expect(cx + CHIP / 2).toBeLessThanOrEqual(CHART); // fully visible — bug fixed
  });

  it("leaves a mid-income cliff centred on its line (unregressed)", () => {
    expect(clampChipCenter(200, CHIP, CHART)).toBe(200);
  });

  it("applies only the left clamp before the canvas is measured (width 0)", () => {
    expect(clampChipCenter(5, CHIP, 0)).toBe(CHIP / 2 + 2); // left floor still holds
    expect(clampChipCenter(200, CHIP, 0)).toBe(200); // no right clamp without width
  });

  it("keeps the left floor winning on a canvas too narrow for both clamps", () => {
    // half+2 (42) would exceed chartWidth-half-2 (18) — left edge must still win
    expect(clampChipCenter(30, CHIP, 60)).toBe(CHIP / 2 + 2);
  });
});
