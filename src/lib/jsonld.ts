import type { FaqItem } from "./faq";
import { SITE, SITE_URL, absoluteUrl } from "./site";

export type JsonLdObject = Record<string, unknown>;

const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const FOUNDER_ID = `${SITE_URL}/about#nathan-stevenson`;

/**
 * Serialises JSON-LD for a script tag. Escaping "<" stops a string value
 * such as "</script>" from closing the tag early.
 */
export function serializeJsonLd(data: JsonLdObject | JsonLdObject[]): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function personJsonLd(): JsonLdObject {
  return {
    "@type": "Person",
    "@id": FOUNDER_ID,
    name: SITE.founder.name,
    description: SITE.founder.bio,
    url: absoluteUrl("/about"),
  };
}

export function organizationJsonLd(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: SITE.name,
    legalName: SITE.legalName,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/icon.svg"),
    },
    description: SITE.description,
    founder: personJsonLd(),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      url: absoluteUrl("/contact"),
    },
  };
}

export function websiteJsonLd(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_URL,
    name: SITE.name,
    description: SITE.description,
    inLanguage: "en",
    publisher: { "@id": ORGANIZATION_ID },
  };
}

export interface ArticleInput {
  slug: string;
  title: string;
  excerpt: string;
  /** ISO date, e.g. "2026-11-23". */
  date: string;
  updated?: string;
  author: string;
  tags: string[];
  wordCount?: number;
}

export function articleUrl(slug: string): string {
  return absoluteUrl(`/blog/${slug}`);
}

function isoDate(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date for JSON-LD: ${date}`);
  }
  return parsed.toISOString();
}

export function articleJsonLd(post: ArticleInput): JsonLdObject {
  const url = articleUrl(post.slug);
  const article: JsonLdObject = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline: post.title,
    description: post.excerpt,
    datePublished: isoDate(post.date),
    dateModified: isoDate(post.updated ?? post.date),
    inLanguage: "en",
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    image: absoluteUrl(`/blog/${post.slug}/opengraph-image`),
    author:
      post.author === SITE.founder.name ? personJsonLd() : { "@type": "Person", name: post.author },
    publisher: {
      "@type": "Organization",
      "@id": ORGANIZATION_ID,
      name: SITE.name,
      logo: { "@type": "ImageObject", url: absoluteUrl("/icon.svg") },
    },
    isPartOf: { "@id": WEBSITE_ID },
  };
  if (post.tags.length > 0) article.keywords = post.tags.join(", ");
  if (post.wordCount) article.wordCount = post.wordCount;
  return article;
}

/** Returns null when there are no questions, because an empty FAQPage is invalid. */
export function faqPageJsonLd(items: FaqItem[], pageUrl: string): JsonLdObject | null {
  if (items.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${pageUrl}#faq`,
    url: pageUrl,
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export interface Breadcrumb {
  name: string;
  path: string;
}

export function breadcrumbJsonLd(crumbs: Breadcrumb[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}
