"use client";

/**
 * CliffChart, the "Oh Shit" payload (DESIGN.md Cliff Chart). A stranger must
 * understand "this raise makes them $X poorer" in 5 seconds.
 *
 * Round-2 (10-07-2026): the card carries TWO views behind a segmented control:
 *
 * 1. "The cliff" — the take-home curve as a FILLED step body so the cliff reads
 *    as the floor dropping out. Income is chaptered by flat zone bands, but only
 *    while benefits exist: past the last program cliff the zones stop, the line
 *    thins, and a quiet "wages only" caption explains the flat right half — the
 *    $200k axis no longer dilutes the story.
 * 2. "Where the money goes" — the same income axis with each benefit program as
 *    a stacked band (engine values straight off each CliffPoint; NO new money
 *    math), so you watch SNAP, Medicaid, childcare, EITC shrink and die as
 *    wages rise. Legend chips carry each program's value at the current income.
 *
 * Flat fills only (no gradients). Step functions, no bezier smoothing. The
 * curves are NEVER animated (financial numbers are read, not watched).
 */
import { useState, useRef } from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Label,
} from "recharts";
import type { CliffPoint, DerivedResults } from "./derive";
import { fmtDollars } from "./derive";
import { clampChipCenter } from "./chartChip";
import { CANON } from "@/lib/palette";

// Chart colours come from the single palette canon (lib/palette.ts) — Recharts
// needs literal colour strings, so we import the source of truth instead of
// hardcoding hex here.
const C = {
  line: CANON.chartLine, // warm stone take-home line
  body: CANON.chartLine, // flat fill under the line (low opacity)
  blue: CANON.currentIncomeBlue, // You now (reserved)
  violet: CANON.offeredIncomeViolet, // Offer (reserved)
  green: CANON.safeGreen, // Safe exit / safe zone
  red: CANON.cliffRed, // cliff
  redSoft: CANON.cliffBorderSoft, // callout chip border
  safeFill: CANON.chartSafeFill,
  cliffFill: CANON.chartCliffFill,
  transFill: CANON.chartTransitionFill,
  muted: CANON.textMuted,
  secondary: CANON.textSecondary,
  surface: CANON.surfaceWhite,
  wagesRef: CANON.chartWagesGhost,
  grid: CANON.borderStone,
} as const;

/** The stacked composition series — engine fields only, no derived money. */
const PROGRAMS: Array<{
  key: keyof CliffPoint;
  label: string;
  color: string;
}> = [
  { key: "medicaidValue", label: "Medicaid", color: CANON.programMedicaid },
  { key: "snapValue", label: "SNAP", color: CANON.programSnap },
  { key: "childcareValue", label: "Childcare", color: CANON.programChildcare },
  { key: "eitcValue", label: "EITC", color: CANON.programEitc },
  { key: "acaCSRValue", label: "ACA savings", color: CANON.programAcaCsr },
  { key: "section8Value", label: "Section 8", color: CANON.programSection8 },
];

type View = "cliff" | "flow";

export function CliffChart({
  results,
  currentIncome,
  offeredIncome,
  stateLabel,
  familySize,
}: {
  results: DerivedResults;
  currentIncome: number;
  offeredIncome: number;
  stateLabel: string;
  familySize: number;
}) {
  const [view, setView] = useState<View>("cliff");
  // Measured at chip-render time to keep the steepest-drop callout on-canvas
  // (the chip lives in this div's SVG coordinate space — see clampChipCenter).
  const canvasRef = useRef<HTMLDivElement>(null);
  const { points, current, yMin, cliffAnnotation, safeExit, programCliffs } =
    results;

  // Presentational derivation: the income where the LAST benefit dollar dies.
  // Past this point the curve is wages alone — the right half of the $200k
  // axis gets de-emphasised so the flat diagonal never dilutes the cliff.
  let benefitsEnd: number | null = null;
  for (let i = points.length - 1; i >= 0; i--) {
    if (PROGRAMS.some(({ key }) => (points[i][key] as number) > 0)) {
      benefitsEnd = points[Math.min(i + 1, points.length - 1)].income;
      break;
    }
  }

  // Programs that ever pay anything in this scenario (legend + stack).
  const activePrograms = PROGRAMS.filter(({ key }) =>
    points.some((p) => (p[key] as number) > 0)
  );

  const data = points.map((p) => ({
    ...p,
    effective: p.totalEffective,
    // Split the take-home curve at benefitsEnd: strong while benefits exist,
    // ghosted after (wages only) — same numbers, different emphasis.
    effectiveStrong:
      benefitsEnd === null || p.income <= benefitsEnd ? p.totalEffective : null,
    effectiveAfter:
      benefitsEnd !== null && p.income >= benefitsEnd ? p.totalEffective : null,
    wages: p.income,
  }));

  // Quiet per-program boundary markers (task-153). These are informational
  // thresholds ("Medicaid ends"), NOT the cliff itself, so they read as a muted
  // secondary layer beneath the loud red steepest-drop chip. 375px de-clutter:
  // full-text horizontal labels ("Free health coverage ends" ≈ 130px) would
  // collide, so labels are drawn ROTATED (each fills a ~11px vertical strip) and
  // near-coincident boundaries are COLLAPSED into one line + one merged label so
  // no two ever overlap. Labels anchor at the bottom and grow upward, clear of
  // the steepest-drop chip in the top margin.
  const boundaryClusters = (() => {
    const CLUSTER_GAP = 6000; // $ spacing under which vertical labels would touch
    const sorted = [...programCliffs].sort((a, b) => a.income - b.income);
    const clusters: { income: number; label: string; sum: number; names: string[] }[] = [];
    for (const pc of sorted) {
      const name = pc.label.replace(/ ends?$/i, "");
      const last = clusters[clusters.length - 1];
      if (last && pc.income - last.income <= CLUSTER_GAP) {
        last.names.push(name);
        last.sum += pc.income;
        last.income = Math.round(last.sum / last.names.length);
        last.label = `${last.names.join(" + ")} end`;
      } else {
        clusters.push({ income: pc.income, sum: pc.income, names: [name], label: pc.label });
      }
    }
    return clusters;
  })();

  const cliffStart = cliffAnnotation ? cliffAnnotation.midIncome - 900 : null;
  const cliffEnd = cliffAnnotation ? cliffAnnotation.midIncome + 900 : null;
  const zonesEnd = benefitsEnd ?? 200000;

  // The flow view zooms to where the money actually IS: benefits are dead past
  // ~$100k, so a $200k axis would squash every band into the left third. Round
  // up to the next $20k tick past the last benefit dollar (and never crop the
  // income markers). The cliff view keeps the full axis for the wage story.
  const flowMax = Math.min(
    200000,
    Math.max(
      Math.ceil(((benefitsEnd ?? 0) + 8000) / 20000) * 20000,
      Math.ceil((Math.max(currentIncome, offeredIncome) + 8000) / 20000) * 20000,
      80000
    )
  );
  const flowData = data.filter((p) => p.income <= flowMax);
  const flowTicks = Array.from(
    { length: flowMax / 20000 + 1 },
    (_, i) => i * 20000
  );

  return (
    <section
      id="cliff-chart"
      aria-label={
        view === "cliff"
          ? `Benefits cliff chart for ${stateLabel}, household of ${familySize}`
          : `Benefit programs by income for ${stateLabel}, household of ${familySize}`
      }
      className="cc-ord-chart"
      style={{
        backgroundColor: "var(--color-surface-white)",
        border: "1.5px solid var(--color-border-stone)",
        borderRadius: "var(--radius-xl)",
        boxShadow: "var(--elevation-card)",
        padding: "var(--space-md) var(--space-lg) var(--space-md)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          justifyContent: "space-between",
          columnGap: "var(--space-md)",
          rowGap: "var(--space-xs)",
          marginBottom: "var(--space-sm)",
        }}
      >
        <div style={{ minWidth: 0, flex: "1 1 220px" }}>
          <h2
            style={{
              margin: "0 0 2px",
              fontSize: "var(--type-heading)",
              fontWeight: 700,
              letterSpacing: "-0.01em",
              color: "var(--color-text-primary)",
            }}
          >
            {view === "cliff" ? "Your benefits cliff" : "Where the money goes"}
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: "var(--type-caption)",
              color: "var(--color-text-muted)",
              lineHeight: 1.5,
            }}
          >
            {view === "cliff"
              ? `${stateLabel}, household of ${familySize}. The filled line is your real take-home. The dashed line is wages alone.`
              : `${stateLabel}, household of ${familySize}. Each band is a benefit program. Watch each one shrink, then die, as wages rise.`}
          </p>
        </div>

        {/* Segmented view toggle — local UI state, cliff is always the default. */}
        <div
          role="group"
          aria-label="Chart view"
          style={{
            display: "grid",
            gridTemplateColumns: "auto auto",
            gap: 4,
            padding: 4,
            borderRadius: "var(--radius-lg)",
            backgroundColor: "var(--color-trust-surface)",
            border: "1px solid var(--color-border-stone)",
            flexShrink: 0,
          }}
        >
          <ViewTab active={view === "cliff"} onClick={() => setView("cliff")}>
            The cliff
          </ViewTab>
          <ViewTab active={view === "flow"} onClick={() => setView("flow")}>
            Where the money goes
          </ViewTab>
        </div>
      </div>

      <div className="cc-chart-canvas" ref={canvasRef}>
        <ResponsiveContainer width="100%" height="100%">
          {view === "cliff" ? (
            <ComposedChart
              data={data}
              margin={{ top: 32, right: 18, bottom: 34, left: 6 }}
            >
              <CartesianGrid stroke={C.grid} strokeOpacity={0.45} vertical={false} />

              {/* Zone bands chapter the income axis — but ONLY while benefits
                  exist. Past benefitsEnd the plot goes quiet on purpose. */}
              {cliffStart !== null && cliffEnd !== null ? (
                <>
                  <ReferenceArea x1={0} x2={cliffStart} fill={C.safeFill} fillOpacity={0.45} ifOverflow="extendDomain" />
                  <ReferenceArea x1={cliffStart} x2={cliffEnd} fill={C.cliffFill} fillOpacity={1} ifOverflow="extendDomain" />
                  <ReferenceArea x1={cliffEnd} x2={zonesEnd} fill={C.transFill} fillOpacity={0.55} ifOverflow="extendDomain" />
                </>
              ) : (
                <ReferenceArea x1={0} x2={zonesEnd} fill={C.safeFill} fillOpacity={0.35} />
              )}

              <XAxis
                type="number"
                dataKey="income"
                domain={[0, 200000]}
                ticks={[0, 40000, 80000, 120000, 160000, 200000]}
                tickFormatter={(v: number) => `$${v / 1000}k`}
                tick={{ fontSize: 11.5, fill: C.secondary, fontFamily: "system-ui" }}
                tickMargin={8}
                tickLine={false}
                axisLine={{ stroke: C.grid }}
              >
                <Label
                  value="Gross wages"
                  position="bottom"
                  offset={10}
                  style={{
                    fontSize: 10.5,
                    fill: C.muted,
                    fontWeight: 600,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                />
              </XAxis>
              <YAxis
                type="number"
                domain={[yMin, "auto"]}
                tickFormatter={(v: number) => `$${Math.round(v / 1000)}k`}
                tick={{ fontSize: 11.5, fill: C.secondary, fontFamily: "system-ui" }}
                tickMargin={6}
                tickLine={false}
                axisLine={false}
                width={48}
              />

              {/* Wages-only ghost. The gap to the real line is the benefit value. */}
              <Line
                type="linear"
                dataKey="wages"
                stroke={C.wagesRef}
                strokeWidth={1.5}
                strokeDasharray="3 5"
                dot={false}
                activeDot={false}
                isAnimationActive={false}
                legendType="none"
              />

              {/* Take-home cliff, filled step area with a crisp stroke on top —
                  full weight while benefits exist. Never animated: financial
                  numbers are read, not watched (DESIGN.md), and the mount
                  animation raced ResponsiveContainer resizes. */}
              <Area
                type="stepAfter"
                dataKey="effectiveStrong"
                stroke={C.line}
                strokeWidth={2.5}
                fill={C.body}
                fillOpacity={0.09}
                dot={false}
                activeDot={{ r: 4, fill: C.line, stroke: C.surface, strokeWidth: 1.5 }}
                isAnimationActive={false}
              />
              {/* Past the last cliff the same curve continues thin and quiet —
                  the story is over, the line says so. */}
              <Line
                type="stepAfter"
                dataKey="effectiveAfter"
                stroke={C.line}
                strokeWidth={1.5}
                strokeOpacity={0.45}
                dot={false}
                activeDot={false}
                isAnimationActive={false}
              />

              {/* Marker verticals, colour-coded (values live in the key below). */}
              <ReferenceLine x={currentIncome} stroke={C.blue} strokeWidth={1.5} strokeDasharray="5 4" />
              <ReferenceLine x={offeredIncome} stroke={C.violet} strokeWidth={1.5} strokeDasharray="5 4" />
              {safeExit !== null && (
                <ReferenceLine x={safeExit} stroke={C.green} strokeWidth={1.5} strokeDasharray="3 3" />
              )}

              {/* Quiet program-boundary markers (task-153) — a muted secondary
                  layer beneath the red chip: thin dashed line + small rotated
                  label rising from the bottom so long labels never crowd 375px. */}
              {boundaryClusters.map((b) => (
                <ReferenceLine
                  key={`${b.income}-${b.label}`}
                  x={b.income}
                  stroke={C.muted}
                  strokeWidth={1}
                  strokeDasharray="2 4"
                >
                  <Label
                    content={(p) => {
                      const vb = (p as unknown as { viewBox?: { x: number; y: number; height: number } }).viewBox;
                      if (!vb) return null;
                      const px = vb.x + 5; // just right of the dashed line
                      const py = vb.y + vb.height - 8; // baseline near bottom, grows up
                      return (
                        <text
                          x={px}
                          y={py}
                          transform={`rotate(-90, ${px}, ${py})`}
                          textAnchor="start"
                          fontSize={9.5}
                          fontWeight={600}
                          fontFamily="system-ui"
                          fill={C.secondary}
                          style={{ pointerEvents: "none" }}
                        >
                          {b.label}
                        </text>
                      );
                    }}
                  />
                </ReferenceLine>
              ))}

              {/* Steepest-drop callout, a single red chip in the top margin. */}
              {cliffAnnotation && (
                <ReferenceLine x={cliffAnnotation.midIncome} stroke="transparent">
                  <Label
                    content={(p) => {
                      const vb = (p as unknown as { viewBox?: { x: number; y: number; width: number } }).viewBox;
                      if (!vb) return null;
                      // Drop amount only — the cause phrase confused users more
                      // than it helped (owner call, 09-07-2026).
                      const drop = `↓ −$${cliffAnnotation.dropAmount.toLocaleString("en-US")}`;
                      const w = drop.length * 6.9 + 20;
                      // Keep the callout on-canvas at both ends: left clamp for
                      // low-income cliffs near $0, right clamp for high-income
                      // cliffs near the $200k axis end (the chip is centred on
                      // the cliff line but clips at the chart's SVG edges).
                      const chartWidth = canvasRef.current?.clientWidth ?? 0;
                      const cx = clampChipCenter(vb.x, w, chartWidth);
                      return (
                        <g style={{ pointerEvents: "none" }}>
                          <rect
                            x={cx - w / 2}
                            y={2}
                            width={w}
                            height={22}
                            rx={11}
                            fill={C.surface}
                            stroke={C.redSoft}
                            strokeWidth={1.25}
                          />
                          <text
                            x={cx}
                            y={17}
                            fontSize={12.5}
                            textAnchor="middle"
                            fontFamily="system-ui"
                          >
                            <tspan fontWeight={800} fill={C.red}>{drop}</tspan>
                          </text>
                        </g>
                      );
                    }}
                  />
                </ReferenceLine>
              )}
            </ComposedChart>
          ) : (
            <ComposedChart
              data={flowData}
              margin={{ top: 12, right: 18, bottom: 34, left: 6 }}
            >
              <CartesianGrid stroke={C.grid} strokeOpacity={0.45} vertical={false} />
              <XAxis
                type="number"
                dataKey="income"
                domain={[0, flowMax]}
                ticks={flowTicks}
                tickFormatter={(v: number) => `$${v / 1000}k`}
                tick={{ fontSize: 11.5, fill: C.secondary, fontFamily: "system-ui" }}
                tickMargin={8}
                tickLine={false}
                axisLine={{ stroke: C.grid }}
              >
                <Label
                  value="Gross wages"
                  position="bottom"
                  offset={10}
                  style={{
                    fontSize: 10.5,
                    fill: C.muted,
                    fontWeight: 600,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                />
              </XAxis>
              <YAxis
                type="number"
                domain={[0, "auto"]}
                tickFormatter={(v: number) => `$${Math.round(v / 1000)}k`}
                tick={{ fontSize: 11.5, fill: C.secondary, fontFamily: "system-ui" }}
                tickMargin={6}
                tickLine={false}
                axisLine={false}
                width={48}
              />

              {/* One stacked band per program that pays anything here. Step
                  edges (benefit rules are step functions), white seams between
                  bands, flat fills, never animated. */}
              {activePrograms.map(({ key, color }) => (
                <Area
                  key={key}
                  type="stepAfter"
                  dataKey={key}
                  stackId="benefits"
                  stroke={C.surface}
                  strokeWidth={1}
                  fill={color}
                  fillOpacity={0.82}
                  dot={false}
                  activeDot={false}
                  isAnimationActive={false}
                />
              ))}

              {/* Same reserved markers so "you are here" carries across views. */}
              <ReferenceLine x={currentIncome} stroke={C.blue} strokeWidth={1.5} strokeDasharray="5 4" />
              <ReferenceLine x={offeredIncome} stroke={C.violet} strokeWidth={1.5} strokeDasharray="5 4" />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Designed legend row, hairline-framed. Cliff view maps the marker
          lines; flow view maps each program band to its value at "You now". */}
      {view === "cliff" ? (
        <div style={legendRow}>
          <MarkerKey color={C.blue} label="You now" value={currentIncome} />
          <MarkerKey color={C.violet} label="Offer" value={offeredIncome} />
          {safeExit !== null && <MarkerKey color={C.green} label="Safe exit" value={safeExit} />}
          <MarkerKey color={C.wagesRef} label="Wages only" dashed />
          {benefitsEnd !== null && benefitsEnd < 180000 && (
            <MarkerKey color={C.line} label="Benefits end" value={benefitsEnd} faded />
          )}
        </div>
      ) : (
        <div style={{ ...legendRow, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))" }}>
          {activePrograms.map(({ key, label, color }) => (
            <span
              key={key}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                fontSize: "var(--type-caption)",
                color: "var(--color-text-secondary)",
                minWidth: 0,
              }}
            >
              <span
                aria-hidden
                style={{
                  display: "inline-block",
                  width: 11,
                  height: 11,
                  borderRadius: 3,
                  backgroundColor: color,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{label}</span>
              <span
                className="tabular-nums"
                style={{ color: "var(--color-text-primary)", fontWeight: 700, marginLeft: "auto" }}
              >
                {fmtDollars(current[key as keyof typeof current] as number)}
              </span>
            </span>
          ))}
          <span
            style={{
              gridColumn: "1 / -1",
              fontSize: "11px",
              color: "var(--color-text-muted)",
              fontWeight: 500,
            }}
          >
            Values shown at your current wages ({fmtDollars(currentIncome)}/yr).
          </span>
        </div>
      )}
    </section>
  );
}

function ViewTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      style={{
        minHeight: 36,
        padding: "0 12px",
        borderRadius: "var(--radius-md)",
        border: active
          ? "1px solid var(--color-border-stone)"
          : "1px solid transparent",
        backgroundColor: active ? "var(--color-surface-white)" : "transparent",
        boxShadow: active ? "var(--elevation-card)" : "none",
        fontSize: "12.5px",
        fontWeight: active ? 700 : 600,
        color: active ? "var(--color-text-primary)" : "var(--color-text-muted)",
        cursor: "pointer",
        whiteSpace: "nowrap",
        transition: "color var(--motion-fast) var(--ease-standard)",
      }}
    >
      {children}
    </button>
  );
}

const legendRow: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  columnGap: "var(--space-lg)",
  rowGap: "var(--space-xs)",
  marginTop: "var(--space-sm)",
  paddingTop: "var(--space-sm)",
  borderTop: "1px solid var(--color-border-stone)",
};

function MarkerKey({
  color,
  label,
  value,
  dashed,
  faded,
}: {
  color: string;
  label: string;
  value?: number;
  dashed?: boolean;
  /** Swatch at the ghosted after-the-cliffs line weight (45% opacity). */
  faded?: boolean;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "var(--type-caption)",
        color: "var(--color-text-secondary)",
      }}
    >
      <span
        aria-hidden
        style={{
          display: "inline-block",
          width: 14,
          height: 0,
          borderTop: dashed ? `1.5px dashed ${color}` : `2px solid ${color}`,
          opacity: faded ? 0.45 : 1,
        }}
      />
      <span style={{ fontWeight: 600 }}>{label}</span>
      {value !== undefined && (
        <span className="tabular-nums" style={{ color: "var(--color-text-primary)", fontWeight: 700 }}>
          ${(value / 1000).toFixed(0)}k
        </span>
      )}
    </span>
  );
}
