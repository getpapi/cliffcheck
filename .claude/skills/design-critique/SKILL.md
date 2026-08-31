---
name: design-critique
description: >
  Run a structured design critique on any Dashboard page or component BEFORE building.
  Mandatory trigger: any task touching Dashboard UI — hub, board, strategy, roadmap, analytics,
  settings, onboarding, landing page, or any page under app/(dashboard)/ or app/(marketing)/.
  Also trigger on: "improve the UI", "redesign", "polish", "make it look better", "visual upgrade",
  "design review", "design audit", "layout fix", "UX improvement", or any task tagged Dashboard module.
  This skill produces a structured critique the builder must address before writing code.
  If you are about to edit a .tsx file that renders visible UI, use this skill first.
---

# Design Critique

You are a design critic for the PAPI dashboard. Your job is to evaluate a page or component
against PAPI's design system and compositional principles, then produce a verdict the builder
must address before writing or modifying code.

## Why This Exists

LLM builders converge on median patterns. They produce locally correct components that are
globally incoherent — every card looks fine in isolation, but the page has no hierarchy, no
reading order, no dominant element. After 200+ cycles of incremental "improve X" tasks, the
dashboard has accumulated flat layouts, equal-weight sections, and decorative elements that
don't earn their space.

This skill breaks that pattern by forcing a compositional audit before any code changes.

## When to Run

Run this critique at two points:

1. **Before building** — read the target page, run the critique, address issues in your implementation plan.
2. **After building** — re-run the critique on your changes to verify you didn't introduce new violations.

## Step 1: Gather Context

Before critiquing, you need to understand what you're looking at:

1. **Read `PRODUCT.md` and `DESIGN.md`** at the project root. These are the design system source of truth (migrated from `.impeccable.md`).
   From `PRODUCT.md`: pay special attention to Design Principles and Anti-references.
   From `DESIGN.md`: pay special attention to the Overview (layout/composition/motion), Components, and Do's and Don'ts sections.

2. **Read the target page file.** Not just the component you're editing — the entire page
   that renders it. If you're editing a card component used on the Hub, read the Hub page.
   You need the full page context to evaluate compositional hierarchy.

3. **Identify all sibling components** on the same page. List them. You'll evaluate each
   one's visual weight relative to the others.

4. **Check the page at both states:** populated (normal use) and empty/zero-data.
   Both states need heroes and hierarchy.

## Step 2: The Seven Checks

Evaluate the page against these seven compositional rules. For each check, give a verdict:
✅ Pass, ⚠️ Weak, or ❌ Fail — plus a one-line explanation.

### Check 1: Hero Element
> Every page has exactly ONE dominant visual element above the fold.

- What is the hero? Name it specifically (e.g., "Cycle ring + cycle number", "Plan task list header").
- If you can't identify one, it's ❌.
- If there are two things competing for dominance, it's ❌.
- The hero should pass the squint test: blur your eyes, the hero is still the only thing visible.

### Check 2: Reading Order
> The eye follows a clear path: hero → primary action → supporting content → tertiary.

- Trace the reading order top-to-bottom, left-to-right. Write it out explicitly.
- If sections are interchangeable (could be in any order without the user noticing), it's ⚠️.
- If the eye has nowhere to land first, it's ❌.

### Check 3: Information Density
> No more than 3 visible sections before the user must scroll or click to reveal more.

- Count the visible sections above the fold at a 1100px content width.
- If >3 sections are fully visible, it's ⚠️ or ❌ depending on severity.
- Ask: does every visible section earn its above-fold position? Would the user miss it if it were collapsed?

### Check 4: Earned Elements
> Every visible element answers a question the user has when they open this page.

- For each section/card/metric on the page, state the question it answers.
- If you can't articulate the question, the element doesn't earn its space.
- "Nice to know" elements should be behind a click, not on the surface.
- Decorative elements with no data or action purpose are ❌.

### Check 5: Typography Hierarchy
> The squint test: Display > Heading > Subheading > Body > Caption. Each level is visually distinct.

- Check that metric values are larger and bolder than their labels (Section 5, Data Label Pattern).
- Check that Manrope 700-800 is used for headings, Plus Jakarta Sans for body.
- Check that monospace is used ONLY for task IDs and code — never labels, status, timestamps.
- Check that gradient text appears ONLY on Display-role elements (cycle number, logo).
- If any two levels look the same weight/size, it's ❌.

### Check 6: Anti-Pattern Scan
> Cross-reference the Do's and Don'ts section of DESIGN.md — the named anti-patterns list.

Run through every named anti-pattern and flag any matches:
- "Everything Matters, Therefore Nothing Does" — all elements equal weight
- "The Wall of Zeros" — components built for unpopulated data
- "Monospace Everywhere" — font-mono on non-ID content
- "Gradient on Everything" — gradient text outside Display role
- "Cards in Cards" — three surface levels
- "Pages Without Heroes" — no dominant above-fold element
- "Auth as a Gate" — login before value
- "Hostile Zero States" — "No items" / "Nothing here"
- (check all 17 named patterns in Section 10)

### Check 7: Colour Compliance
> Every colour has a job. Check the palette is used correctly.

- Amber: text + thin border ONLY. Never solid fill. If amber is used as a background, it's ❌.
- Periwinkle: data/metrics. Not decorative borders.
- NavTeal: primary actions, active nav. Not random accents.
- Status colours: only on elements that represent status (done/active/blocked/backlog).
- Hardcoded hex values instead of tokens: ❌.

## Step 3: The Verdict

After the seven checks, produce a summary:

```
## Design Critique: [Page Name]

### Score: X/7 passing

| Check | Verdict | Issue |
|-------|---------|-------|
| Hero Element | ✅/⚠️/❌ | ... |
| Reading Order | ✅/⚠️/❌ | ... |
| Information Density | ✅/⚠️/❌ | ... |
| Earned Elements | ✅/⚠️/❌ | ... |
| Typography Hierarchy | ✅/⚠️/❌ | ... |
| Anti-Pattern Scan | ✅/⚠️/❌ | ... |
| Colour Compliance | ✅/⚠️/❌ | ... |

### Must-fix before building:
1. [specific, actionable fix]
2. [specific, actionable fix]

### Recommendations (non-blocking):
1. [improvement that would elevate the design]
```

## Step 4: Addressing the Critique

The builder MUST address every ❌ item before completing the task. ⚠️ items should be
addressed if the task scope allows. Document which critique items were addressed in the
build report's notes.

If a critique item conflicts with the task's handoff instructions (e.g., the handoff says
"add a new section to the hub" but the critique says density is already too high), flag
the conflict explicitly. The handoff scope may need adjustment — don't silently ignore
the critique to follow instructions that would make the page worse.

## Page-Level Design Briefs

When a page has a known design brief (attention hierarchy, primary/secondary/tertiary
content), reference it. The brief takes precedence over the builder's instinct about
what goes where.

Known page briefs should live in `docs/design/` as `{page-name}-brief.md`. If no brief
exists for the page you're critiquing, note this as a gap — the critique still applies,
but a brief would make future builds more consistent.

## The Core Principle

**Composition > Decoration.** A page with perfect tokens and flat hierarchy is worse than
a page with slightly off tokens and clear hierarchy. Hierarchy is the thing that makes
a page feel designed rather than assembled. If you remember nothing else from this skill,
remember: one hero, clear reading order, everything earns its space.
