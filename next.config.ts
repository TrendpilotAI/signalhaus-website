import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/*
 * The analytics hosts below are only contacted when the matching
 * NEXT_PUBLIC_* id is set. See .env.example.
 */
const ContentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com https://www.google-analytics.com https://www.clarity.ms https://*.clarity.ms https://snap.licdn.com`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' data: blob: https://www.google-analytics.com https://www.googletagmanager.com https://*.clarity.ms https://c.bing.com https://px.ads.linkedin.com",
  "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://*.clarity.ms https://px.ads.linkedin.com",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: ContentSecurityPolicy },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

/*
 * Pages and posts that were taken down in the Services-as-Software rebuild.
 * Temporary (307) on purpose, so they can be reversed if a page comes back.
 * The reasons are logged in content/research/removed-claims.md.
 */
const retiredPaths: Array<{ source: string; destination: string }> = [
  { source: "/pricing", destination: "/services" },
  { source: "/case-studies", destination: "/blog" },
  { source: "/case-studies/:path*", destination: "/blog" },
  { source: "/roi-calculator", destination: "/contact" },
  { source: "/blog/agentic-automation-future-of-gtm", destination: "/blog" },
  { source: "/blog/ai-roi-calculator-guide", destination: "/blog" },
  { source: "/blog/building-ai-first-sales-stack", destination: "/blog" },
  { source: "/blog/data-integration-pitfalls", destination: "/blog" },
  { source: "/blog/llm-prompt-engineering-enterprise", destination: "/blog" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  async redirects() {
    return retiredPaths.map((path) => ({ ...path, permanent: false }));
  },
};

export default nextConfig;
