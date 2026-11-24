export const SITE_URL = "https://www.signalhaus.ai";

export const TOOLKIT_URL =
  "https://gamma.app/docs/Data-Driven-Decision-Making-Toolkit-From-Analytics-to-Visualiza-smz2m6k9t7u666d";

export const SITE = {
  name: "Signalhaus",
  legalName: "Signalhaus LLC",
  url: SITE_URL,
  tagline: "Services-as-Software for founders",
  description:
    "Signalhaus is Nathan Stevenson's AI growth advisory for founders. Plain help with positioning, priorities, due diligence and the numbers, delivered as Services-as-Software.",
  founder: {
    name: "Nathan Stevenson",
    // The only bio the site is allowed to carry. See content/research/removed-claims.md.
    bio: "AI fintech founder and former quantitative researcher at CQS, an alternative asset manager.",
  },
} as const;

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
