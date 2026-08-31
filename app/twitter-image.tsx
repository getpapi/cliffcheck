import { renderCard, size, contentType, alt } from "./_og/card";

/**
 * Twitter card (1200×630). Identical output to `opengraph-image.tsx` — both
 * pull the same JSX + config from `app/_og/card.tsx` so the two cards can never
 * drift apart.
 */
export { size, contentType, alt };

// Render the card once at build time as an immutable static asset. Without this
// the route is ISR (cache-control: max-age=0, must-revalidate) and the FIRST
// request after a cold edge cold-renders the next/og PNG — Twitterbot's short
// timeout can lose that race and cache an empty card. force-static removes the
// cold render entirely so crawlers always get an instant hit.
export const dynamic = "force-static";

export default function Image() {
  return renderCard();
}
