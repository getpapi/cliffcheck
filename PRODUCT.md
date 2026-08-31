# Product

## Register
product

## Users
Working-class Americans earning $40k–$80k who are making decisions about income raises that could cost them thousands in lost benefits. They are on their phones, not financial experts, and have likely been told "just take the promotion" by someone who doesn't understand the math. Primary: warehouse workers, retail staff, gig workers, single parents navigating SNAP, Medicaid, Section 8, and childcare subsidies. Secondary: social workers, HR professionals, and benefits counselors helping clients understand cliff math and negotiate with employers.

Three emotional states: anxious and confused ("I was offered a promotion — should I take it?"); shocked then curious ("I just saw I'm worse off than I thought"); nervous and wanting backup ("I need to explain this to my manager"). The UI must serve all three without lecturing or pitying.

## Product Purpose
CliffCheck reveals the hidden math trapping working-class Americans in benefits cliffs. A $4,000 raise can cost $24,000+ in lost benefits — the math is deliberately hidden by fragmented benefit systems and no consumer-facing tool existed to show it. CliffCheck shows the number, shows the path around it, and gives users the manager brief to act on it.

Core flow: user enters state, family size, adult count, current income, and offered income. Real-time calculation produces an interactive cliff chart showing exactly where effective take-home drops, a safe exit income target ("clear every cliff at $82k"), and a copy-to-clipboard manager brief for salary negotiation. Data stays on-device (TinyBase + localStorage) — privacy is a trust feature, not a constraint.

Success looks like: a warehouse worker sees their cliff chart, understands in 5 seconds that a $26k raise makes them $5.5k poorer, and leaves with a concrete income target and a manager brief they can actually use.

## Brand Personality
**Three words:** Honest. Warm. Actionable.

Voice: a knowledgeable friend who knows the math and tells you straight — not a government portal, not a charity product, not a financial planning app. Empowering, not pitying. Users are smart people being screwed by a hidden system; the tool respects their intelligence.

**Plain first, precise second.** "You're $12,000 worse off" before "Net effective income decreases by $12,000." Name the system, not the person — "This raise triggers a cliff" not "You earn too much for benefits." Agency-first framing: "Here's your path to $82k" not "You are ineligible above this threshold." Show, don't lecture — let the chart explain, copy annotates.

**Approved words:** income, benefits, cliff, take-home, raise, offer, target, safe exit, family size, effective value.

**Banned words:** threshold, eligibility, phase-out, net effective income, benefits schedule, FPL, MAGI, subsidy cliff (use "cliff"), ineligible (use "you're above the limit for"), calculation engine, TinyBase, localStorage, state module.

**Number formatting:** all dollar amounts as integers ($12,400 not $12,400.00 or $12.4k); always show annual, monthly in parentheses for context; negative impact as −$8,400 (en-dash, red); positive as +$8,400 (green).

**The "Oh Shit" standard:** every key output (cliff chart, manager brief) must produce a visible reaction in someone seeing it for the first time. A judge must be able to scan the chart and immediately understand "this person is $12,000 worse off taking the raise" — without reading a legend first.

## Anti-references
- Government form: dense tables, official blues, legalese labels, submit buttons
- Financial planning app: projections, investment advice, account management
- Charity product: soft apologetic tone that treats users as victims
- Data dashboard: reporting surface with multiple KPIs competing for attention
- Generic SaaS: purple gradient hero sections, "unlock your potential" copy, cold Tailwind blue CTAs
- "Pity design": language or visual framing that implies users need help rather than that the system is broken

## Design Principles
1. **The number is the product.** The cliff chart and effective take-home delta are the entire reason this exists. Everything else — form, brief, footer — exists to get the user to the number and act on it.
2. **Warm, not clinical.** Every visual and copy choice should feel like a knowledgeable friend, not a government office. If it looks grey or cold, it's wrong.
3. **Instant answers, no submit.** Results update live as the user types. There is no calculate button. The tool does not make the user ask for the answer.
4. **Privacy is a feature.** Local-first architecture is a trust signal for users who are justifiably wary of sharing financial data. Never compromise it. Never prompt for login or email.
5. **Concrete, not abstract.** Dollar amounts over percentages. Annual figures with monthly context. Impact framing ("costs you $8,400/yr") over raw values ("$58,400").
6. **Actionable, not informational.** Show the cliff, then show the path around it. A tool that only shows the problem without a way forward has failed.

## Accessibility & Inclusion
WCAG AA target. Minimum touch target 44px — critical for primary mobile audience on budget Android devices. Minimum readable font size 12px. `font-variant-numeric: tabular-nums` on all dollar values for column alignment. No system font loading — use system-ui / -apple-system stack for performance and reliability on variable-rendering Android phones. `prefers-reduced-motion`: chart redraws must respect it (skip 200ms transition, draw instantly). Light mode only — no dark mode toggle (design is intentionally warm-light). No color as the sole channel for meaning: cliff zones use both color fill and labeled marker lines. Primary viewport 375px (iPhone SE / budget Android); desktop scales to a two-pane tool inside a 1288px container (see DESIGN.md Overview).
