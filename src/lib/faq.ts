export interface FaqItem {
  question: string;
  answer: string;
}

/** Strips the Markdown that can appear in a heading or an answer paragraph. */
export function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/(\*\*|__)(.+?)\1/g, "$2")
    .replace(/(^|[\s(])[*_]([^\s*_](?:[^*_\n]*[^\s*_])?)[*_](?=[\s).,!?]|$)/g, "$1$2")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isBlockStart(line: string): boolean {
  return /^(#{1,6}\s|[-*+]\s|\d+\.\s|>|```|\||<|import\s|export\s)/.test(line.trim());
}

/**
 * Builds question and answer pairs from a post body. A question is any H2
 * that ends in a question mark. Its answer is the first plain paragraph under
 * it, which each post writes as a direct one or two sentence answer.
 */
export function extractFaq(markdown: string): FaqItem[] {
  const lines = markdown.split(/\r?\n/);
  const items: FaqItem[] = [];
  let inCodeFence = false;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith("```")) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) continue;

    const heading = lines[i].match(/^##\s+(.+?)\s*#*\s*$/);
    if (!heading) continue;

    const question = markdownToPlainText(heading[1]);
    if (!question.endsWith("?")) continue;

    let j = i + 1;
    while (j < lines.length && lines[j].trim() === "") j++;

    const paragraph: string[] = [];
    while (j < lines.length && lines[j].trim() !== "" && !isBlockStart(lines[j])) {
      paragraph.push(lines[j].trim());
      j++;
    }

    const answer = markdownToPlainText(paragraph.join(" "));
    if (answer) items.push({ question, answer });
  }

  return items;
}
