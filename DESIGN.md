---
name: CliffCheck
description: Phone-first benefits cliff navigator that shows working-class Americans the hidden math trapping them below the poverty line — and the exact income target to escape it.
colors:
  warm-white: "#FAFAF9"
  surface-white: "#FFFFFF"
  surface-cream: "#FFF7ED"
  border-stone: "#D6D3D1"
  border-strong: "#A8A29E"
  trust-surface: "#F5F5F4"
  brand-amber: "#F59E0B"
  cta-hover-amber: "#D97706"
  text-primary: "#1C1917"
  text-secondary: "#44403C"
  text-muted: "#57534E"
  safe-green: "#16A34A"
  cliff-red: "#DC2626"
  transition-amber: "#D97706"
  current-income-blue: "#2563EB"
  offered-income-violet: "#7C3AED"
  positive-delta: "#15803D"
  negative-delta: "#B91C1C"
  chart-safe-fill: "#DCFCE7"
  chart-cliff-fill: "#FEF2F2"
  chart-transition-fill: "#FFFBEB"
  chart-line: "#44403C"
  cliff-alert-bg: "#FEF2F2"
  safe-exit-bg: "#F0FDF4"
  cliff-border-soft: "#FCA5A5"
  safe-border-soft: "#86EFAC"
  amber-badge-bg: "#FDE68A"
  amber-badge-text: "#92400E"
  chart-wages-ghost: "#C9C4BE"
  program-snap: "#B45309"
  program-medicaid: "#0D9488"
  program-childcare: "#DB2777"
  program-eitc: "#65A30D"
  program-aca-csr: "#0891B2"
  program-section8: "#78350F"
typography:
  display:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "clamp(2.5rem, 5vw, 3.5rem)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  heading:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0"
  subheading:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0"
  body:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0"
  caption:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.brand-amber}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "0 24px"
    height: "48px"
  input-field:
    backgroundColor: "{colors.warm-white}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    height: "48px"
    padding: "0 12px"
  cliff-alert-card:
    backgroundColor: "{colors.cliff-alert-bg}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "20px"
  safe-exit-card:
    backgroundColor: "{colors.safe-exit-bg}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "20px"
  manager-brief-card:
    backgroundColor: "{colors.surface-cream}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.lg}"
    padding: "24px"
  trust-pill:
    backgroundColor: "{colors.trust-surface}"
    textColor: "{colors.text-secondary}"
    height: "32px"
    rounded: "999px"
---

> Last reviewed: adhoc-ui-round2 — 10-07-2026

## Overview

CliffCheck is a phone-first tool that scales up to a designed two-pane desktop product. **Mobile is its own layout, not a stacked mirror of desktop.** At 375px the order is: answer band → income sliders → cliff chart → situation summary strip → dual-income panel → breakdown → manager brief. The interactive core (the two sliders) sits directly under the answer, and a compact **answer bar** fixes to the top edge the moment the hero's delta number scrolls off — moving a slider ALWAYS shows the number changing, with zero scrolling (the no-scroll-loop contract). The header is static on phones (visible on first paint, then it cedes the top edge to the answer bar).

At 920px+ the tool is two panes inside a shared 1288px container: the input rail on the left (sliders card first, then the collapsed situation strip, then the dual-income panel), the sticky answer band + chart on the right, with the detail band (breakdown + brief side by side) below. Chrome (header, footer) shares the same container so wide screens read as one composed page, never a floating tool in a void. The page background carries a SUSTAINED warm cream wash (deeper at the top, settling to a persistent tint) so white cards visibly lift off the page.

**Component foundation:** shadcn/ui (Radix primitives) themed to this palette via the CSS-variable bridge in `app/globals.css` (`--primary` = brand-amber, `--ring` = brand-amber, `--border` = border-stone, etc.). Zero native default form controls anywhere — native select/range/checkbox is the "unstyled amateur" tell. Light mode only.

**Spacing** uses a 4px base grid. Key gaps: within form fields 8–12px; between form fields 16px; between cards 16px; card internal padding 20–24px; between major bands 24–32px.

**Motion** is intentionally minimal — this is a financial tool for stressed people. The chart line is never animated (financial numbers are read, not watched; the mount animation also raced container resizes). Sanctioned motion: hover/press micro-interactions on interactive elements only (160ms), collapsible expand. No skeleton loaders (data is computed locally, instant). No number tickers. No entrance animations. Respect `prefers-reduced-motion` (global safety net in globals.css).

**Screen structure (top to bottom):**
1. Header (64px, `{colors.surface-white}`, 1.5px `{colors.border-strong}` bottom edge + card shadow; sticky on desktop, static on phones) — cliff-mark logotype, nav (Why this happens / How we know, hidden on phones), trust pill right
2. Page intro — H1 + one supporting line, left-aligned, compact (no marketing hero)
3. The tool — answer band (the one raised surface, verdict rule on top) + cliff chart with view toggle; income sliders card + situation summary strip + dual-income panel in the input rail (phones interleave: answer → sliders → chart → situation → dual)
4. Mobile answer bar — fixed top edge, phones only, appears when the hero delta scrolls off
5. Detail band — "Where the loss comes from" + source chips beside the manager brief (two columns on desktop, stacked on phones), tip-jar band spanning below
6. Footer (`{colors.trust-surface}`) — brand + privacy promise, Learn nav, State guides nav, provenance + disclaimer + PAPI badge bottom bar

## Colors

### Primary
- **Brand Amber** (#F59E0B): primary buttons, active states, focus rings on inputs — the brand's signal color
- **CTA Hover Amber** (#D97706): button hover state; also used for transition/phase-out zones on the cliff chart
- **Warm White** (#FAFAF9): page background — warm, not cold, not clinical
- **Surface Cream** (#FFF7ED): result cards, manager brief background — warm cream for positive/neutral surfaces

### Secondary
- **Safe Green** (#16A34A): safe income zones on chart strokes and safe exit card borders; positive delta values
- **Cliff Red** (#DC2626): cliff drop zones on chart strokes and cliff alert card borders; negative delta values
- **Current Income Blue** (#2563EB): "You are here" vertical marker on chart — ONLY use here
- **Offered Income Violet** (#7C3AED): "Offer" vertical marker on chart — ONLY use here
- **Positive Delta** (#15803D): "+$X" values in text (darker green for text contrast)
- **Negative Delta** (#B91C1C): "−$X" values in text (darker red for text contrast)

### Tertiary
- **Chart Safe Fill** (#DCFCE7): background fill for safe growth zones on cliff chart
- **Chart Cliff Fill** (#FEF2F2): background fill for cliff drop zones; also cliff alert card background
- **Chart Transition Fill** (#FFFBEB): background fill for phase-out slope zones
- **Chart Line** (#44403C): primary effective-income line on cliff chart, 2.5px, no smoothing
- **Cliff Alert Background** (#FEF2F2): cliff alert card background
- **Safe Exit Background** (#F0FDF4): safe exit card background

### Neutral
- **Surface White** (#FFFFFF): cards, input backgrounds
- **Trust Surface** (#F5F5F4): header bar, trust badge, segmented control wells
- **Border Stone** (#D6D3D1): card edges, dividers, input borders — 1.5px on tool cards (round-2 definition: surfaces must separate from the cream page)
- **Border Strong** (#A8A29E): structural edges — the answer band (2px), the header bottom (1.5px), the mobile answer bar bottom
- **Text Primary** (#1C1917): headlines, labels, result values — never pure black
- **Text Secondary** (#44403C): descriptions, metadata, manager brief prose (9.4:1 on white)
- **Text Muted** (#57534E): helper text, trust signals, captions, axis labels (7.1:1 on white, 6.4:1 on cream)

**Contrast rule (round-2):** every text token must clear WCAG AA (4.5:1) on BOTH `{colors.surface-white}` and `{colors.surface-cream}`. The old muted grey (#A8A29E) failed at 2.7:1 and now serves only as the border-strong structural edge, never as text.

### Program composition palette ("Where the money goes" view)
Categorical, one hue per program, deliberately away from the reserved marker blue/violet and the semantic red/green so no band reads as a signal:
- **SNAP** (#B45309) deep warm amber · **Medicaid** (#0D9488) teal · **Childcare** (#DB2777) pink · **EITC** (#65A30D) olive · **ACA savings** (#0891B2) cyan · **Section 8** (#78350F) earth brown

## Typography

System stack only (`system-ui, -apple-system, sans-serif`). No custom font loading — target users are on cheap Android phones with variable font rendering. Fast and readable is the priority.

**Scale:**
- **Display** (clamp 2.5–3.5rem, weight 800, line-height 1.1): effective take-home totals, cliff delta hero number. Must be the only element visible when you blur your eyes — squint test.
- **Heading** (18–22px, weight 700, line-height 1.3): card titles, form section labels
- **Subheading** (14–16px, weight 600, line-height 1.4): field labels, chart annotations, nav items
- **Body** (14–15px, weight 400, line-height 1.6): descriptions, manager brief prose — generous line-height for financial information
- **Caption** (12–13px, weight 400, line-height 1.5): helper text, trust signals, axis labels

**Rules:**
- `font-variant-numeric: tabular-nums` on all dollar values — columns must align
- Numbers representing money: minimum `font-weight: 600`
- Every metric uses a two-layer pattern: Caption/muted label above, Display/bold/colored value below — the number is ALWAYS larger and bolder than its label
- No monospace on labels, descriptions, or result values
- Minimum readable size: 12px. Touch targets: 44px minimum.

## Elevation & Definition

CliffCheck uses a deliberate two-step depth system, deepened in round-2 so cards visibly lift off the cream page (the round-1 hairlines were "almost not perceivable" — owner review). Shadows are warm-tinted (stone-900 base, defined in `lib/palette.ts` → `--elevation-*`), never cold grey.

- **Page background**: a sustained cream wash (deep at top, settling to a persistent `{colors.surface-cream}`/warm-white mix) — never plain near-white
- **Resting cards** (`{colors.surface-white}`, **1.5px** `{colors.border-stone}` border, `{rounded.xl}`, `--elevation-card`): sliders card, situation strip, chart card, dual-income panel, breakdown, brief, tip band
- **The answer band** (**2px** `{colors.border-strong}` border, `--elevation-raised`, plus a 5px flat **verdict rule** across the top edge in the delta colour — negative-delta red when the offer costs, positive-delta green when it gains): the ONE raised surface per page. The colour is the verdict, never decoration.
- **Tinted artifacts**: manager brief + tip band on `{colors.surface-cream}`; breakdown on `{colors.cliff-alert-bg}` with 1.5px `{colors.cliff-border-soft}` border (or safe-exit tint when there is no cliff)
- **Chrome**: header on `{colors.surface-white}` with a 1.5px `{colors.border-strong}` bottom edge + `--elevation-card`; footer on `{colors.trust-surface}`
- **Mobile answer bar**: `{colors.surface-white}`, 1.5px `{colors.border-strong}` bottom edge, `--elevation-raised` (it temporarily IS the answer band while the hero is off screen)

Do NOT nest cards inside cards. Maximum two surface levels visible at any time, and exactly one raised surface per page (the answer band, or its mobile bar stand-in).

## Components

### Input Field (shadcn/ui)
All controls are shadcn/ui components themed to this palette — never native defaults. Full width on mobile. 48px tall (`h-12`), 16px text (no iOS zoom-on-focus). `{colors.surface-white}` background, `{colors.border-stone}` border, `{rounded.lg}`. Label (13px, `{colors.text-secondary}`, weight 600) sits above the input — never placeholder-only. Helper text (12px, `{colors.text-muted}`) below. Focus ring: amber (`--ring`) — never blue.

- **Select**: shadcn Select, 48px trigger, chevron icon, white popover with amber-tinted active item
- **Slider** (income): 8px stone track, amber range, 22px white thumb with 2px amber border and hidden 44px hit area
- **Checkbox**: 20px, amber fill when checked
- **Switch**: dual-income toggle, amber when on
- **Segmented control** (adults): joined two-cell group on `{colors.trust-surface}`, active cell is white with hairline border + shadow, weight 700
- **Collapsible** (advanced levers): chevron rotates 90° when open

### Primary Button
`{colors.brand-amber}` background, `{colors.text-primary}` text (weight 700), 48px tall, `{rounded.lg}`, full-width on mobile. Hover: `{colors.cta-hover-amber}`. No cold blue buttons anywhere.

### Cliff Alert Card
`{colors.cliff-alert-bg}` background, 1px red-200 border, `{rounded.lg}`, 20px padding. Icon: warning symbol in `{colors.cliff-red}`. Headline (16px, `{colors.text-primary}`, weight 700): "Taking this raise costs you −$8,400/yr". Supporting line (14px, `{colors.text-secondary}`): itemized benefit losses.

### Safe Exit Card
`{colors.safe-exit-bg}` background, 1px green-200 border, `{rounded.lg}`, 20px padding. Icon: arrow in `{colors.safe-green}`. Headline (16px, `{colors.text-primary}`, weight 700): "Safe exit: $82,000/yr". Supporting line (14px, `{colors.text-secondary}`): plain-English target statement.

### Manager Brief Card
`{colors.surface-cream}` background, 1px `{colors.border-stone}` border, `{rounded.lg}`, 24px padding. Body: 14–15px, `{colors.text-secondary}`, line-height 1.6. CTA: "Copy brief" button — amber-500 bg, stone-900 text, full-width on mobile. Never ship an empty brief — if no cliff exists, output "No cliff detected. This raise improves your total value."

### Trust Pill (header)
The privacy promise lives in the chrome, not a separate strip (a full-width grey band reads as debug output). A rounded pill in the header, visible on first paint: `{colors.trust-surface}` fill, 1px `{colors.border-stone}` border, 32px tall, shield glyph in `{colors.cta-hover-amber}`, caption text (12px, weight 600, `{colors.text-secondary}`): "Your data stays on this device" (shortened to "Private, on-device" under 600px). On phones the header is static — the pill shows on first paint, then the header scrolls away so the mobile answer bar owns the top edge. The footer brand column repeats the full promise.

### Situation Summary Strip
The set-once facts (state, family size, adults, benefit flags, 401(k) match, advanced levers) live behind a compact collapsed strip: uppercase caption label ("YOUR SITUATION"), bold summary line ("Ohio · 4 people · 2 adults"), a muted second line naming any hidden flags (the collapsed strip must tell the truth about everything it hides), and an amber "Edit"/"Done" affordance with a rotating chevron. Expands in place to the full form. Forced open (affordance hidden) when the selected state isn't covered. Resting-card shell, 64px+ trigger.

### Mobile Answer Bar
Phones only (<920px), fixed to the top edge, `--elevation-raised`, 1.5px `{colors.border-strong}` bottom edge. Slides in (transform/opacity, `--motion-base`, reduced-motion safe) the moment ANY of the hero's delta number is clipped off the top — the delta must be readable at every scroll position. Contents: uppercase caption + the live delta (22px/800, delta colour) left; safe exit (or "after the offer" when no cliff) right. Purely a visual echo of the hero: `aria-hidden`, never a second source of truth.

### Cliff Chart (two views, segmented toggle)
Recharts ComposedChart inside a resting card. 4:3 aspect under 560px, 16:10 to 920px, then a viewport-fit height (clamp 320–500px) so the answer band + chart share one desktop viewport. A segmented control (trust-surface well, white active cell) toggles two views; **"The cliff" is always the default**, state is local UI state only.

**View 1 — The cliff.** X-axis: $0–$200k labeled every $40k (11.5px, `{colors.text-secondary}`, tickMargin 8, uppercase "Gross wages" caption below). Y-axis: effective take-home in dollars. Primary line: `{colors.chart-line}` at 2.5px as a filled step area (fill at 9%), no smoothing, NEVER animated. Wages-only ghost: dashed `{colors.chart-wages-ghost}` diagonal. Zone fills chapter the axis ONLY while benefits exist (safe ~0.45, cliff band 1, transition ~0.55 opacity, ending at the last benefit dollar); past that point the plot goes quiet — no zone fill and the take-home line thins to 1.5px at 45% opacity — so the flat wages-only right half never dilutes the cliff story. Markers: current income (vertical dashed `{colors.current-income-blue}`), offered income (`{colors.offered-income-violet}`), safe exit (`{colors.safe-green}`, only when a cliff exists). Steepest drop gets one white pill callout ("↓ −$X", `{colors.cliff-red}` text, `{colors.cliff-border-soft}` border) in the top margin — drop amount only, no cause phrase. Legend is a hairline-framed marker key BELOW the chart: line swatch + label + bold tabular value per marker, including a faded "Benefits end $Xk" entry when benefits die before $180k.

**View 2 — Where the money goes.** The same engine points as stacked step areas, one band per program that pays anything in the scenario (program palette above), white 1px seams, 0.82 fill opacity, never animated. The x-axis ZOOMS to where the money is: rounded up to the next $20k past the last benefit dollar (never cropping the income markers, floor $80k) — benefits are dead past ~$100k and a full $200k axis would squash every band. Current/offer markers carry across. Legend: swatch chip + program name + bold tabular value at current wages, with a muted caption naming the income the values are read at. NO new money math — every number is an engine field off `CliffPoint`.

## Do's and Don'ts

### Do's
- **Show the number first, explain second.** The cliff delta and safe exit are the heroes — every other element exists to support them.
- **Update results live as the user types.** No submit button, no loading state on input change. Data is computed locally; answers are instant.
- **Show the trust pill on first paint.** "Your data stays on this device" lives in the header — sticky on desktop, first-paint-visible on phones (where the answer bar then owns the top edge).
- **Keep the answer visible while inputs move.** Desktop: sticky output pane. Phones: the fixed answer bar appears whenever the hero delta is clipped. A slider with no visible number changing is a broken loop.
- **Use concrete dollars over percentages.** "$4,200 in lost SNAP" is always more powerful than "34% benefit reduction."
- **Keep cliff lines sharp.** Benefit cliffs are step functions — draw them accurately with no bezier smoothing.
- **Name the system.** Copy says "this raise triggers a cliff" not "you earn too much."
- **Show monthly figures in parentheses** when displaying annual amounts for context.
- **Use `font-variant-numeric: tabular-nums`** on all dollar values.
- **Bold all money amounts** (minimum weight 600).
- **Include the cliff alert and safe exit cards** below every chart — a chart without context has failed.

### Don'ts
- **Never use cold blue** (`#3B82F6`, `#2563EB`) anywhere except the "current income" chart marker. Blue is reserved.
- **Never use a submit/calculate button.** The form updates live.
- **Never show a percentage when a dollar amount is available.**
- **Never smooth the cliff chart** with bezier curves.
- **Never use amber as a solid large-area fill.** Amber is for buttons and thin UI accents only. Use cream (`{colors.surface-cream}`) for card fills.
- **Never nest cards inside cards.** Two surface levels maximum.
- **Never build multi-column layout at 375px.** Single column, full-width.
- **Never place the trust signal below the fold.** It must be visible on first paint.
- **Never let the wages-only right half of the chart compete with the cliff.** Zones and full line weight stop at the last benefit dollar; the composition view zooms its axis to where the money is.
- **Never use the program composition colours outside the "Where the money goes" bands and their legend chips.**
- **Never ship a chart without the cliff alert and safe exit cards below it.**
- **Never use `font-mono` on labels, descriptions, or result values.**
- **Never use green or red for decorative purposes.** Both colors carry specific financial meaning.
- **Never omit the `/yr` label** on annual dollar amounts.
- **Never use pure black (`#000`).** `{colors.text-primary}` (#1C1917) is the maximum.
- **Never build a screen that requires explanation before it's understood.**
- **Never add user accounts, login prompts, or email capture** — ever.
- **Never use placeholder-only inputs** for financial data fields.
