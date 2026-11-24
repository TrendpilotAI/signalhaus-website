import { describe, expect, it } from "vitest";
import { extractHeadings, headingId } from "@/lib/headings";

describe("headingId", () => {
  it("turns a question into a URL fragment", () => {
    expect(headingId("How do you choose a North Star metric?")).toBe(
      "how-do-you-choose-a-north-star-metric"
    );
  });

  it("drops quotes and apostrophes instead of splitting on them", () => {
    expect(headingId("What if you don't have \"enough\" data?")).toBe(
      "what-if-you-dont-have-enough-data"
    );
  });
});

describe("extractHeadings", () => {
  it("returns the H2 headings in order with matching ids", () => {
    const markdown = ["# Title", "", "## First question?", "Answer.", "", "### Detail", "", "## Second *question*?"].join(
      "\n"
    );
    expect(extractHeadings(markdown)).toEqual([
      { id: "first-question", text: "First question?" },
      { id: "second-question", text: "Second question?" },
    ]);
  });

  it("ignores headings inside code fences", () => {
    const markdown = ["```md", "## Not a heading", "```", "", "## A real heading"].join("\n");
    expect(extractHeadings(markdown)).toEqual([{ id: "a-real-heading", text: "A real heading" }]);
  });
});
