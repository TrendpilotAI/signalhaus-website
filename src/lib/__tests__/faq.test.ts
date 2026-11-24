import { describe, expect, it } from "vitest";
import { extractFaq, markdownToPlainText } from "../faq";

describe("markdownToPlainText", () => {
  it("strips links, emphasis, code and tags", () => {
    expect(
      markdownToPlainText(
        'Read the [toolkit](https://example.com/a_b), it is **free** and *short*. Use `one sheet`. <br/>'
      )
    ).toBe("Read the toolkit, it is free and short. Use one sheet.");
  });

  it("leaves underscores and asterisks inside words alone", () => {
    expect(markdownToPlainText("utm_source and 2 * 3 * 4")).toBe("utm_source and 2 * 3 * 4");
  });
});

describe("extractFaq", () => {
  const body = `
Intro paragraph. Is this a question? It is not a heading.

## How do you pick a number?

Pick the one you most want to move. It can be
[more than one](/blog/other) to start.

More detail that is not part of the answer.

## A heading that is a statement

Some text.

## What if the answer starts with a list?

- First item
- Second item

## How do you set it up?
Make **one sheet** with three columns.

### Is a deeper heading ignored?

Yes.

\`\`\`md
## Is a heading inside a code block ignored?

It should be.
\`\`\`

## What about a closing hash? ##

It still counts.
`;

  it("uses each question H2 and the first paragraph under it", () => {
    expect(extractFaq(body)).toEqual([
      {
        question: "How do you pick a number?",
        answer: "Pick the one you most want to move. It can be more than one to start.",
      },
      { question: "How do you set it up?", answer: "Make one sheet with three columns." },
      { question: "What about a closing hash?", answer: "It still counts." },
    ]);
  });

  it("returns nothing for a post with no question headings", () => {
    expect(extractFaq("## Overview\n\nText.\n")).toEqual([]);
    expect(extractFaq("")).toEqual([]);
  });
});
