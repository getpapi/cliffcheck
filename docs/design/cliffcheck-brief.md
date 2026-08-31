# CliffCheck — Page-Level Design Brief
> Last reviewed: task-50 — 25-04-2026

This doc captures the attention hierarchy, reading order, and empty-state expectations for the CliffCheck single-page app. It is the anchor reference for all future `frontend-design` and `design-critique` skill invocations.

For palette tokens, typography scales, and component-level styling, see [`.impeccable.md`](../../.impeccable.md).

---

## Attention Hierarchy

**1. Hero — Cliff chart**
The cliff chart is the product. Everything else exists to feed it or explain it. It must be the visually heaviest element on the page — full width, dominant vertical presence. Squint test: the chart should be the only thing visible at 80% blur.

**2. Primary action — Copy brief CTA**
The "Copy text" button in the ManagerBrief card is the moment CliffCheck stops being a calculator and becomes a tool. It must be amber-500, full-width on mobile, with adequate touch target (min 48px).

**3. Supporting — LiveSummaryStrip + ProfileForm**
The input form is the entrance; the summary strip is real-time feedback. Both are supporting elements. They should not compete with the chart visually — subdued styling, no large bold numbers.

---

## Reading Order

### Mobile (375px, primary viewport)

Top to bottom, no exceptions:

1. **Header** — App name + "Your data stays on this device" trust signal. Stone-100 bar, 56px.
2. **ProfileForm** — State, family size, adult count, current income, offered income. Full-width inputs, no side-by-side fields.
3. **LiveSummaryStrip** — Single-line stone-100 band: "Take-home today: $70,600 / After offer: $65,100 / Δ −$5,500". Updates live.
4. **CliffChart** — Hero. Full width, 2:1 aspect ratio. Chart.js canvas. 32px gap above (separates form from chart).
5. **Outcome cards** — Cliff alert (red-50) + safe exit (green-50). Stacked on mobile.
6. **ManagerBrief** — Cream (#FFF7ED) card. Copy-to-clipboard CTA full-width on mobile.

**Key constraint:** LiveSummaryStrip must sit between ProfileForm and CliffChart. Moving it below the chart breaks the reading flow (user sees the chart before context).

### Tablet / desktop (≥768px)

Same vertical order. Max content width 540px, centered. Outcome cards may sit side by side at ≥480px.

---

## Empty / Zero-Data State

When the profile is unset (first load or after clearing):

- **ProfileForm** renders with placeholder values (DEFAULTS). Income sliders show at $0 or their default position.
- **LiveSummaryStrip** shows "Enter your income to see your cliff" or equivalent neutral copy — no dollar figures until profile is populated.
- **CliffChart** renders the chart at DEFAULTS (or shows a "Enter your income to see your cliff chart" empty state). The chart should not render zeros — either show a placeholder message or render the DEFAULTS scenario.
- **Outcome cards** are hidden or show "—" until a cliff is detected.
- **ManagerBrief** is hidden until a full scenario is computed.

The empty state should feel like an invitation, not a failure. Guided, not blank.

---

## Anti-Patterns (hard NEVER — from `.impeccable.md` Section 10)

- Never nest cards inside cards (no `rounded-xl` inside `rounded-2xl`)
- Never show the same outcome data twice (cliff alert + safe exit in one location only — below chart)
- Never equal-weight typography (hero number must out-weigh input echoes and labels)
- Never cold blues in UI chrome (blue reserved for chart "current income" marker only)
- Never a disabled form field as a scope signal ("Ohio only" as a pill under h1, not a disabled input)
