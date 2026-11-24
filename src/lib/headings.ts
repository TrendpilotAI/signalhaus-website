import { markdownToPlainText } from "./faq";

export interface Heading {
  id: string;
  text: string;
}

/** Turns heading text into a URL fragment, e.g. "How do you choose?" into "how-do-you-choose". */
export function headingId(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’"“”]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** The H2 headings of a markdown document, in order, skipping code fences. */
export function extractHeadings(markdown: string): Heading[] {
  const headings: Heading[] = [];
  let inFence = false;
  for (const line of markdown.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = /^##\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) continue;
    const text = markdownToPlainText(match[1]);
    headings.push({ id: headingId(text), text });
  }
  return headings;
}
