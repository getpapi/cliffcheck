/**
 * lib/palette.ts — THE single source of truth for every CliffCheck colour value.
 *
 * Change a value in `CANON` below, run `npm run gen:palette`, and the token
 * surface in app/globals.css regenerates in lock-step. The generated block is
 * delimited by `/* @palette:<id> start *​/ … /* @palette:<id> end *​/` markers;
 * only the lines between markers are rewritten. Everything else in the file
 * (base styles, @theme, media queries) is hand-authored and untouched.
 *
 * CANON is CliffCheck's own token canon — the warm stone/amber + chart-zone
 * palette defined in DESIGN.md frontmatter. This is build-time generation only;
 * do NOT add a runtime theming system here. (Pattern ported from PapiUI; values
 * are CliffCheck's own — no PAPI plum.)
 *
 * CI guard: `npm run palette:check` regenerates and `git diff --exit-code`s the
 * target, so the tokens can never silently drift from this source.
 */

/**
 * The CliffCheck canon — warm stone/amber base plus the chart-zone semantics.
 * ONE definition, referenced by the token block below. This is the map you edit
 * to recolour CliffCheck. Values verified against DESIGN.md frontmatter.
 */
export const CANON = {
  // Surfaces — warm, not clinical
  warmWhite: '#FAFAF9', // page background
  surfaceWhite: '#FFFFFF', // cards, inputs
  surfaceCream: '#FFF7ED', // result cards, manager brief
  trustSurface: '#F5F5F4', // header, trust badge, summary strip
  borderStone: '#D6D3D1', // card edges, dividers, input borders (round-2: darkened from #E7E5E4 — surfaces must separate from the cream page)
  borderStrong: '#A8A29E', // structural edges: hero band, header bottom, section rules

  // Brand — the signal colour
  brandAmber: '#F59E0B', // primary buttons, active states, focus rings
  ctaHoverAmber: '#D97706', // button hover; chart transition/phase-out zones

  // Text — never pure black. Round-2 contrast fix: every text token clears
  // WCAG AA (4.5:1) on BOTH surface-white and surface-cream.
  textPrimary: '#1C1917', // headlines, labels, result values
  textSecondary: '#44403C', // descriptions, metadata, brief prose (9.4:1 on white)
  textMuted: '#57534E', // helper text, captions, axis labels (7.1:1 white, 6.4:1 cream)

  // Financial semantics — green safe, red cliff (never decorative)
  safeGreen: '#16A34A', // safe zones on chart strokes, safe exit borders
  cliffRed: '#DC2626', // cliff drop zones on chart strokes, cliff alert borders
  positiveDelta: '#15803D', // "+$X" values in text (darker green for contrast)
  negativeDelta: '#B91C1C', // "−$X" values in text (darker red for contrast)

  // Chart markers — reserved, single-use
  currentIncomeBlue: '#2563EB', // "You are here" marker — ONLY here
  offeredIncomeViolet: '#7C3AED', // "Offer" marker — ONLY here

  // Chart zone fills + line
  chartSafeFill: '#DCFCE7', // safe growth zones
  chartCliffFill: '#FEF2F2', // cliff drop zones (also cliff alert bg)
  chartTransitionFill: '#FFFBEB', // phase-out slope zones
  chartLine: '#44403C', // primary effective-income line, no smoothing

  // Card backgrounds
  cliffAlertBg: '#FEF2F2', // cliff alert card background
  safeExitBg: '#F0FDF4', // safe exit card background

  // Soft tinted borders + accents — the edges of the tinted cards
  // (round-2: darkened one step so tinted cards hold their own edge)
  cliffBorderSoft: '#FCA5A5', // border + dividers on cliff-tinted (red) cards
  safeBorderSoft: '#86EFAC', // border on safe-tinted (green) cards
  amberBadgeBg: '#FDE68A', // numbered step chips, logo mark frame
  amberBadgeText: '#92400E', // text inside amber badge chips
  chartWagesGhost: '#C9C4BE', // dashed "wages only" reference line on the chart

  // Program composition fills — the "Where the money goes" stacked chart view.
  // Categorical, one hue per program, deliberately away from the reserved
  // marker blue/violet and the semantic red/green so nothing reads as a signal.
  programSnap: '#B45309', // SNAP (food) — deep warm amber
  programMedicaid: '#0D9488', // Medicaid — teal
  programChildcare: '#DB2777', // childcare subsidy — pink
  programEitc: '#65A30D', // EITC — olive
  programAcaCsr: '#0891B2', // ACA savings (CSR) — cyan
  programSection8: '#78350F', // Section 8 — earth brown
} as const;

/**
 * One token line. `c` = a comment-only line (section header). A `[name, value]`
 * tuple emits `--name: value;`, with an optional third element as an inline
 * `/* comment *​/`.
 */
type Tok = { c: string } | [name: string, value: string] | [name: string, value: string, comment: string];

function renderBlock(tokens: Tok[], indent: string): string {
  const lines = tokens.map((t) => {
    if ('c' in t) return `${indent}/* ${t.c} */`;
    const [name, value, comment] = t;
    return `${indent}--${name}: ${value};${comment ? `  /* ${comment} */` : ''}`;
  });
  // Body sits between the start- and end-marker lines: each line carries its
  // own indent and a trailing newline lands us at the end-marker's indent.
  return `${lines.join('\n')}\n`;
}

// ── app/globals.css :root token block ────────────────────────────────────────

const globalsRoot: Tok[] = [
  { c: 'CliffCheck canon — warm stone/amber + chart-zone semantics (DESIGN.md)' },
  { c: 'Surfaces' },
  ['color-warm-white', CANON.warmWhite, 'page background'],
  ['color-surface-white', CANON.surfaceWhite, 'cards, inputs'],
  ['color-surface-cream', CANON.surfaceCream, 'result cards, manager brief'],
  ['color-trust-surface', CANON.trustSurface, 'header, trust badge, summary strip'],
  ['color-border-stone', CANON.borderStone, 'card edges, dividers, input borders'],
  ['color-border-strong', CANON.borderStrong, 'hero band, header bottom, structural rules'],
  { c: 'Brand — the signal colour' },
  ['color-brand-amber', CANON.brandAmber, 'primary buttons, active states, focus rings'],
  ['color-cta-hover-amber', CANON.ctaHoverAmber, 'button hover; chart transition zones'],
  { c: 'Text — never pure black' },
  ['color-text-primary', CANON.textPrimary],
  ['color-text-secondary', CANON.textSecondary],
  ['color-text-muted', CANON.textMuted],
  { c: 'Financial semantics — green safe, red cliff (never decorative)' },
  ['color-safe-green', CANON.safeGreen],
  ['color-cliff-red', CANON.cliffRed],
  ['color-positive-delta', CANON.positiveDelta, '"+$X" text — darker green for contrast'],
  ['color-negative-delta', CANON.negativeDelta, '"−$X" text — darker red for contrast'],
  { c: 'Chart markers — reserved, single-use' },
  ['color-current-income-blue', CANON.currentIncomeBlue, '"You are here" marker ONLY'],
  ['color-offered-income-violet', CANON.offeredIncomeViolet, '"Offer" marker ONLY'],
  { c: 'Chart zone fills + line' },
  ['color-chart-safe-fill', CANON.chartSafeFill],
  ['color-chart-cliff-fill', CANON.chartCliffFill],
  ['color-chart-transition-fill', CANON.chartTransitionFill],
  ['color-chart-line', CANON.chartLine, 'primary effective-income line, no smoothing'],
  { c: 'Card backgrounds' },
  ['color-cliff-alert-bg', CANON.cliffAlertBg],
  ['color-safe-exit-bg', CANON.safeExitBg],
  { c: 'Soft tinted borders + accents' },
  ['color-cliff-border-soft', CANON.cliffBorderSoft, 'border/dividers on cliff-tinted cards'],
  ['color-safe-border-soft', CANON.safeBorderSoft, 'border on safe-tinted cards'],
  ['color-amber-badge-bg', CANON.amberBadgeBg, 'numbered step chips, logo mark frame'],
  ['color-amber-badge-text', CANON.amberBadgeText, 'text inside amber badge chips'],
  ['color-chart-wages-ghost', CANON.chartWagesGhost, 'dashed wages-only reference line'],
  { c: 'Program composition fills — "Where the money goes" stacked view' },
  ['color-program-snap', CANON.programSnap, 'SNAP'],
  ['color-program-medicaid', CANON.programMedicaid, 'Medicaid'],
  ['color-program-childcare', CANON.programChildcare, 'childcare subsidy'],
  ['color-program-eitc', CANON.programEitc, 'EITC'],
  ['color-program-aca-csr', CANON.programAcaCsr, 'ACA savings (CSR)'],
  ['color-program-section8', CANON.programSection8, 'Section 8'],
];

/**
 * Motion + elevation tokens (non-colour). DESIGN-DIRECTION.md §8/§9 + the
 * redesigned tool depth system (DESIGN.md "Elevation"). These live in the same
 * single source so every surface pulls timing, easing, and depth from one canon.
 * Motion is calm on the tool; reduced-motion handling is enforced in component
 * CSS, not here. Elevation is a deliberate two-step system: every card rests on
 * `elevation-card` (hairline warm shadow), and the answer band alone is raised
 * on `elevation-raised` so one element dominates. Shadows are warm-tinted
 * (stone-900 base), never cold grey.
 */
const globalsMotion: Tok[] = [
  { c: 'Motion + elevation — DESIGN-DIRECTION.md §8/§9 + DESIGN.md tool depth' },
  { c: 'Motion durations' },
  ['motion-fast', '160ms', 'hover/press micro-interactions'],
  ['motion-base', '240ms', 'scroll-reveal entrances, card transitions'],
  ['motion-slow', '480ms', 'rotating hero crossfade'],
  { c: 'Easing curves' },
  ['ease-out', 'cubic-bezier(0.16, 1, 0.3, 1)', 'confident settle'],
  ['ease-standard', 'cubic-bezier(0.4, 0, 0.2, 1)'],
  { c: 'Elevation — warm-tinted, two steps: resting card, raised hero' },
  { c: 'Round-2: deepened — cards must visibly lift off the cream page' },
  ['elevation-card', '0 1px 2px rgba(28, 25, 23, 0.07), 0 3px 12px -3px rgba(28, 25, 23, 0.10)', 'every resting card'],
  ['elevation-raised', '0 2px 4px rgba(28, 25, 23, 0.08), 0 18px 44px -14px rgba(28, 25, 23, 0.30)', 'the answer band (one per page)'],
  ['elevation-float', '0 8px 30px rgba(28, 25, 23, 0.09)', 'hover lift'],
];

/**
 * Every generated region, keyed by `file → markerId → renderer`. The generator
 * (scripts/gen-palette.ts) walks this map, splices each region between its
 * markers, and writes the file back. Indent matches each file's nesting.
 */
export const REGIONS: Record<string, Record<string, () => string>> = {
  'app/globals.css': {
    root: () => renderBlock(globalsRoot, '  '),
    motion: () => renderBlock(globalsMotion, '  '),
  },
};
