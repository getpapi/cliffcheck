/**
 * SiteChrome — the shared frame both surfaces inherit (task-116, redesigned
 * 09-07-2026). Composes Header + page content + Footer. The privacy promise
 * lives in the header's trust pill now (no separate strip — that read as debug
 * chrome, not design).
 *
 * Layout note: the page content lives in a flex column so the footer settles at
 * the bottom on short pages (min-height: 100dvh) without a fixed footer.
 */
import { Header } from "./Header";
import { Footer } from "./Footer";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Header />
      <main style={{ flex: "1 0 auto" }}>{children}</main>
      <Footer />
    </div>
  );
}
