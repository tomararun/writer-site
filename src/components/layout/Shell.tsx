import { Footer } from "./Footer";
import { Header } from "./Header";
import { SkipLink } from "./SkipLink";

/**
 * The public layout: skip link first in the DOM, then header, then the main
 * landmark the skip link targets, then footer.
 *
 * `id="main"` and `tabIndex={-1}` together let the skip link move focus, not just
 * the scroll position — a skip link that only scrolls is a common broken pattern.
 */
export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SkipLink />
      <Header />
      <main id="main" tabIndex={-1} className="focus-visible:outline-none">
        {children}
      </main>
      <Footer />
    </>
  );
}
