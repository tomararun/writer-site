import type { Metadata, Viewport } from "next";
import "./globals.css";
import "@/styles/typography.css";
import { PreviewBanner } from "@/components/layout/PreviewBanner";
import { Shell } from "@/components/layout/Shell";
import { fontVariables } from "@/lib/fonts";
import { themeScript } from "@/lib/theme-script";
import { site } from "@/site.config";

/**
 * SPEC §4.7 — the metadata base. Per-route `generateMetadata` (P8) extends this;
 * `metadataBase` is what makes the relative OG and canonical URLs resolve.
 */
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — Writer & ${site.role}`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": [{ url: "/rss.xml", title: `${site.name} — all posts` }],
    },
  },
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "en_GB",
    url: site.url,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  /* Both values so the browser chrome matches the active theme. */
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e6e8ea" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1418" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    /* suppressHydrationWarning is required and correct here: the inline script
       below mutates data-theme on <html> before React hydrates, so the server and
       client markup legitimately differ on that one attribute. */
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={fontVariables}>
        <PreviewBanner />
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
