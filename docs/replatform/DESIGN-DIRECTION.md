# CliffCheck — Design Direction (Full Product Redesign)
> Last reviewed: task-115 — 26-06-2026

> **Status:** Binding art-direction spec for the Cycle 16 redesign. Governs task-116 (chrome/tokens), task-117 (landing), task-118 (calculator). This doc tells builders HOW to apply the system — the token *values* live in [DESIGN.md](../../DESIGN.md), the voice/anti-references in [PRODUCT.md](../../PRODUCT.md), the mission in the project memory. Read all three before building. When this doc and DESIGN.md appear to conflict on motion, see §2 — the resolution is intentional.

---

## 1. The brief in one line

Make CliffCheck look and feel several leagues better — a tool so good people ask "who built this?" — while staying **warm, honest, and trustworthy for stressed working people on cheap phones.** The quality itself is the advertisement.

The mission is the soul: **a raise should never make you poorer.** The system hides the math behind cliffs that only tax consultants and jargon-filled state docs explain. CliffCheck drags that math into the light, for free. Tone: a sharp, generous friend who's furious *at the system* on your behalf — never pitying, never lecturing. The villain is the rigged structure, not the user.

---

## 2. The core decision: two surfaces, two motion registers

CliffCheck v1's DESIGN.md mandates *minimal* motion ("no entrance animations", "no number tickers"). That rule was written for a single-screen calculator and it is **still correct for the calculator.** But the redesign adds a **marketing surface** (landing, per-state pages) where premium, motionsites.ai-grade motion is exactly right. Resolve the tension by surface:

| | **Marketing surface** (landing, per-state) | **Tool surface** (the calculator) |
|---|---|---|
| Goal | Make you feel the injustice, then act | Give you the truth, accurately, instantly |
| Motion | **Premium & narrative** — scroll-reveals, staggered entrances, the rotating hero, parallax depth, sticky transitions | **Calm & instant** — live chart redraw ≤200ms linear, no tickers, no entrance anims on result cards |
| Layout | Full-bleed sections, asymmetric composition, up to ~1100px content | Single column, ≤540px, centred (DESIGN.md) |
| Numbers | May animate *into view* on scroll (reveal, not count-up) | Never animate — read accurately (the "Oh Shit" number is static and instant) |

**Rule:** motion serves narrative on the way *to* the truth; once the user is looking at their own money, motion gets out of the way. A builder is never allowed to add a count-up ticker to a real result value — that violates DESIGN.md and the trust promise.

---

## 3. What we take from motionsites.ai (and what we don't)

**Take (principles):**
- **Motion drives narrative, never decorates.** Every animation earns its place by advancing the story (the cliff, the loss, the way out).
- **Scroll as a storytelling timeline.** Sections reveal in staggered sequence as the user descends — entrance via opacity + transform (translateY ~16–24px), not flashy spins.
- **Confident, large display type over generous whitespace.** Let big numbers and short lines breathe.
- **Layered depth.** Foreground content floats over softer background layers; subtle parallax gives dimensionality.
- **Restraint between beats.** Negative space as a pause; don't animate everything at once.
- **Micro-interactions that feel responsive** — purposeful hover/press feedback on interactive elements.

**Do NOT take:** motionsites' **dark backgrounds, neon/high-saturation accents, glassmorphism-heavy, cursor-follow gimmicks.** CliffCheck is **warm-light, light-mode only** (DESIGN.md). Our premium feel comes from *whitespace + type confidence + warm depth + earned motion* — not from dark/neon contrast. If a section feels like a generic dark SaaS hero, it's wrong (PRODUCT.md anti-reference).

---

## 4. Art direction — "premium warm"

The aesthetic is **editorial warmth**: think a beautifully typeset long-read with a data tool embedded — paper-warm backgrounds, ink-dark text, amber as the single confident accent, financial reds/greens reserved for meaning. Warm, human, a little angry on the user's behalf. Calm where it counts.

- **Backgrounds:** `warm-white #FAFAF9` base; alternate sections in `surface-cream #FFF7ED` or `trust-surface #F5F5F4` to segment the narrative without hard lines. No pure white pages; no dark sections.
- **Accent:** `brand-amber #F59E0B` is the *signal* — used sparingly for CTAs, key emphasis, the live marker. Never a large fill (DESIGN.md). Amber is a highlighter, not a wall.
- **The data colours** (`safe-green`, `cliff-red`, the blue/violet markers) keep their reserved financial meaning everywhere — never decorative.
- **Texture:** warmth from colour + soft depth, not heavy shadow. One restrained elevation step (see §8).

---

## 5. Layout & grid

**Marketing:** Vertical scroll narrative. Content column ≤ ~720px for prose/headlines, with **full-bleed section backgrounds** behind it; feature/proof blocks may widen to ~1100px and use **asymmetric two-column** compositions (text left / visual right, alternating) that collapse to single-column on mobile. Mobile-first 375px — every section must read top-to-bottom on a phone first, desktop is the enhancement.

**Tool:** Unchanged from DESIGN.md — single column, ≤540px centred, form → live summary → chart → result cards → manager brief. The tool is a focused instrument; do not widen or multi-column it at 375px.

**Grid:** 4px base (DESIGN.md spacing scale). Section rhythm on marketing is larger than the tool: 64–96px between major marketing sections (vs 40px inside the tool) to give the long-read room to breathe.

---

## 6. Typography

System stack only (`system-ui` — DESIGN.md performance rule; no web fonts). Premium feel comes from *scale, weight, and rhythm*, not a fancy typeface.

- **Marketing display / hero:** extend the DESIGN.md Display token upward — `clamp(2.75rem, 6vw, 5rem)`, weight 800, line-height 1.05, letter-spacing −0.03em. Short lines (≤ ~12 words). The hero stat number is the largest thing on the page.
- **Section headlines:** `clamp(1.75rem, 3vw, 2.75rem)`, weight 700.
- **Lead/intro paragraphs:** 18–20px, weight 400, line-height 1.6, `text-secondary` — generous, readable, editorial.
- **Body / tool:** keep DESIGN.md scale (heading 18px/700, body 14–15px/1.6, caption 12px).
- **Money everywhere:** `font-variant-numeric: tabular-nums`, weight ≥600, integer dollars, `/yr` label (monthly in parens). The two-layer pattern (muted label above, big bold value below) holds on both surfaces.

---

## 7. Colour application rules

- **Amber:** CTAs, the single key emphasis per viewport, the "live"/active marker. Never a large background fill, never more than one dominant amber moment per screen.
- **Cliff-red / safe-green:** ONLY for financial meaning (the loss, the danger zone; the safe path, the gain). Never decorative. The hero's "cost you $Z" uses `negative-delta #B91C1C`; the safe-exit/"way out" beats use `safe-green`/`positive-delta`.
- **Blue / violet:** reserved exclusively for the chart's "You now" / "Offer" markers (DESIGN.md). Never appear in marketing chrome or CTAs.
- **Section backgrounds:** rotate warm-white / cream / trust-surface to chapter the narrative. The inequality/0.1% section may go slightly heavier (cream → a deeper warm) to feel weightier — still warm, never dark.
- **Borders/dividers:** `border-stone #E7E5E4`, hairline. Prefer whitespace and background shifts over rules.

---

## 8. Elevation & depth

DESIGN.md tool rule: flat, one card level, no drop shadows. **Extend gently for marketing only:**
- Add a **soft warm shadow token** (low-opacity, warm-tinted, large blur — e.g. `0 8px 30px rgba(28,25,23,0.06)`) for floating feature cards / the hero's calculator preview on the marketing surface.
- Allow **subtle parallax layering** (background art drifts slower than foreground) for depth.
- **Tool surface stays flat** — no new shadows on inputs/result cards; warmth via colour (DESIGN.md). Max two surface levels there.
- Define these as tokens in `lib/palette.ts` (task-116): `--elevation-card`, `--elevation-float`, plus motion tokens (§9). Keep the generator + `palette:check` green.

---

## 9. Motion language (tokens + rules)

Define as tokens in task-116 so every surface pulls from one source. **All motion must respect `prefers-reduced-motion`: reduce to instant (opacity only, no transform) or none.**

**Tokens (suggested):**
- `--motion-fast: 160ms`, `--motion-base: 240ms`, `--motion-slow: 480ms`
- `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)` (confident settle), `--ease-standard: cubic-bezier(0.4, 0, 0.2, 1)`
- Stagger step: 60–80ms between siblings.

**Marketing motion (premium):**
- **Scroll-reveal:** sections/elements enter with opacity 0→1 + translateY 20px→0 over `--motion-base`, `--ease-out`, staggered. Use `IntersectionObserver`; once revealed, stay (no re-animate on scroll-up).
- **Rotating hero:** the headline scenario crossfades between states/scenarios (opacity + slight translateY), `--motion-slow`, holding each ~3.5s; pauses on hover/focus; under reduced-motion it swaps instantly (no crossfade) and may pause entirely.
- **Parallax:** background layers drift ≤ ~40px slower than scroll. Subtle. Off under reduced-motion.
- **Hover/press:** interactive cards/buttons lift slightly (translateY −2px) + shadow deepen on hover; press scales 0.98. `--motion-fast`.

**Tool motion (calm — DESIGN.md governs):**
- Chart redraw on input change ≤200ms linear; instant under reduced-motion. No entrance animation on result cards. **No count-up/ticker on any real money value, ever.** Live summary updates on keypress.

---

## 10. Spacing rhythm

4px base. Marketing: section padding 64–96px vertical (mobile 48–64px); element groups 16–24px; lead paragraph to headline 16px. Tool: keep DESIGN.md exact rhythm (form-to-chart 32px, chart-to-cards 24px, etc.). Generous is the default on marketing; tight and efficient on the tool.

---

## 11. The landing narrative (section by section)

A scroll-driven argument that moves from *gut punch* → *understanding* → *injustice* → *proof* → *act*. Each section names its job, its colour, its motion. Copy follows PRODUCT.md voice (approved/banned words; name the system, not the person).

1. **Hero — the gut punch.** The rotating engine-driven line, huge: *"A $26,000 raise at $44,000 in Ohio would leave you $9,754 poorer."* The loss number in `negative-delta`, enormous. Sub-line: one plain sentence naming the system ("Benefits cliffs are hidden income traps. Most people never see them coming."). Primary CTA: **"Check your own number →"** (amber) into the tool. Background: warm-white; a soft, restrained background motif (an abstract cliff-curve line drawn in `chart-line`/amber, subtly parallaxed). Motion: hero text settles in on load; the scenario rotates.
2. **The hidden math — show the cliff.** A compact, real cliff-chart visual (engine-driven) with the drop annotated. "It's not a glitch. Earn $4,000 more, lose $24,000 in benefits. The math is real — and deliberately hard to find." Asymmetric: chart one side, plain-English explainer the other. Motion: chart reveals on scroll, drop emphasised.
3. **Why this happens — the mechanism.** Short, calm explainer: benefits phase out on overlapping schedules (SNAP, Medicaid, childcare, ACA, EITC) so several cliffs stack in the same narrow income band. Name it plainly, no jargon (banned words list). This is the "knowledgeable friend explains it" beat. Cream background.
4. **The injustice — the inequality framing.** The mission's anger, earned: while the system traps working people in a few thousand dollars of benefits, the wealth at the very top compounds untouched. Reference the structural unfairness (the 0.1% framing) — *about the system, never pitying the user.* Weightier warm background; confident large type; sparing motion (let the words land). This is the emotional core — handle with restraint and dignity, not melodrama.
5. **Proof — it's real and people care.** Social proof: CliffCheck went front-page on r/ohio (300+ shares from one post). Quote/era-appropriate testimonial energy if available; otherwise the traction stat, stated plainly. Builds trust before the ask.
6. **The data is real — methodology teaser.** "Every number here comes straight from government sources — USDA, IRS, HUD, Medicaid. No third-party guesses." Link to /methodology (built later — link can be a placeholder/anchor this cycle). This is the credibility close + a quiet differentiator.
7. **Act — final CTA.** Restate the promise ("Find your safe number in 60 seconds, free, private — your data never leaves your phone.") + big amber CTA into the tool. Quiet "Built with PAPI" lives in the footer (chrome), not here.

(Per-state pages reuse this skeleton with state-specific hero scenarios — a later cycle; design the sections to parameterise by state.)

---

## 12. Component inventory (visual intent)

- **Header (chrome):** minimal — wordmark left, a single quiet link to the tool. Trust line nearby. No nav clutter.
- **Trust badge (chrome):** "Your data stays on this device — nothing is sent anywhere." Always visible (DESIGN.md). On marketing it can be a quiet inline reassurance near CTAs; on the tool it's the persistent strip.
- **Footer (chrome):** muted; state-coverage note; quiet **"Built with PAPI"** (→ getpapi.ai) + source-on-GitHub. CliffCheck's voice — no plum, no PAPI chrome.
- **Rotating hero (`components/hero`):** big stat line, scenario crossfade, CTA. Engine-driven (§13).
- **Section block (`components/landing`):** headline + lead + optional visual; reveal-on-scroll; alternating asymmetric layout.
- **Cliff-chart visual (marketing):** a presentational, engine-fed mini cliff chart for the "hidden math" section (can reuse the tool's chart component in a static/annotated mode).
- **Calculator components (`components/calculator`):** see §13 — designed to the same bar.
- **CTA button:** amber, weight 700, 48px, generous tap target, hover-lift + press-scale (§9).

---

## 13. The calculator design bar (NOT a utility)

The calculator is the product. It must feel as crafted as the landing — but *calm*. Hold it to DESIGN.md exactly, elevated in finish:

- **Input form:** labelled inputs (never placeholder-only), 48px, amber focus ring (never blue), live update, no submit button. Advanced levers in a clean collapsible. Beautiful spacing, not a government form.
- **Cliff chart (the "Oh Shit" payload):** Recharts, `type="stepAfter"` — **no bezier smoothing** (cliffs are step functions). Zone fills (safe/cliff/transition), the `chart-line` effective-income line at 2.5px, dashed markers "You now" (blue) / "Offer" (violet) / "Safe exit" (green) with inline labels — no internal legend. This single visual must make a stranger gasp in 5 seconds. Polish the axis type, the annotations, the zone fills until it's genuinely beautiful — then stop (no decoration that obscures the truth).
- **Result cards:** cliff-alert (red-bordered, the loss as a big `negative-delta` number) + safe-exit (green-bordered, the target). Two-layer label/number pattern. Never ship empty (DESIGN.md fallback copy).
- **Manager brief:** cream artifact card, copy-to-clipboard, real negotiation-ready sentences.
- **Source chips:** quiet caption chips beside benefit lines ("SNAP · USDA ↗") — stub provenance OK this cycle.
- **Live summary strip:** single rolling line, trust-surface bg.
- **No motion on result numbers.** Instant, accurate, calm.

---

## 14. The "Oh Shit" standard (the bar for done)

Every key output — the hero stat, the cliff chart, the loss number — must make a first-time viewer react *before reading a legend.* If a section needs a paragraph to be understood, it has failed (PRODUCT.md). The redesign succeeds when: a warehouse worker lands on the page, feels the gut punch in the hero, scrolls the argument and gets angry *at the system*, opens the tool, sees their own cliff in 5 seconds, and leaves with a number and a manager brief. And someone else sees it and thinks: *who made this?*

---

## 15. Deltas from DESIGN.md (what's new, so builders don't think it's a conflict)

DESIGN.md remains authoritative for the **tool** and all token *values*. This doc ADDS, for the **marketing surface only**:
- Premium scroll/entrance/parallax motion + a rotating hero (DESIGN.md's "no entrance animations" applies to the *tool*, not the landing).
- A larger display type scale, wider/asymmetric layouts, larger section rhythm.
- One soft warm elevation step + parallax depth (tool stays flat).

Everything else — warm-light only, amber-as-accent-not-fill, reserved blue/green/red, system fonts, tabular-nums, no pure black, no login/email-capture, name-the-system voice, accessibility (44px targets, WCAG AA, reduced-motion) — holds on **both** surfaces, unchanged.
</content>
