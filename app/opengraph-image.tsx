import { renderCard, size, contentType, alt } from "./_og/card";

/**
 * Open Graph card (1200×630). Rendered from shared JSX in `app/_og/card.tsx`
 * via next/og so the frame can never overflow (the old committed PNG did).
 * `twitter-image.tsx` renders the identical card from the same module.
 */
export { size, contentType, alt };

// Build-time static render — see twitter-image.tsx for the full rationale.
// Prevents the cold next/og render that loses the crawler-timeout race.
export const dynamic = "force-static";

export default function Image() {
  return renderCard();
}
