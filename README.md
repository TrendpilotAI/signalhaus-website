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

| Sink | Kind | Switched on by | Also needs |
|---|---|---|---|
| Log | Stub | Always on. Writes one line with a masked email, the topic, the source form and the post slug | |
| Resend email | Record | `LEAD_RESEND_ENABLED` exactly `true` | `RESEND_API_KEY`, `LEAD_NOTIFY_TO` |
| Proton inbox copy | Record | `LEAD_RESEND_ENABLED` exactly `true` and `LEAD_PROTON_INBOX` set | `RESEND_API_KEY` |
| Lightfield | Record | `LEAD_LIGHTFIELD_ENABLED` exactly `true` | `LIGHTFIELD_API_KEY`, `LIGHTFIELD_STAGE_LEAD` |
| Slack | Notify | `LEAD_SLACK_ENABLED` exactly `true` | `SLACK_WEBHOOK_URL` |

A key on its own never turns a sink on.

The pipeline fails closed, in every environment:

- `/api/leads` answers with success only when at least one record sink took the lead.
- Slack only notifies, so a Slack message on its own does not count. Neither does the log line, which never holds the name, the message or the full email (`j***@acme.com`, not the address).
- With no record sink switched on, every submission gets an error. That includes local development and Preview, so set up Resend or Lightfield before testing the form end to end.
- A sink that is switched on without the variables in the last column counts as failed, not skipped. The log says which variables are missing, and nothing about the lead.

When a submission is not accepted, the route answers 502 and the form shows "Something went wrong on our end, please try again in a minute", with everything the visitor typed still in place. All sinks share one 9 second deadline, and their requests are aborted when it passes.

### Lightfield

The Lightfield sink finds the contact by exact email (ignoring case), finds or creates the account, and creates an opportunity named `Signalhaus · <topic> · <company or name>`. If the contact was already in Lightfield and their account has an open opportunity with the `Signalhaus · ` prefix, the lead is added to that one as a note and no second opportunity is made. Existing records are never edited.

| Variable | What it does |
|---|---|
| `LIGHTFIELD_STAGE_LEAD` | Stage for a new opportunity. Use the option id of the Lead stage in the Signalhaus pipeline, which picks the stage and the pipeline together. A label works too, but alone it is looked up in the default pipeline. Required: with Lightfield switched on and this empty, the sink counts as failed |
| `LIGHTFIELD_PIPELINE_OPTION` | Optional. Pipeline for a new opportunity: its id or name. Only needed when `LIGHTFIELD_STAGE_LEAD` is a label |
| `LIGHTFIELD_OPPORTUNITY_DESCRIPTION_FIELD` | Key of the opportunity field that gets the description (source, page, post slug, topic, UTM, message). Opportunities have no such field until one is added in Lightfield. The note carries the same details either way |

Email is sent from `send.signalhaus.ai`. A From address on any other domain is ignored and the default `leads@send.signalhaus.ai` is used instead.

Each lead carries its source form, the page path, the post slug, the first page of the visit, the referrer and any UTM params. To add a sink, implement `LeadSink` from `src/lib/leads/pipeline.ts` and add it to `src/lib/leads/sinks/index.ts`.

## Environment variables

`.env.example` lists every variable with a description. None are required to build or browse the site. The lead forms need a record sink, as described above. Analytics tags (Google Analytics, Microsoft Clarity, LinkedIn Insight) render only when their `NEXT_PUBLIC_*` id is set.

Without the Upstash variables the rate limiter falls back to memory, which does not hold across serverless instances. Set them in production.

## Design

Colours, type and components follow the Signalhaus design system. The tokens are in `src/app/globals.css`. Icons and illustrations are inline SVG in `src/components/icons.tsx` and `src/components/illustrations.tsx`. Share images are generated in `src/lib/og/card.tsx`.

The three typefaces (Newsreader, Hanken Grotesk and DM Mono) are served from the site itself. `src/app/fonts.ts` loads the files from the `@fontsource` packages, so neither the build nor a visitor's browser makes a request to Google Fonts.

## Security headers

`next.config.ts` sets a Content Security Policy, HSTS, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` and `Permissions-Policy` on every route.
