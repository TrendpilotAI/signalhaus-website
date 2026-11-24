# Signalhaus website

The marketing site for Signalhaus LLC, Nathan Stevenson's Services-as-Software consulting firm. It is an AI growth advisory for founders.

Built with Next.js 16 (App Router), TypeScript, Tailwind CSS v4 and an MDX blog.

## Local development

```bash
pnpm install
cp .env.example .env.local   # every value is optional for local work
pnpm dev                     # http://localhost:3000
```

| Command | What it does |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm test` | Run the Vitest suite |
| `pnpm lint` | ESLint with the Next.js config |
| `pnpm typecheck` | `tsc --noEmit` |

The project uses pnpm. `vercel.json` and CI both install with pnpm.

## Pages

| Route | What it is |
|---|---|
| `/` | Landing page with the Services-as-Software positioning and a lead form |
| `/services` | What the work covers, the weekly rhythm and three ways to work together |
| `/about` | Who Signalhaus is |
| `/blog` | The how-to guides |
| `/blog/[slug]` | One guide, with Article and FAQPage JSON-LD and a lead form |
| `/contact` | The lead form on its own |
| `/api/leads` | The server route behind every lead form |
| `/sitemap.xml`, `/robots.txt`, `/feed.xml` | Generated SEO files |

`/pricing`, `/case-studies`, `/roi-calculator` and the five older blog posts were taken down. They redirect with a temporary (307) redirect set in `next.config.ts`. The reasons are in `content/research/removed-claims.md`.

## Content

| Path | What it holds |
|---|---|
| `content/blog/*.mdx` | Published guides |
| `content/archive/blog/` | Older posts kept for reference. Nothing here is published |
| `content/research/questions.md` | The founder questions the guides answer |
| `content/research/toolkit-copy.md` | Copy angles from the Data-Driven Decision-Making Toolkit |
| `content/research/removed-claims.md` | Every claim and page removed in the rebuild, and why |

### Writing a guide

Add `content/blog/<slug>.mdx` with this frontmatter:

```mdx
---
title: "How to do the thing"
excerpt: "One or two plain sentences, 170 characters at most."
date: "2026-11-23"
topic: "positioning"   # due-diligence | positioning | prioritization | data-driven-decisions | other
order: 1               # optional, orders posts that share a date
tags: ["Positioning"]
author: "Nathan Stevenson"
---
```

Rules the tests in `src/lib/__tests__/posts.test.ts` enforce:

- Every H2 is a question that starts with How, What, When, Why, Who or Which.
- The first paragraph under each H2 answers it directly in one or two sentences. That pair becomes a FAQPage entry.
- Each post links to the other posts, to the landing page and to the toolkit.
- No em dashes, en dashes or semicolons in the prose.

## Lead capture

Every form posts to `/api/leads`. The route rate-limits by IP (5 requests per 15 minutes), drops honeypot submissions, validates the fields, then hands the lead to a list of sinks in `src/lib/leads/sinks/`.

| Sink | Runs when |
|---|---|
| Log | Always. Logs the structured lead |
| Resend email | `LEAD_RESEND_ENABLED` is exactly `true` and `RESEND_API_KEY` is set |
| Proton inbox copy | The Resend sink is on and `LEAD_PROTON_INBOX` is set |
| Lightfield | `LEAD_LIGHTFIELD_ENABLED` is exactly `true` and `LIGHTFIELD_API_KEY` is set |
| Slack | `LEAD_SLACK_ENABLED` is exactly `true` and `SLACK_WEBHOOK_URL` is set |

With no env vars set, only the log sink runs. A key on its own never turns a sink on.

Email is sent from `send.signalhaus.ai`. A From address on any other domain is ignored and the default `leads@send.signalhaus.ai` is used instead.

Each lead carries its source form, the page path, the post slug, the first page of the visit, the referrer and any UTM params. To add a sink, implement `LeadSink` from `src/lib/leads/pipeline.ts` and add it to `src/lib/leads/sinks/index.ts`.

## Environment variables

`.env.example` lists every variable with a description. None are required to run the site. Analytics tags (Google Analytics, Microsoft Clarity, LinkedIn Insight) render only when their `NEXT_PUBLIC_*` id is set.

Without the Upstash variables the rate limiter falls back to memory, which does not hold across serverless instances. Set them in production.

## Design

Colours, type and components follow the Signalhaus design system. The tokens are in `src/app/globals.css`. Icons and illustrations are inline SVG in `src/components/icons.tsx` and `src/components/illustrations.tsx`. Share images are generated in `src/lib/og/card.tsx`.

The three typefaces (Newsreader, Hanken Grotesk and DM Mono) are served from the site itself. `src/app/fonts.ts` loads the files from the `@fontsource` packages, so neither the build nor a visitor's browser makes a request to Google Fonts.

## Security headers

`next.config.ts` sets a Content Security Policy, HSTS, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` and `Permissions-Policy` on every route.
