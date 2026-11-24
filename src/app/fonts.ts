import localFont from "next/font/local";

/*
 * The three design.md typefaces, served from this site. The files come from
 * the @fontsource packages, so the build makes no request to Google Fonts
 * and visitors' browsers don't either.
 */

export const newsreader = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource/newsreader/files/newsreader-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/newsreader/files/newsreader-latin-400-italic.woff2",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-newsreader",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

export const hanken = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource/hanken-grotesk/files/hanken-grotesk-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/hanken-grotesk/files/hanken-grotesk-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/hanken-grotesk/files/hanken-grotesk-latin-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/hanken-grotesk/files/hanken-grotesk-latin-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-hanken",
  display: "swap",
  adjustFontFallback: "Arial",
});

export const dmMono = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource/dm-mono/files/dm-mono-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-dm-mono",
  display: "swap",
  adjustFontFallback: false,
});
