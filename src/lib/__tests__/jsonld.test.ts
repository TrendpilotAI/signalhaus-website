import { describe, expect, it } from "vitest";
import {
  articleJsonLd,
  breadcrumbJsonLd,
  faqPageJsonLd,
  organizationJsonLd,
  serializeJsonLd,
  websiteJsonLd,
  type JsonLdObject,
} from "../jsonld";
import { SITE, SITE_URL } from "../site";

const post = {
  slug: "how-to-position-a-startup",
  title: "How to position a startup",
  excerpt: "Find the one thing to lead with.",
  date: "2026-11-23",
  author: "Nathan Stevenson",
  tags: ["Positioning", "Go-to-market"],
  wordCount: 1100,
};

function roundTrip(data: JsonLdObject): JsonLdObject {
  return JSON.parse(serializeJsonLd(data));
}

function isIsoDate(value: unknown): boolean {
  return typeof value === "string" && !Number.isNaN(Date.parse(value)) && /^\d{4}-\d{2}-\d{2}T/.test(value);
}

/** Walks a JSON-LD tree and returns every string value. */
function allStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(allStrings);
  if (typeof value === "object" && value !== null) return Object.values(value).flatMap(allStrings);
  return [];
}

describe("serializeJsonLd", () => {
  it("produces JSON that parses back to the same data", () => {
    const data = articleJsonLd(post);
    expect(roundTrip(data)).toEqual(data);
  });

  it("cannot be used to close the script tag", () => {
    const data = faqPageJsonLd(
      [{ question: "What about </script><script>alert(1)</script>?", answer: "Escaped <b>fine</b>." }],
      `${SITE_URL}/blog/x`
    );
    const serialized = serializeJsonLd(data!);
    expect(serialized).not.toContain("<");
    expect(serialized).toContain("\\u003c/script>");
    expect(roundTrip(data!)).toEqual(data);
  });
});

describe("articleJsonLd", () => {
  const article = articleJsonLd(post);

  it("has the properties Google requires and recommends for an Article", () => {
    expect(article["@context"]).toBe("https://schema.org");
    expect(article["@type"]).toBe("Article");
    expect(article.headline).toBe(post.title);
    expect((article.headline as string).length).toBeLessThanOrEqual(110);
    expect(article.description).toBe(post.excerpt);
    expect(isIsoDate(article.datePublished)).toBe(true);
    expect(isIsoDate(article.dateModified)).toBe(true);
    expect(article.image).toBe(`${SITE_URL}/blog/${post.slug}/opengraph-image`);
    expect(article.url).toBe(`${SITE_URL}/blog/${post.slug}`);
    expect(article.mainEntityOfPage).toEqual({
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${post.slug}`,
    });
    expect(article.keywords).toBe("Positioning, Go-to-market");
    expect(article.wordCount).toBe(1100);
  });

  it("names the author as a Person with the approved bio only", () => {
    expect(article.author).toMatchObject({
      "@type": "Person",
      name: "Nathan Stevenson",
      description: SITE.founder.bio,
      url: `${SITE_URL}/about`,
    });
  });

  it("names the publisher with a logo", () => {
    expect(article.publisher).toMatchObject({
      "@type": "Organization",
      name: "Signalhaus",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/icon.svg` },
    });
  });

  it("uses the updated date when there is one", () => {
    const updated = articleJsonLd({ ...post, updated: "2026-12-01" });
    expect(updated.datePublished).toBe("2026-11-23T00:00:00.000Z");
    expect(updated.dateModified).toBe("2026-12-01T00:00:00.000Z");
  });

  it("refuses an invalid date instead of emitting bad markup", () => {
    expect(() => articleJsonLd({ ...post, date: "soon" })).toThrow(/Invalid date/);
  });

  it("uses absolute https URLs everywhere", () => {
    const urls = allStrings(article).filter((value) => value.includes("/") && !value.includes(" "));
    expect(urls.length).toBeGreaterThan(5);
    for (const url of urls) expect(url).toMatch(/^https:\/\//);
  });
});

describe("faqPageJsonLd", () => {
  const items = [
    { question: "How do you pick a number?", answer: "Pick the one you most want to move." },
    { question: "How many metrics?", answer: "Five at most." },
  ];
  const faq = faqPageJsonLd(items, `${SITE_URL}/blog/${post.slug}`);

  it("builds a valid FAQPage from the Q&As", () => {
    expect(faq).not.toBeNull();
    expect(faq!["@context"]).toBe("https://schema.org");
    expect(faq!["@type"]).toBe("FAQPage");
    expect(faq!.mainEntity).toEqual([
      {
        "@type": "Question",
        name: "How do you pick a number?",
        acceptedAnswer: { "@type": "Answer", text: "Pick the one you most want to move." },
      },
      {
        "@type": "Question",
        name: "How many metrics?",
        acceptedAnswer: { "@type": "Answer", text: "Five at most." },
      },
    ]);
  });

  it("returns null instead of an empty FAQPage", () => {
    expect(faqPageJsonLd([], `${SITE_URL}/blog/x`)).toBeNull();
  });
});

describe("site-wide JSON-LD", () => {
  it("describes the organisation without awards, addresses or client claims", () => {
    const org = organizationJsonLd();
    expect(org["@type"]).toBe("Organization");
    expect(org.name).toBe("Signalhaus");
    expect(org.legalName).toBe("Signalhaus LLC");
    expect(org.url).toBe(SITE_URL);
    for (const removed of ["award", "address", "foundingDate", "areaServed", "sameAs", "aggregateRating"]) {
      expect(org).not.toHaveProperty(removed);
    }
    expect(org.founder).toMatchObject({ name: "Nathan Stevenson", description: SITE.founder.bio });
    expect(roundTrip(org)).toEqual(org);
  });

  it("carries only the approved bio", () => {
    expect(SITE.founder.bio).toBe(
      "AI fintech founder and former quantitative researcher at CQS, an alternative asset manager."
    );
  });

  it("links the website to the organisation", () => {
    const site = websiteJsonLd();
    expect(site["@type"]).toBe("WebSite");
    expect(site.publisher).toEqual({ "@id": organizationJsonLd()["@id"] });
  });

  it("numbers breadcrumbs from one", () => {
    const crumbs = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Blog", path: "/blog" },
    ]);
    expect(crumbs.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
    ]);
  });
});
