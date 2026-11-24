import { describe, expect, it } from "vitest";
import { extractFaq } from "../faq";
import { articleJsonLd, articleUrl, faqPageJsonLd, serializeJsonLd } from "../jsonld";
import { isLeadTopic } from "../leads/schema";
import { getAllPostsMeta, getPostBySlug, type Post } from "../mdx";
import { TOOLKIT_URL } from "../site";

const EXPECTED_SLUGS = [
  "data-driven-decision-making-for-startups",
  "how-to-position-a-startup",
  "how-to-prioritize-as-a-startup-founder",
  "how-to-survive-vc-due-diligence-meetings",
];

const posts: Post[] = getAllPostsMeta().map((meta) => {
  const post = getPostBySlug(meta.slug);
  if (!post) throw new Error(`Missing post: ${meta.slug}`);
  return post;
});

function sentenceCount(text: string): number {
  return text.split(/(?<=[.!?])\s+/).filter(Boolean).length;
}

describe("published posts", () => {
  it("are the four how-to posts", () => {
    expect(posts.map((p) => p.slug).sort()).toEqual(EXPECTED_SLUGS);
  });

  it("does not resolve slugs outside the blog folder", () => {
    expect(getPostBySlug("../archive/blog/ai-roi-calculator-guide")).toBeNull();
    expect(getPostBySlug("ai-roi-calculator-guide")).toBeNull();
  });

  describe.each(posts.map((post) => [post.slug, post] as const))("%s", (_slug, post) => {
    const faq = extractFaq(post.content);
    const headings = [...post.content.matchAll(/^##\s+(.+)$/gm)].map((m) => m[1].trim());

    it("has complete frontmatter", () => {
      expect(post.title.length).toBeGreaterThan(10);
      expect(post.excerpt.length).toBeGreaterThan(40);
      expect(post.excerpt.length).toBeLessThanOrEqual(170);
      expect(Number.isNaN(Date.parse(post.date))).toBe(false);
      expect(post.author).toBe("Nathan Stevenson");
      expect(isLeadTopic(post.topic)).toBe(true);
      expect(post.topic).not.toBe("other");
    });

    it("uses question H2 headings throughout", () => {
      expect(headings.length).toBeGreaterThanOrEqual(5);
      for (const heading of headings) {
        expect(heading).toMatch(/^(How|What|When|Why|Who|Which)\b.*\?$/);
      }
    });

    it("answers every question directly in the first one or two sentences", () => {
      expect(faq).toHaveLength(headings.length);
      for (const item of faq) {
        expect(sentenceCount(item.answer)).toBeLessThanOrEqual(2);
        expect(item.answer.length).toBeGreaterThan(40);
        expect(item.answer.length).toBeLessThan(320);
        expect(item.answer).not.toMatch(/[[\]*_`<>]/);
      }
    });

    it("produces valid FAQPage JSON-LD from those Q&As", () => {
      const jsonLd = faqPageJsonLd(faq, articleUrl(post.slug));
      expect(jsonLd).not.toBeNull();
      const parsed = JSON.parse(serializeJsonLd(jsonLd!));
      expect(parsed["@type"]).toBe("FAQPage");
      expect(parsed.mainEntity).toHaveLength(faq.length);
      for (const entity of parsed.mainEntity) {
        expect(entity["@type"]).toBe("Question");
        expect(entity.name).toMatch(/\?$/);
        expect(entity.acceptedAnswer["@type"]).toBe("Answer");
        expect(entity.acceptedAnswer.text.length).toBeGreaterThan(0);
      }
    });

    it("produces valid Article JSON-LD", () => {
      const parsed = JSON.parse(serializeJsonLd(articleJsonLd(post)));
      expect(parsed["@type"]).toBe("Article");
      expect(parsed.headline).toBe(post.title);
      expect(parsed.headline.length).toBeLessThanOrEqual(110);
      expect(parsed.author.name).toBe("Nathan Stevenson");
      expect(parsed.wordCount).toBeGreaterThan(600);
    });

    it("links to the other three posts, the landing page and the toolkit", () => {
      for (const slug of EXPECTED_SLUGS.filter((s) => s !== post.slug)) {
        expect(post.content).toContain(`](/blog/${slug})`);
      }
      expect(post.content).toContain("](/)");
      expect(post.content).toContain(`](${TOOLKIT_URL})`);
    });

    it("only links to pages that exist", () => {
      const internal = [...post.content.matchAll(/\]\((\/[^)]*)\)/g)].map((m) => m[1]);
      const allowed = new Set(["/", "/services", "/about", "/contact", "/blog"]);
      for (const href of internal) {
        const ok = allowed.has(href) || EXPECTED_SLUGS.some((slug) => href === `/blog/${slug}`);
        expect(ok, `unexpected link ${href}`).toBe(true);
      }
    });

    it("follows the house style", () => {
      expect(post.content).not.toMatch(/[\u2014\u2013]/);
      expect(post.content).not.toContain(";");
    });
  });
});
