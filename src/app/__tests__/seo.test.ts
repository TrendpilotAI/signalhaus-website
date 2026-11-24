import { describe, expect, it } from "vitest";
import nextConfig from "../../../next.config";
import { GET as feed } from "@/app/feed.xml/route";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { getAllPostsMeta } from "@/lib/mdx";
import { SITE_URL } from "@/lib/site";

const RETIRED = ["/pricing", "/case-studies", "/roi-calculator"];

describe("sitemap", () => {
  const urls = sitemap().map((entry) => entry.url);

  it("lists the live pages and every published post", () => {
    for (const path of ["/", "/services", "/about", "/blog", "/contact"]) {
      expect(urls).toContain(`${SITE_URL}${path}`);
    }
    for (const post of getAllPostsMeta()) {
      expect(urls).toContain(`${SITE_URL}/blog/${post.slug}`);
    }
  });

  it("does not list the pages that were taken down", () => {
    for (const path of RETIRED) {
      expect(urls).not.toContain(`${SITE_URL}${path}`);
    }
  });

  it("has no duplicate URLs", () => {
    expect(new Set(urls).size).toBe(urls.length);
  });
});

describe("redirects", () => {
  it("sends every retired page somewhere live, as a temporary redirect", async () => {
    const redirects = (await nextConfig.redirects?.()) ?? [];
    const list = Array.isArray(redirects) ? redirects : [];
    for (const path of RETIRED) {
      const redirect = list.find((entry) => entry.source === path);
      expect(redirect, path).toBeDefined();
      expect(redirect?.permanent).toBe(false);
      expect(["/services", "/blog", "/contact"]).toContain(redirect?.destination);
    }
  });

  it("does not redirect a published post", async () => {
    const redirects = (await nextConfig.redirects?.()) ?? [];
    const sources = (Array.isArray(redirects) ? redirects : []).map((entry) => entry.source);
    for (const post of getAllPostsMeta()) {
      expect(sources).not.toContain(`/blog/${post.slug}`);
    }
  });
});

describe("robots", () => {
  it("allows the site, keeps the API out and points at the sitemap", () => {
    const config = robots();
    expect(config.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
    expect(JSON.stringify(config.rules)).toContain("/api/");
  });
});

describe("feed", () => {
  it("is RSS with one item per published post", async () => {
    const response = feed();
    expect(response.headers.get("Content-Type")).toContain("application/rss+xml");
    const xml = await response.text();
    expect(xml.startsWith("<?xml")).toBe(true);
    const posts = getAllPostsMeta();
    expect(xml.match(/<item>/g)).toHaveLength(posts.length);
    for (const post of posts) {
      expect(xml).toContain(`<link>${SITE_URL}/blog/${post.slug}</link>`);
    }
  });
});
