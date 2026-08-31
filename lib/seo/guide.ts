/**
 * lib/seo/guide.ts — the typed topic registry + engine fuel for Template C, the
 * national glossary at /guide/[topic].
 *
 * These are DEFINITIONAL, top-of-funnel pages ("what is a benefits cliff", "will a
 * raise make me poorer"). Unlike the state hub (Template A) and program spoke
 * (Template B), a topic is NOT scoped to a state — it is national. But every topic
 * still earns its page the same way the rest of the cluster does: it leads with a
 * live, engine-worked example so the definition is proven with a real number, not
 * asserted. That example is the SAME Ohio canonical scenario the /why page and the
 * Ohio hub quote (heroScenario → deriveResults), so no figure can drift between
 * the glossary, the narrative page, and the state hubs.
 *
 * Anti-thin discipline (mirrors states.ts): a topic is only minted if it carries
 * real definitional substance AND a valid engine example. The registry below is
 * hand-curated to that bar — every entry has a plain-English definition, a worked
 * example anchored to the engine, and question-phrased FAQ. There is no hollow
 * topic. `resolveTopic` is the single gate both generateStaticParams and the page
 * component call, so an unknown slug can never render.
 *
 * Pure + framework-free (no React, no next/*) so the page, its metadata, and any
 * future OG route all read the SAME engine-derived model from one place. Consumes
 * the engine's public API only via heroScenario/deriveResults — it never edits the
 * engine, and no dollar figure is hand-typed anywhere in this file.
 */
import {
  stateFromSlug,
  heroScenario,
  latestRetrieved,
  type HeroScenario,
} from "@/lib/seo/states";
import { getStateSources } from "@/lib/engine";
import type { AnswerSpan } from "@/components/seo/AnswerBlock";
import type { FaqEntry } from "@/lib/seo/jsonld";

/* ── The canonical example every topic is proven with ─────────────────────────
   Ohio is CliffCheck's canonical demo household (a family of 4). heroScenario
   scans the engine's own 121-point cliff curve for the steepest raise-cliff and
   returns the real loss, raise, current/offered income, and safe exit. Every
   worked-example number on every topic flows from this object, computed at build
   time — identical to the figure the Ohio hub and /why show. */
function ohioExample(): HeroScenario {
  const oh = stateFromSlug("ohio");
  // Ohio is a supported state in the engine registry; guard defensively so a
  // future registry change fails the build loudly rather than shipping a blank.
  if (!oh) throw new Error("/guide: Ohio example unavailable from the engine.");
  return heroScenario(oh);
}

/** Local integer-dollar formatter (kept here so guide.ts stays self-contained;
 *  mirrors components/calculator/derive.ts fmtDollars). No cents, en-US grouping. */
function fmtMoney(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

/* ── A topic definition ───────────────────────────────────────────────────────
   `body` holds the AUTHORED definitional substance (plain-English, PRODUCT.md
   voice, no banned jargon, no em-dashes). Everything financial is a FUNCTION of
   the engine-derived example `ex`, never a literal, so the copy can never drift
   from the engine. */
export interface GuideTopicDef {
  /** URL slug segment, e.g. "what-is-a-benefits-cliff". */
  slug: string;
  /** Small eyebrow so the cluster reads as a set ("The basics", "Your situation"). */
  eyebrow: string;
  /** H1 — the search question, phrased verbatim as the query. */
  question: string;
  /** ≤60-char metadata title (keyword-first). */
  metaTitle: string;
  /** Short in-page kicker under the H1 (one plain sentence, no number). */
  kicker: string;
  /** The citable 40-60 word short answer, as styled spans (built from `ex`). */
  answerSpans: (ex: HeroScenario) => AnswerSpan[];
  /** Plain-language definition paragraphs (the substance). Authored, no numbers. */
  definition: string[];
  /** The one-line proof headline shown above the worked-example stat. */
  exampleLead: (ex: HeroScenario) => string;
  /** Body paragraphs after the worked example (context / nuance). Authored. */
  afterExample: string[];
  /** FAQ entries (question-phrased; answers may fold in engine figures via `ex`). */
  faq: (ex: HeroScenario) => FaqEntry[];
  /** ≤160-char meta description (built from `ex`, carries the real number). */
  metaDescription: (ex: HeroScenario) => string;
}

/* ── P1 topic set ─────────────────────────────────────────────────────────────
   Four definitional/question topics, each with real substance + a valid engine
   example. Ordered by search priority. This is the whole set — we deliberately do
   NOT mint a long tail of thin synonyms. */
export const GUIDE_TOPICS: GuideTopicDef[] = [
  {
    slug: "what-is-a-benefits-cliff",
    eyebrow: "The basics",
    question: "What is a benefits cliff?",
    metaTitle: "What is a benefits cliff?",
    kicker:
      "A plain-English definition, with a real worked example you can check.",
    answerSpans: (ex) => [
      {
        text:
          "A benefits cliff is where a small raise triggers a large drop in benefits, so your total take-home falls even though your pay went up. In ",
      },
      { text: `${ex.stateLabel}, a ${fmtMoney(ex.raise)} raise can cost a family ` },
      { text: `${fmtMoney(ex.loss)} a year`, emphasis: "loss" },
      { text: ", because several benefits fall away in the same narrow income band at once." },
    ],
    definition: [
      "When you earn more, benefits like food help, health coverage, housing help and childcare help are tied to your income, so they shrink as your pay rises. Usually that trade is gentle: you lose a little help but keep most of the raise.",
      "A cliff is when it is not gentle. Several of those benefits are set to fall away in the same narrow band of income, so a small raise can knock out thousands of dollars of support all at once. The extra pay does not come close to covering the loss, so your real take-home goes down. That is the cliff: the point where a raise leaves your family with less.",
    ],
    exampleLead: (ex) =>
      `A real one, for a ${ex.familyLabel} in ${ex.stateLabel}:`,
    afterExample: [
      "The number is not a typo and it is not your mistake. It happens because the programs that fall away were each written on their own, decades apart, and none was designed to line up with the others. Where their income limits land close together, the drops stack into a cliff.",
      "The good news is that a cliff has an other side. Past the band where the benefits fall away, your take-home recovers and keeps climbing. Knowing where your cliff sits, and the income that clears it, turns a nasty surprise into a plan.",
    ],
    faq: (ex) => [
      {
        question: "Is a benefits cliff the same as losing all my benefits?",
        answer:
          "No. A cliff is a sudden drop where several benefits fall away in a narrow income band at once. You are not losing everything forever, and past the cliff your take-home recovers and keeps rising. The problem is the steep drop right at the edge, not the long climb after it.",
      },
      {
        question: "How big can a benefits cliff be?",
        answer:
          `It depends on your state, your family, and which benefits you have. For a ${ex.familyLabel} in ${ex.stateLabel}, a ${fmtMoney(
            ex.raise
          )} raise can cost about ${fmtMoney(
            ex.loss
          )} a year in real take-home. Some households face even steeper drops.`,
      },
      {
        question: "How do I find my own cliff?",
        answer:
          "Enter your state, family size, and current and offered income into the free CliffCheck tool. It shows exactly where your take-home drops, how much, and the income target that clears it. Your numbers stay on your phone and are never sent anywhere.",
      },
    ],
    metaDescription: (ex) =>
      `A benefits cliff is where a raise cuts your take-home because benefits fall away faster than pay rises. In ${ex.stateLabel}, a ${fmtMoney(
        ex.raise
      )} raise can cost a family ${fmtMoney(ex.loss)}. Free, private.`,
  },
  {
    slug: "will-a-raise-make-me-poorer",
    eyebrow: "Your situation",
    question: "Will a raise make me poorer?",
    metaTitle: "Will a raise make me poorer?",
    kicker: "Sometimes yes, and here is exactly when it happens.",
    answerSpans: (ex) => [
      {
        text:
          "A raise can leave you poorer when it pushes you off a benefits cliff, where the benefits you lose are worth more than the extra pay. In ",
      },
      { text: `${ex.stateLabel}, a ${fmtMoney(ex.raise)} raise at ${fmtMoney(ex.currentIncome)} can cut real take-home by ` },
      { text: `${fmtMoney(ex.loss)} a year`, emphasis: "loss" },
      { text: ". It is not most raises, but it is real, and it is worth checking before you say yes." },
    ],
    definition: [
      "Most raises are worth taking. You pay a bit more tax, you may lose a little benefit help, and you keep the rest. That is how it is supposed to work, and usually it does.",
      "But if a raise lands right where several of your benefits fall away at once, the math flips. The help you lose can be worth more than the pay you gain, so your family ends up with less money than before. This is not about earning too much. It is about a raise landing in exactly the wrong spot, on a cliff nobody told you was there.",
    ],
    exampleLead: (ex) =>
      `Here is a raise that costs money, for a ${ex.familyLabel} in ${ex.stateLabel}:`,
    afterExample: [
      "The fix is not to turn down every raise. It is to know where your cliff sits. A raise that lands just before the cliff can hurt, while a bigger raise that clears it pays off fully. Sometimes the answer is to ask for more, not less, so you land on the safe side.",
      "Before you accept or turn down an offer, it is worth running your own numbers. The free tool shows whether a specific raise puts you above or below your cliff, and gives you a target income that clears it for good.",
    ],
    faq: (ex) => [
      {
        question: "Should I turn down a raise to keep my benefits?",
        answer:
          "Not automatically. Turning down a raise can trap you below the cliff for years. Often the better move is to know the income that clears the cliff and aim for it, so a bigger raise pays off fully instead of a smaller one leaving you stuck.",
      },
      {
        question: "How much of a raise gets wiped out by a cliff?",
        answer:
          `At a cliff, more than the whole raise can be wiped out. For a ${ex.familyLabel} in ${ex.stateLabel}, a ${fmtMoney(
            ex.raise
          )} raise can leave the family about ${fmtMoney(
            ex.loss
          )} a year worse off once lost benefits and higher costs are counted.`,
      },
      {
        question: "How do I check if my raise is safe?",
        answer:
          "Put your state, family size, current pay, and the offered pay into the free CliffCheck tool. It tells you whether that raise leaves you better or worse off, and the income that clears the cliff. Nothing you enter leaves your phone.",
      },
    ],
    metaDescription: (ex) =>
      `A raise can make you poorer if it lands on a benefits cliff. In ${ex.stateLabel}, a ${fmtMoney(
        ex.raise
      )} raise can cost a family ${fmtMoney(
        ex.loss
      )} a year. Check your own raise, free and private.`,
  },
  {
    slug: "benefits-cliff-vs-welfare-trap",
    eyebrow: "The basics",
    question: "What is the difference between a benefits cliff and a welfare trap?",
    metaTitle: "Benefits cliff vs welfare trap",
    kicker: "Two names for related problems, and how they differ.",
    answerSpans: (ex) => [
      {
        text:
          "A benefits cliff is a sudden, sharp drop in take-home when a raise knocks out several benefits at once. A welfare trap is the broader situation it creates: earning more does not reliably pay off, so it feels safer to stay put. In ",
      },
      { text: `${ex.stateLabel}, one such cliff costs a family ` },
      { text: `${fmtMoney(ex.loss)} a year`, emphasis: "loss" },
      { text: "." },
    ],
    definition: [
      "A benefits cliff is the specific moment: a narrow band of income where a small raise triggers a large loss of benefits, so total take-home drops. It is sharp and it is measurable. You can point to the exact income where it happens.",
      "A welfare trap is the wider effect of living near one. When the math means a raise might make you poorer, the safe choice looks like staying exactly where you are, turning down extra hours or a promotion. The cliff is the edge; the trap is the pull to stand back from it. One is the mechanism, the other is what it does to the choices in front of you.",
    ],
    exampleLead: (ex) =>
      `The cliff, made concrete, for a ${ex.familyLabel} in ${ex.stateLabel}:`,
    afterExample: [
      "The distinction matters because the way out is different. A cliff is escaped by clearing it: earning past the band where the benefits fall away, to the safe exit income. The trap is escaped by seeing the whole picture, so a raise stops feeling like a gamble and becomes a decision you can make with the numbers in front of you.",
      "Neither is a failing on your part. Both come from benefit rules that were never designed to work together. Seeing where the cliff sits is the first step out of the trap.",
    ],
    faq: (ex) => [
      {
        question: "Is a welfare trap the same as a benefits cliff?",
        answer:
          "They are related but not the same. A benefits cliff is the sharp drop in take-home at a specific income. A welfare trap is the wider situation where earning more stops reliably paying off, which is what a cliff creates. The cliff is the mechanism; the trap is its effect on your choices.",
      },
      {
        question: "How do you get out of a welfare trap?",
        answer:
          `By finding the income that clears your cliff and aiming for it. Past that point, a raise pays off fully again. For a ${ex.familyLabel} in ${ex.stateLabel}, take-home recovers once you earn past the band where the benefits fall away.`,
      },
      {
        question: "Do all benefits create cliffs?",
        answer:
          "No. Many benefits taper gently, so losing a little help still leaves you ahead. Cliffs happen when several benefits are set to fall away in the same narrow income band, so the losses stack. That stacking is what turns a gentle taper into a sharp drop.",
      },
    ],
    metaDescription: (ex) =>
      `A benefits cliff is the sharp drop in take-home at a raise. A welfare trap is the pull to stay put it creates. In ${ex.stateLabel}, one cliff costs ${fmtMoney(
        ex.loss
      )} a year.`,
  },
  {
    slug: "effective-marginal-tax-rate",
    eyebrow: "The math",
    question: "What is an effective marginal tax rate?",
    metaTitle: "Effective marginal tax rate, explained",
    kicker: "The real rate on your next dollar, once lost benefits are counted.",
    answerSpans: (ex) => [
      {
        text:
          "Your effective marginal tax rate is how much of each extra dollar you actually keep, after tax and after any benefits you lose. On a benefits cliff it can pass 100 percent, which means a raise leaves you with less. In ",
      },
      { text: `${ex.stateLabel}, a ${fmtMoney(ex.raise)} raise costs a family ` },
      { text: `${fmtMoney(ex.loss)} a year`, emphasis: "loss" },
      { text: ", an effective rate far above 100 percent." },
    ],
    definition: [
      "The rate on your payslip is not the real rate on a raise. Your payslip rate counts income tax and payroll tax. But benefits like food help, health coverage and childcare help are tied to your income, so as your pay rises they shrink. That lost help is a real cost of earning more, even though it never shows up as tax.",
      "The effective marginal tax rate counts both: the tax you pay and the benefits you lose, for each extra dollar you earn. Most of the time it is a bit higher than your payslip rate. On a benefits cliff it can pass 100 percent, and when it does, earning more leaves you with less. That is the same thing as a cliff, described in the language economists use.",
    ],
    exampleLead: (ex) =>
      `Over 100 percent, in real dollars, for a ${ex.familyLabel} in ${ex.stateLabel}:`,
    afterExample: [
      "A rate over 100 percent sounds impossible, but it is just arithmetic: if a raise gains you a few thousand dollars in pay but costs you more than that in lost benefits, the rate on that raise is above 100 percent. Research from the Atlanta Federal Reserve and the Urban Institute finds the highest effective rates in the country fall not on top earners but on working families moving up.",
      "The point of measuring it is not despair, it is direction. Once you can see where the rate spikes, you can see the income just past it where the rate falls back to normal and a raise pays off again. The free tool finds that point for your own household.",
    ],
    faq: (ex) => [
      {
        question: "How can a tax rate be over 100 percent?",
        answer:
          `It is over 100 percent when a raise costs you more than it pays. For a ${ex.familyLabel} in ${ex.stateLabel}, a ${fmtMoney(
            ex.raise
          )} raise can trigger about ${fmtMoney(
            ex.loss
          )} in lost benefits and higher costs. Losing more than you gain is an effective rate above 100 percent.`,
      },
      {
        question: "Is the effective marginal rate the same as my tax bracket?",
        answer:
          "No. Your tax bracket only counts tax. The effective marginal rate also counts the benefits you lose as your pay rises, which for lower and moderate income families is often the larger cost. That is why the real rate on a raise can be far higher than any tax bracket.",
      },
      {
        question: "Where does my effective rate stop being over 100 percent?",
        answer:
          "Past the income where your benefits have finished falling away. That is your safe exit: earn beyond it and each extra dollar keeps most of its value again. The free CliffCheck tool shows exactly where that point is for your household.",
      },
    ],
    metaDescription: (ex) =>
      `Your effective marginal tax rate counts tax plus lost benefits on each extra dollar. On a cliff it tops 100 percent. In ${ex.stateLabel}, a ${fmtMoney(
        ex.raise
      )} raise costs a family ${fmtMoney(ex.loss)}.`,
  },
  {
    slug: "how-much-can-i-earn-before-i-lose-medicaid",
    eyebrow: "Your situation",
    question: "How much can I earn before I lose Medicaid?",
    metaTitle: "Income limit before you lose Medicaid",
    kicker: "Where the Medicaid line sits, and why crossing it can hurt.",
    answerSpans: (ex) => [
      {
        text:
          "In states that expanded Medicaid, adults keep it up to about 138 percent of the federal poverty line, and children usually qualify higher. Cross that line and coverage stops, so you buy a marketplace plan instead. In ",
      },
      { text: `${ex.stateLabel}, losing coverage is part of a raise that costs a family ` },
      { text: `${fmtMoney(ex.loss)} a year`, emphasis: "loss" },
      { text: "." },
    ],
    definition: [
      "Medicaid eligibility is set by income, measured against the federal poverty line for your family size. In the states that expanded Medicaid, adults qualify up to roughly 138 percent of that line, and children often qualify well above it through CHIP. In the states that did not expand, the limit for adults is far lower, and childless adults frequently cannot get it at any income.",
      "The catch is that Medicaid is all or nothing at the line. Unlike food help, which shrinks gradually, coverage does not taper. One dollar over the limit and the whole benefit stops, and you move to a marketplace plan with a monthly premium. When that switch lands in the same income band as other benefits falling away, it turns a raise into a cliff.",
    ],
    exampleLead: (ex) =>
      `What losing coverage looks like in a real raise, for a ${ex.familyLabel} in ${ex.stateLabel}:`,
    afterExample: [
      "Losing Medicaid is rarely the whole story on its own. The marketplace plan you move to comes with premium tax credits that soften the cost, and just below 250 percent of the poverty line those plans also carry extra cost-sharing help. The sharp part is the switch itself, landing alongside other benefits that fall away in the same narrow band.",
      "The practical move is to know your own line. The free tool shows the income where Medicaid stops for your household, what the replacement coverage costs, and the income further up that clears the whole cliff so a raise pays off again.",
    ],
    faq: (ex) => [
      {
        question: "What is the income limit for Medicaid?",
        answer:
          "In states that expanded Medicaid, adults qualify up to about 138 percent of the federal poverty line, and children usually qualify higher through CHIP. In states that did not expand, the adult limit is much lower and childless adults often cannot qualify at any income. The exact dollar figure depends on your family size and state.",
      },
      {
        question: "Do I lose Medicaid the moment I go over the limit?",
        answer:
          "Effectively yes. Medicaid does not taper like food help does, so one dollar over the line ends coverage and moves you to a marketplace plan. That plan comes with premium tax credits, but the switch itself is abrupt, which is what can make it part of a cliff.",
      },
      {
        question: "How do I find the income where I lose Medicaid?",
        answer:
          `Enter your state, family size, and income into the free CliffCheck tool. It marks the exact income where Medicaid stops, shows the cost of the coverage that replaces it, and the safe exit income that clears the cliff. For a ${ex.familyLabel} in ${ex.stateLabel}, that switch is part of a ${fmtMoney(
            ex.loss
          )} drop. Your numbers stay on your phone.`,
      },
    ],
    metaDescription: (ex) =>
      `In expansion states adults keep Medicaid up to about 138 percent of the poverty line, then it stops all at once. In ${ex.stateLabel} that switch is part of a ${fmtMoney(
        ex.loss
      )} raise cliff. Check your line, free.`,
  },
  {
    slug: "childcare-subsidy-income-limits",
    eyebrow: "Your situation",
    question: "What are the income limits for childcare subsidies?",
    metaTitle: "Childcare subsidy income limits",
    kicker: "How the childcare help line works, and why it bites hard.",
    answerSpans: (ex) => [
      {
        text:
          "Childcare help is run by each state, and most set the exit line near 85 percent of the state median income, with your copay rising as you earn more. Because the help is worth thousands per child, losing it is one of the sharpest cliffs. In ",
      },
      { text: `${ex.stateLabel}, it drives a raise that costs a family ` },
      { text: `${fmtMoney(ex.loss)} a year`, emphasis: "loss" },
      { text: "." },
    ],
    definition: [
      "Childcare subsidies come from a federal program run separately by every state, so the exact limits vary. Most states let you start receiving help below one threshold and keep it until your income reaches a higher exit line, often set near 85 percent of the state median income. As you earn more, the share you pay yourself, the copay, climbs.",
      "What makes childcare help a cliff risk is its size. For a family with young children it can be worth many thousands of dollars a year per child, more than any other benefit on this list. So when the exit line lands in the same income band as other benefits falling away, the childcare loss alone can outweigh a whole raise, and a family that crosses it can end up paying full price for care overnight.",
    ],
    exampleLead: (ex) =>
      `Why childcare turns a raise into a loss, for a ${ex.familyLabel} in ${ex.stateLabel}:`,
    afterExample: [
      "Because the value is so large, the childcare cliff is often the one worth planning around most carefully. A raise that lands just under the exit line keeps the help; a larger raise that clears the whole band pays for care out of higher pay and still comes out ahead. The trap is the raise in between.",
      "The free tool models your state's childcare rules alongside every other benefit, so you can see whether a specific raise keeps or loses the help, and the income that clears the cliff for good. Childcare figures are the hardest to pin down state by state, so it also shows how fresh the underlying numbers are.",
    ],
    faq: (ex) => [
      {
        question: "What income disqualifies you from childcare assistance?",
        answer:
          "It varies by state, but most set the exit line near 85 percent of the state median income for your family size, which is the highest a state may set it under federal rules. Below that line your copay rises with income; above it the help stops. The starting line to first qualify is usually lower.",
      },
      {
        question: "Why is the childcare cliff so steep?",
        answer:
          `Because the help is worth so much. Subsidised care can save a family thousands of dollars per child each year, more than any other benefit. When that falls away in the same income band as food or health help, the losses stack into a large drop. For a ${ex.familyLabel} in ${ex.stateLabel}, benefits like this are part of a ${fmtMoney(
            ex.loss
          )} cliff.`,
      },
      {
        question: "How do I check my childcare subsidy cliff?",
        answer:
          "Put your state, family size, and income into the free CliffCheck tool. It applies your state's childcare rules with every other benefit and shows where the help stops, how much it is worth, and the income that clears the cliff. Nothing you enter leaves your phone.",
      },
    ],
    metaDescription: (ex) =>
      `Most states end childcare help near 85 percent of the state median income, and because the help is worth thousands per child, losing it is a sharp cliff. In ${ex.stateLabel} it drives a ${fmtMoney(
        ex.loss
      )} drop. Check yours, free.`,
  },
  {
    slug: "does-a-bonus-count-as-income-for-benefits",
    eyebrow: "Your situation",
    question: "Does a bonus count as income for benefits?",
    metaTitle: "Does a bonus count as income for benefits?",
    kicker: "Bonuses and overtime count, and a big one can knock out help.",
    answerSpans: (ex) => [
      {
        text:
          "Yes. A bonus, overtime, and extra hours all count as earned income for benefits like food help, Medicaid, and childcare help. A large one-time bonus can push you over a limit for that period and cost more than the bonus itself. In ",
      },
      { text: `${ex.stateLabel}, a raise of the same size costs a family ` },
      { text: `${fmtMoney(ex.loss)} a year`, emphasis: "loss" },
      { text: "." },
    ],
    definition: [
      "Benefit programs measure your income to decide what you qualify for, and that measure includes almost all the money you earn from work: your regular pay, overtime, tips, commissions, and bonuses. A bonus is not treated differently from a raise while it counts. So a large bonus can lift your income above a benefit limit for the month or period it is counted in.",
      "That is why a bonus can, in some cases, leave a family worse off. If it pushes income past a cliff where several benefits fall away, the help lost during that period can be worth more than the bonus. It is the same math as a raise landing on a cliff, just for a shorter stretch of time. A sustained raise carries the same risk permanently, which is the more common case.",
    ],
    exampleLead: (ex) =>
      `A raise is a sustained bonus, and here is what one costs, for a ${ex.familyLabel} in ${ex.stateLabel}:`,
    afterExample: [
      "None of this means a bonus is bad. Most bonuses are worth taking, and only the ones that land right on a cliff cause a problem. The way to know is to check where your income sits relative to your benefit limits before the extra pay lands, so a windfall does not turn into a surprise bill from lost help.",
      "The free tool treats extra pay exactly as the programs do. Enter your income with and without the bonus and it shows whether the extra tips you over a cliff, and the income level that clears it so more pay reliably means more money.",
    ],
    faq: (ex) => [
      {
        question: "Does a one-time bonus affect my benefits?",
        answer:
          "It can. Benefits count almost all earned income, including bonuses, in the period they are received. A large one-time bonus can lift your income above a limit for that period and reduce or pause some help, even though your regular pay has not changed.",
      },
      {
        question: "Does overtime count against benefits the same way?",
        answer:
          "Yes. Overtime, extra shifts, tips, and commissions all count as earned income, just like a bonus or a raise. Most of the time the extra pay is worth more than any help you lose, but near a cliff the lost benefits can outweigh it.",
      },
      {
        question: "How do I tell if a bonus will cost me benefits?",
        answer:
          `Enter your income with and without the bonus into the free CliffCheck tool. It shows whether the extra pay crosses a cliff and by how much. For a ${ex.familyLabel} in ${ex.stateLabel}, extra pay landing on the cliff can cost about ${fmtMoney(
            ex.loss
          )} a year in lost help. Your numbers stay on your phone.`,
      },
    ],
    metaDescription: (ex) =>
      `Yes, bonuses and overtime count as income for benefits, and a large one can push you over a limit. In ${ex.stateLabel} extra pay on a cliff can cost a family ${fmtMoney(
        ex.loss
      )}. Check before it lands, free.`,
  },
  {
    slug: "snap-food-stamps-income-limit",
    eyebrow: "Your situation",
    question: "What is the income limit for SNAP (food stamps)?",
    metaTitle: "SNAP food stamps income limit",
    kicker: "The gross and net lines for food help, and how states change them.",
    answerSpans: (ex) => [
      {
        text:
          "SNAP has two tests: gross income up to 130 percent of the poverty line, and net income up to 100 percent after deductions. Most states raise the gross limit to between 165 and 200 percent, so the net test usually binds first. In ",
      },
      { text: `${ex.stateLabel}, food help falling away is part of a raise that costs a family ` },
      { text: `${fmtMoney(ex.loss)} a year`, emphasis: "loss" },
      { text: "." },
    ],
    definition: [
      "SNAP, still widely called food stamps, checks income two ways. The gross test is your income before deductions, set federally at 130 percent of the poverty line. The net test is your income after allowed deductions for things like housing and childcare, set at 100 percent of the poverty line. A household generally has to pass both.",
      "Most states use an option called broad-based categorical eligibility to lift the gross limit higher, commonly to between 165 and 200 percent of the poverty line. That widens the door, but the net test at 100 percent still applies, so the benefit shrinks as income rises and reaches zero before the gross limit does. Because SNAP tapers rather than stopping dead, it is a gentler part of most cliffs, but it still adds to the drop when several benefits fall away together.",
    ],
    exampleLead: (ex) =>
      `SNAP as one layer of a real cliff, for a ${ex.familyLabel} in ${ex.stateLabel}:`,
    afterExample: [
      "Because SNAP phases out gradually, it is rarely the sharpest edge of a cliff on its own. The steep drops usually come from Medicaid or childcare help ending all at once. But SNAP still counts: the food help you lose as your pay rises is real money, and it stacks on top of the sharper losses in the same income band.",
      "The free tool models SNAP with your state's actual gross limit alongside every other benefit, so you see the full picture rather than one program at a time. It shows where your food help reaches zero and how that fits into the wider cliff.",
    ],
    faq: (ex) => [
      {
        question: "What is the maximum income to qualify for SNAP?",
        answer:
          "Federally, gross income up to 130 percent of the poverty line and net income up to 100 percent after deductions. Most states raise the gross limit to between 165 and 200 percent through a policy option, but the net test at 100 percent still applies, so the benefit reaches zero before the higher gross limit. The exact dollars depend on your family size and state.",
      },
      {
        question: "Does SNAP stop all at once when I earn more?",
        answer:
          "No. SNAP tapers: the benefit shrinks as income rises and reaches zero gradually, rather than cutting off in one step. That makes it a gentler part of a cliff than Medicaid or childcare help, which can stop abruptly, though the food help you lose still adds to the overall drop.",
      },
      {
        question: "How do I check my SNAP cutoff and cliff?",
        answer:
          `Enter your state, family size, and income into the free CliffCheck tool. It uses your state's actual SNAP limit with every other benefit and shows where your food help ends and how it fits the wider cliff. For a ${ex.familyLabel} in ${ex.stateLabel}, that band is part of a ${fmtMoney(
            ex.loss
          )} drop. Your numbers stay on your phone.`,
      },
    ],
    metaDescription: (ex) =>
      `SNAP allows gross income to 130 percent of the poverty line and net to 100 percent, and most states lift the gross limit to 165 to 200 percent. In ${ex.stateLabel} lost food help is part of a ${fmtMoney(
        ex.loss
      )} cliff. Check yours, free.`,
  },
];

const TOPIC_BY_SLUG: Record<string, GuideTopicDef> = Object.fromEntries(
  GUIDE_TOPICS.map((t) => [t.slug, t])
);

/** Resolve a URL slug to its topic definition, or null if it is not a real topic.
 *  The single gate both generateStaticParams and the page component call, so an
 *  unknown slug can never render a page. */
export function topicFromSlug(slug: string): GuideTopicDef | null {
  return TOPIC_BY_SLUG[slug] ?? null;
}

/** All topic route params: one per curated topic (SSG). Adding a topic to
 *  GUIDE_TOPICS mints its page + sitemap entry with zero change to the route. */
export function allTopicParams(): { topic: string }[] {
  return GUIDE_TOPICS.map((t) => ({ topic: t.slug }));
}

/* ── The full topic model (everything the page renders, one build-time pass) ───
   Resolves the authored copy against the engine-derived Ohio example so every
   dollar in the rendered page is engine-true. */
export interface GuideTopicModel {
  slug: string;
  eyebrow: string;
  question: string;
  metaTitle: string;
  metaDescription: string;
  kicker: string;
  answerSpans: AnswerSpan[];
  definition: string[];
  exampleLead: string;
  afterExample: string[];
  faq: FaqEntry[];
  /** The engine-derived Ohio example the worked block quotes. */
  example: HeroScenario;
  /** offered - current, kept if positive (for the worked-example math). */
  keptOfRaise: number;
  /** ISO date the Ohio rules behind the example were last checked (Article schema). */
  dateModified: string;
}

export function buildTopicModel(topic: GuideTopicDef): GuideTopicModel {
  const example = ohioExample();
  const dateModified = latestRetrieved(getStateSources(example.code));
  return {
    slug: topic.slug,
    eyebrow: topic.eyebrow,
    question: topic.question,
    metaTitle: topic.metaTitle,
    metaDescription: topic.metaDescription(example),
    kicker: topic.kicker,
    answerSpans: topic.answerSpans(example),
    definition: topic.definition,
    exampleLead: topic.exampleLead(example),
    afterExample: topic.afterExample,
    faq: topic.faq(example),
    example,
    keptOfRaise: Math.max(0, example.raise - example.loss),
    dateModified,
  };
}

/** Onward topic links for cross-cluster linking: up to two OTHER topics, so the
 *  glossary builds a topical cluster without becoming a wall of links. */
export function otherTopics(currentSlug: string): GuideTopicDef[] {
  return GUIDE_TOPICS.filter((t) => t.slug !== currentSlug).slice(0, 2);
}
