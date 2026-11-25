import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { size as appleIconSize, contentType as appleIconType } from "@/app/apple-icon";

const root = path.join(__dirname, "../../..");

describe("skip link target", () => {
  it("gives main a tabIndex so the skip link can move keyboard focus into it", () => {
    const source = readFileSync(path.join(root, "src/app/layout.tsx"), "utf8");
    expect(source).toMatch(/<main\b[^>]*\bid=["']main["']/);
    expect(source).toMatch(/tabIndex=\{-1\}/);
  });
});

describe("caption links", () => {
  it("underlines links inside captions so they do not rely on colour alone", () => {
    const css = readFileSync(path.join(root, "src/app/globals.css"), "utf8");
    expect(css).toMatch(/\.caption\s+a\s*,\s*\n\s*\.caption\s+\.link-quiet/);
    expect(css).toMatch(/text-decoration:\s*underline/);
  });
});

describe("footer tap targets", () => {
  it("defines a 24px-tall footer-link target for WCAG 2.5.8", () => {
    const css = readFileSync(path.join(root, "src/app/globals.css"), "utf8");
    expect(css).toMatch(/\.footer-link\s*\{[^}]*min-height:\s*24px/);

    const footer = readFileSync(path.join(root, "src/components/Footer.tsx"), "utf8");
    expect(footer.match(/footer-link/g)?.length).toBeGreaterThanOrEqual(3);
  });
});

describe("reduced motion", () => {
  it("shortens transitions and animations when the visitor asks for less motion", () => {
    const css = readFileSync(path.join(root, "src/app/globals.css"), "utf8");
    expect(css).toMatch(/@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)/);
    expect(css).toMatch(/transition-duration:\s*0\.01ms/);
  });
});

describe("apple touch icon", () => {
  it("exports a 180×180 PNG for home-screen bookmarks", () => {
    expect(appleIconSize).toEqual({ width: 180, height: 180 });
    expect(appleIconType).toBe("image/png");
  });
});

describe("favicon", () => {
  it("ships a favicon.ico so browsers do not get the HTML 404 page", () => {
    const bytes = readFileSync(path.join(root, "src/app/favicon.ico"));
    expect(bytes.subarray(0, 4).equals(Buffer.from([0, 0, 1, 0]))).toBe(true);
    expect(bytes.length).toBeGreaterThan(200);
  });
});
