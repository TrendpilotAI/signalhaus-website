import type { Metadata } from "next";
import { SITE } from "./site";

const DEFAULT_SHARE_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: `${SITE.name}. ${SITE.tagline}.`,
};

/**
 * Canonical URL plus the RSS feed link. A page that sets `alternates`
 * replaces the layout's value, so every page builds its own from here
 * and the feed link is never dropped.
 */
export function alternatesFor(path: string): NonNullable<Metadata["alternates"]> {
  return {
    canonical: path,
    types: {
      "application/rss+xml": [{ url: "/feed.xml", title: `${SITE.name} guides` }],
    },
  };
}

interface SharePage {
  title: string;
  description: string;
  path: string;
}

/**
 * Open Graph and Twitter fields for a page. Next.js replaces the layout's
 * `openGraph` and `twitter` objects whole when a page sets them, so the
 * site name and the default share image are repeated here.
 */
export function shareMetadataFor(page: SharePage): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: SITE.name,
      title: page.title,
      description: page.description,
      url: page.path,
      images: [DEFAULT_SHARE_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: [DEFAULT_SHARE_IMAGE],
    },
  };
}
