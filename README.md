# SignalHaus.ai — Website

Production-ready marketing website for [SignalHaus AI consultancy](https://www.signalhaus.ai).  
Built with Next.js 16 App Router, Tailwind CSS v4, and TypeScript.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| Font | Inter (Google Fonts) |
| Email | Resend API |
| Rate limiting | Upstash Redis (sliding window) |
| Analytics | Google Analytics 4, Microsoft Clarity, LinkedIn Insight |
| Content | MDX (blog posts via `content/blog/`) |
| Testing | Vitest |

---

## Local Development

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values (see Environment Variables section)

# 3. Start dev server
pnpm dev
# → http://localhost:3000

# 4. Run tests
pnpm test
```

---

## Deploying to Vercel

### One-click deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/TrendpilotAI/signalhaus-website)

### Manual deploy

1. **Push to GitHub** (already done if you're reading this in the repo)

2. **Import in Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Git Repository" → select `TrendpilotAI/signalhaus-website`
   - Framework preset: **Next.js** (auto-detected)
   - Root directory: `.` (default)

3. **Set Environment Variables** (Vercel Dashboard → Project → Settings → Environment Variables)

   | Variable | Required | Description |
   |---|---|---|
   | `RESEND_API_KEY` | ✅ Yes | Resend API key for contact form emails |
   | `CONTACT_EMAIL` | ✅ Yes | Destination email for form submissions |
   | `UPSTASH_REDIS_REST_URL` | ✅ Recommended | Upstash Redis URL for rate limiting |
   | `UPSTASH_REDIS_REST_TOKEN` | ✅ Recommended | Upstash Redis token |
   | `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Optional | Google Analytics 4 measurement ID |
   | `NEXT_PUBLIC_CLARITY_PROJECT_ID` | Optional | Microsoft Clarity project ID |
   | `NEXT_PUBLIC_LINKEDIN_PARTNER_ID` | Optional | LinkedIn Insight Tag partner ID |
   | `SLACK_WEBHOOK_URL` | Optional | Slack webhook for lead notifications |

4. **Click Deploy** — Vercel will build and deploy automatically.

5. **Set up custom domain**
   - Vercel Dashboard → Project → Settings → Domains
   - Add `signalhaus.ai` and `www.signalhaus.ai`
   - Update DNS records as instructed by Vercel

> **Note on Upstash Redis:** Vercel is serverless — each request may hit a different function instance. Without Upstash Redis, the in-memory rate limiter doesn't persist across instances, meaning rate limits won't work correctly in production. Get a free Upstash database at [console.upstash.com](https://console.upstash.com).

---

## Environment Variables

See `.env.example` for the full list with descriptions.

### Getting your credentials

- **Resend API key:** [resend.com/api-keys](https://resend.com/api-keys) — verify `signalhaus.ai` as a sending domain
- **Upstash Redis:** [console.upstash.com](https://console.upstash.com) — create a database, copy REST URL + token
- **Google Analytics:** [analytics.google.com](https://analytics.google.com) — create a GA4 property
- **Microsoft Clarity:** [clarity.microsoft.com](https://clarity.microsoft.com) — create a project
- **LinkedIn Insight:** LinkedIn Campaign Manager → Account Assets → Insight Tag

---

## Pages

| Route | Description |
|---|---|
| `/` | Homepage — hero, services, social proof, pricing preview, CTA |
| `/services` | Service cards with deliverables |
| `/pricing` | 3-tier pricing (QuickStart, Growth, Enterprise) |
| `/about` | Nathan's bio, company timeline, values |
| `/contact` | Contact form (powered by Resend) |
| `/blog` | Blog listing + MDX-powered posts |
| `/blog/[slug]` | Individual blog posts from `content/blog/` |
| `/case-studies` | Client case studies |
| `/roi-calculator` | Interactive ROI calculator |
| `/sitemap.xml` | Auto-generated sitemap |
| `/feed.xml` | RSS feed for blog |
| `/_not-found` | Branded 404 page |

---

## SEO Features

- ✅ Unique `<title>` and `<meta description>` per page
- ✅ Open Graph tags (`og:image`, `og:title`, `og:description`) on every page
- ✅ Twitter Card (`summary_large_image`) on every page
- ✅ JSON-LD structured data (Organization + WebSite schemas)
- ✅ Canonical URLs
- ✅ Auto-generated sitemap at `/sitemap.xml`
- ✅ RSS feed at `/feed.xml`
- ✅ `robots.txt`
- ✅ Security headers (CSP, HSTS, X-Frame-Options, etc.)

---

## Content Management

### Blog posts

Blog posts live in `content/blog/` as MDX files:

```
content/
  blog/
    my-post-slug/
      index.mdx
```

Each post requires frontmatter:

```mdx
---
title: "Post Title"
date: "2025-03-11"
excerpt: "Short description shown in listing."
author: "Nathan Stevenson"
tags: ["AI", "Enterprise"]
---

Your content here...
```

### OG Image

Replace `public/og-image.png` with a 1200×630px image for social sharing.

### Logo

Replace `public/logo.png` with your brand logo (referenced in JSON-LD schema).

---

## Security

The site ships with production-ready security headers configured in `next.config.ts`:

- **Content Security Policy** — strict allowlist
- **HSTS** — 2-year max-age with preload
- **X-Frame-Options** — SAMEORIGIN
- **X-Content-Type-Options** — nosniff
- **Referrer-Policy** — strict-origin-when-cross-origin

### Rate Limiting

The `/api/contact` endpoint is rate-limited to **5 requests per IP per 15 minutes** using Upstash Redis sliding window. Falls back to per-process in-memory limiting when Redis is not configured (local dev only).

---

## Development

```bash
pnpm dev          # Start dev server (http://localhost:3000)
pnpm build        # Production build
pnpm start        # Serve production build
pnpm test         # Run Vitest tests
pnpm test:watch   # Watch mode
pnpm test:coverage # Coverage report
```

---

## License

Private — © SignalHaus AI. All rights reserved.
