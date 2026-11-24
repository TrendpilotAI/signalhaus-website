import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const PAPER = "#F5EFE3";
const NAVY = "#1E2B45";
const MUTED = "#545A66";
const ACCENT = "#A84D34";

// Static WOFF files, because the image renderer cannot read WOFF2 or variable fonts.
const FONT_FILES = {
  Newsreader: "@fontsource/newsreader/files/newsreader-latin-400-normal.woff",
  "Hanken Grotesk": "@fontsource/hanken-grotesk/files/hanken-grotesk-latin-500-normal.woff",
  "DM Mono": "@fontsource/dm-mono/files/dm-mono-latin-400-normal.woff",
} as const;

async function loadFonts() {
  return Promise.all(
    Object.entries(FONT_FILES).map(async ([name, file]) => ({
      name,
      data: await readFile(path.join(process.cwd(), "node_modules", file)),
      weight: (name === "Hanken Grotesk" ? 500 : 400) as 400 | 500,
      style: "normal" as const,
    }))
  );
}

export interface OgCardInput {
  eyebrow: string;
  title: string;
  footnote: string;
}

/** The share image: cream paper, navy serif title, one terracotta mark. */
export async function renderOgCard({ eyebrow, title, footnote }: OgCardInput) {
  const titleSize = title.length > 60 ? 64 : title.length > 36 ? 78 : 92;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          backgroundColor: PAPER,
          color: NAVY,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: 9,
              backgroundColor: ACCENT,
            }}
          >
            <svg width="44" height="44" viewBox="0 0 64 64" fill="none">
              <path
                d="M14 50V30.5L28 18l14 12.5V50z M24 50V39.5h8V50 M41 16.5a8.5 8.5 0 0 1 7.5 7.5 M42 9a16 16 0 0 1 14 14"
                stroke="#FFFFFF"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div style={{ fontFamily: "Newsreader", fontSize: 44, letterSpacing: -0.9 }}>{SITE.name}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontFamily: "Hanken Grotesk",
              fontSize: 26,
              letterSpacing: 2.1,
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </div>
          <div
            style={{
              fontFamily: "Newsreader",
              fontSize: titleSize,
              lineHeight: 1.05,
              letterSpacing: -titleSize * 0.02,
              maxWidth: 1000,
            }}
          >
            {title}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 3, height: 34, borderRadius: 2, backgroundColor: ACCENT }} />
          <div style={{ fontFamily: "DM Mono", fontSize: 24, color: MUTED }}>{footnote}</div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await loadFonts() }
  );
}
