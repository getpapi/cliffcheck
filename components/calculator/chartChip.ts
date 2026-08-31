/**
 * Horizontal placement for the steepest-drop callout chip in CliffChart.
 *
 * The chip is centred on the cliff's vertical reference line but must stay fully
 * on-canvas. `lineX` is the line's pixel x (from the Recharts label viewBox),
 * `chipWidth` the chip's pixel width, and `chartWidth` the rendered chart/SVG
 * width — the chip lives in that SVG coordinate space and clips at its edges.
 *
 * Returns the chip's centre x, clamped so neither edge leaves the canvas:
 *  - left floor keeps the left edge >= 2px (low-income cliffs near $0),
 *  - right ceil keeps the right edge <= chartWidth - 2px (high-income cliffs
 *    near the $200k axis end — the bug this fixes; there was only a left clamp).
 * The left floor wins if the two ever conflict on a very narrow canvas. When
 * chartWidth is unknown (0, before the canvas is measured) only the left floor
 * applies, matching the previous behaviour.
 */
export function clampChipCenter(
  lineX: number,
  chipWidth: number,
  chartWidth: number,
): number {
  const half = chipWidth / 2;
  const leftFloor = half + 2;
  if (chartWidth <= 0) return Math.max(lineX, leftFloor);
  const rightCeil = chartWidth - half - 2;
  return Math.max(leftFloor, Math.min(lineX, rightCeil));
}
