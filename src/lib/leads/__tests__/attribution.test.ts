import { describe, expect, it } from "vitest";
import {
  buildAttribution,
  externalReferrer,
  firstTouchFromPage,
  parseFirstTouch,
  parseUtm,
  type PageContext,
} from "../attribution";
import { sanitizeAttribution } from "../schema";

const HOST = "www.signalhaus.ai";

function page(overrides: Partial<PageContext> = {}): PageContext {
  return { pathname: "/contact", search: "", referrer: "", host: HOST, ...overrides };
}

describe("parseUtm", () => {
  it("reads the five UTM params and ignores everything else", () => {
    expect(
      parseUtm(
        "?utm_source=linkedin&utm_medium=social&utm_campaign=launch&utm_term=founders&utm_content=post-1&gclid=abc"
      )
    ).toEqual({
      source: "linkedin",
      medium: "social",
      campaign: "launch",
      term: "founders",
      content: "post-1",
    });
  });

  it("returns an empty object when there are none", () => {
    expect(parseUtm("")).toEqual({});
    expect(parseUtm("?utm_source=&utm_medium=%20")).toEqual({});
  });
});

describe("externalReferrer", () => {
  it("keeps a referrer from another site", () => {
    expect(externalReferrer("https://news.ycombinator.com/item?id=1", HOST)).toBe(
      "https://news.ycombinator.com/item?id=1"
    );
  });

  it("drops a referrer from the same host, an empty one and a bad one", () => {
    expect(externalReferrer(`https://${HOST}/blog`, HOST)).toBeNull();
    expect(externalReferrer("", HOST)).toBeNull();
    expect(externalReferrer("not a url", HOST)).toBeNull();
    expect(externalReferrer("android-app://com.example", HOST)).toBeNull();
  });
});

describe("parseFirstTouch", () => {
  it("round-trips a stored first touch", () => {
    const stored = firstTouchFromPage(
      page({
        pathname: "/blog/how-to-position-a-startup",
        search: "?utm_source=newsletter",
        referrer: "https://mail.example.com/",
      })
    );
    expect(parseFirstTouch(JSON.stringify(stored))).toEqual(stored);
  });

  it("returns null for missing or corrupt storage", () => {
    expect(parseFirstTouch(null)).toBeNull();
    expect(parseFirstTouch("{nope")).toBeNull();
    expect(parseFirstTouch('"string"')).toBeNull();
    expect(parseFirstTouch('{"utm":{}}')).toBeNull();
  });
});

describe("buildAttribution", () => {
  it("captures lead source, page, post slug, UTM params and referrer", () => {
    const attribution = buildAttribution({
      leadSource: "blog-post",
      postSlug: "how-to-position-a-startup",
      page: page({
        pathname: "/blog/how-to-position-a-startup",
        search: "?utm_source=linkedin&utm_campaign=launch",
        referrer: "https://www.linkedin.com/",
      }),
      firstTouch: null,
    });
    expect(attribution).toEqual({
      leadSource: "blog-post",
      pagePath: "/blog/how-to-position-a-startup",
      postSlug: "how-to-position-a-startup",
      landingPath: "/blog/how-to-position-a-startup",
      referrer: "https://www.linkedin.com/",
      utm: { source: "linkedin", campaign: "launch" },
    });
  });

  it("keeps the first-touch campaign when the visitor submits from a later page", () => {
    const attribution = buildAttribution({
      leadSource: "contact",
      page: page({ referrer: `https://${HOST}/blog/how-to-position-a-startup` }),
      firstTouch: {
        landingPath: "/blog/how-to-position-a-startup",
        referrer: "https://www.linkedin.com/",
        utm: { source: "linkedin", campaign: "launch" },
      },
    });
    expect(attribution).toEqual({
      leadSource: "contact",
      pagePath: "/contact",
      postSlug: null,
      landingPath: "/blog/how-to-position-a-startup",
      referrer: "https://www.linkedin.com/",
      utm: { source: "linkedin", campaign: "launch" },
    });
  });

  it("prefers UTM params on the current URL over stored ones", () => {
    const attribution = buildAttribution({
      leadSource: "landing",
      page: page({ pathname: "/", search: "?utm_source=email" }),
      firstTouch: { landingPath: "/blog", referrer: null, utm: { source: "linkedin" } },
    });
    expect(attribution.utm).toEqual({ source: "email" });
    expect(attribution.landingPath).toBe("/blog");
  });

  it("produces a payload the server accepts unchanged", () => {
    const attribution = buildAttribution({
      leadSource: "blog-post",
      postSlug: "data-driven-decision-making-for-startups",
      page: page({
        pathname: "/blog/data-driven-decision-making-for-startups",
        search: "?utm_source=x&utm_medium=social",
        referrer: "https://x.com/",
      }),
      firstTouch: null,
    });
    expect(sanitizeAttribution(attribution)).toEqual(attribution);
  });
});
