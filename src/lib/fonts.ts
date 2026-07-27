import { Bricolage_Grotesque, Literata, IBM_Plex_Mono } from "next/font/google";

/**
 * SPEC §4.5 — three faces, three jobs.
 *
 * `next/font/google` downloads these at BUILD time and serves them from your
 * own domain. There is no runtime request to Google, which is what the §1.8
 * requirement "self-hosted fonts, no blocking third-party requests" asks for.
 *
 * Only the body face is preloaded: it renders the first meaningful text on a
 * reading page, so it is on the LCP path. Preloading all three would compete
 * for bandwidth with the thing that actually matters.
 */

export const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bricolage",
  weight: ["400", "500", "600", "700"],
  preload: false,
});

export const literata = Literata({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-literata",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  preload: true,
});

export const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plex-mono",
  weight: ["400", "500"],
  preload: false,
});

export const fontVariables = [bricolage.variable, literata.variable, plexMono.variable].join(
  " ",
);
