import { describe, expect, it } from "vitest";
import { alternatesFor, shareMetadataFor } from "../metadata";

describe("alternatesFor", () => {
  it("sets the canonical path and keeps the RSS feed link", () => {
    const alternates = alternatesFor("/blog/some-post");
    expect(alternates.canonical).toBe("/blog/some-post");
    expect(alternates.types?.["application/rss+xml"]).toEqual([
      { url: "/feed.xml", title: "Signalhaus guides" },
    ]);
  });
});

describe("shareMetadataFor", () => {
  const share = shareMetadataFor({ title: "About Signalhaus", description: "Who runs it.", path: "/about" });

  it("carries the site name and the page's own title, description and URL", () => {
    expect(share.openGraph).toMatchObject({
      type: "website",
      siteName: "Signalhaus",
      title: "About Signalhaus",
      description: "Who runs it.",
      url: "/about",
    });
  });

  it("gives the Twitter card the page's title, not the site default", () => {
    expect(share.twitter).toMatchObject({
      card: "summary_large_image",
      title: "About Signalhaus",
      description: "Who runs it.",
    });
  });

  it("keeps the share image on both cards", () => {
    const image = { url: "/opengraph-image", width: 1200, height: 630 };
    expect(share.openGraph?.images).toEqual([expect.objectContaining(image)]);
    expect(share.twitter?.images).toEqual([expect.objectContaining(image)]);
  });
});
