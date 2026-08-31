/**
 * TipJar — the optional support ask (AD-8: tip jar permitted, zero-risk).
 * Placed after the manager brief so the user has seen their cliff and gotten
 * real value before being asked for anything. Free-first framing, one amber
 * CTA to Ko-fi.
 *
 * A quiet full-width band (not a competing card): text left, button right on
 * desktop; stacked and centred on phones. Cream artifact surface, warm voice
 * per PRODUCT.md, no em-dash. Ko-fi URL is the canonical one from v1.
 */
import { Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TipJar() {
  return (
    <section
      aria-label="Support CliffCheck"
      className="flex flex-col items-center gap-4 rounded-2xl border-[1.5px] border-border-stone bg-surface-cream p-5 text-center md:flex-row md:items-center md:justify-between md:px-6 md:text-left"
      style={{ boxShadow: "var(--elevation-card)" }}
    >
      <div>
        <p className="m-0 text-[15px] font-bold text-text-primary">
          Did this help?
        </p>
        <p className="m-0 mt-1 max-w-[52ch] text-sm leading-relaxed text-text-secondary">
          CliffCheck is free, and it stays free. I&rsquo;m one developer trying
          to take this to all 50 states. If it saved you from a costly mistake,
          a coffee helps me keep building. Thank you.
        </p>
      </div>
      <Button
        asChild
        className="h-12 shrink-0 rounded-lg px-5 text-sm font-bold hover:bg-cta-hover-amber max-md:w-full"
      >
        <a
          href="https://ko-fi.com/cathalos"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Coffee aria-hidden className="size-4" />
          Tip me a coffee
        </a>
      </Button>
    </section>
  );
}
