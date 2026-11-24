# Removed claims

A log of every pricing figure, "featured by" logo, credential, client claim, result, testimonial and booking link taken off the site in the Services-as-Software rebuild, with where each one came from.

Nothing here has been judged true or false. These were removed because they are unconfirmed for the new positioning. Any of them can go back once the captain confirms it.

## How to restore something

- Everything in the "Repo" sections existed at commit `624321b8818f49e78cc2276cd9fc35a4a4d9936c` (`main` when this branch was cut). To see a file as it was: `git show 624321b:<path>`.
- Line numbers refer to that commit.
- Everything in the "Live site" sections was read from https://www.signalhaus.ai on 23 Nov 2026. The live site is a different build from this repo, so some live claims never existed in the repo.
- The five old blog posts are not deleted. They are in `content/archive/blog/` and are not published.

## The only bio the site now carries

> AI fintech founder and former quantitative researcher at CQS, an alternative asset manager.

---

## 1. Pricing

| # | Claim | Source | What happened |
|---|---|---|---|
| P1 | QuickStart (QuickStart Automation), $1,250 flat | Live home page and live `/pricing`. Repo: `src/app/page.tsx:31`, `src/app/pricing/page.tsx:19`, `src/components/ROICalculator.tsx:243`, `src/app/contact/ContactForm.tsx:103`, `content/blog/agentic-automation-future-of-gtm.mdx:40` | Removed |
| P2 | Growth Engine (Growth Engine Suite), from $4,800/month | Live home page and live `/pricing`. Repo: `src/app/page.tsx:32`, `src/app/pricing/page.tsx:35`, `src/components/ROICalculator.tsx:248`, `src/app/contact/ContactForm.tsx:104`, `src/lib/roi.ts` (`SIGNALHAUS_MONTHLY_COST = 4800`) | Removed |
| P3 | Intelligent Enterprise OS (Enterprise OS), $25K-$100K+ | Live home page and live `/pricing`. Repo: `src/app/page.tsx:33`, `src/app/pricing/page.tsx:52`, `src/app/contact/ContactForm.tsx:105` | Removed |
| P4 | Service catalog: Starter $5-10K, Growth $15-30K, Enterprise $50K+ | Listed in the task brief as being on the live site. I could not find it in this repo at `624321b` or on the live pages I could fetch (home and `/pricing`). It may be on a live page that is not linked. | Nothing to remove in the repo. Logged so it is not lost. |
| P5 | Tier feature lists ("Up to 3 custom automations", "10 automations + 5 AI agents", "Multi-agent orchestration", "SOC2-ready automation", "1 voice or chat agent") | `src/app/page.tsx:31-33`, `src/app/pricing/page.tsx:17-62` and `:160-180` | Removed |
| P6 | Offer structured data with prices 1250, 4800 and 25000 | `src/app/pricing/page.tsx:150-185` (JSON-LD) | Removed |
| P7 | Budget ranges on the contact form: Under $10K, $10K-$50K, $50K-$150K, $150K+ | `src/app/contact/ContactForm.tsx:100-107`, `src/app/api/contact/route.ts:95` | Removed. The new form asks what you are working on instead. |
| P8 | "All plans start with a free 30-minute discovery call" and "free 30-minute consultation" | `src/app/pricing/page.tsx:124`, `src/app/contact/page.tsx:7,11,24`, `src/app/case-studies/page.tsx:233`, `src/app/page.tsx:182` | Removed. The new site says to send a note and Nathan will reply. |
| P9 | "A two-week data readiness assessment can save six months of project delays" | `content/blog/data-integration-pitfalls.mdx:49` | Archived with the post |

Pages: `/pricing` is deleted and redirects to `/services`.

## 2. "Featured by" and partner badges

| # | Claim | Source | What happened |
|---|---|---|---|
| F1 | AI Hot 100 | Live home page "Featured by" strip. Repo: `src/app/page.tsx:8`, `src/app/layout.tsx:50` (Organization `award`), `src/app/about/page.tsx:21` | Removed |
| F2 | Harvard Alumni | Live home page strip. Repo: `src/app/page.tsx:5`, `src/app/about/page.tsx:7,49` ("Harvard alum") | Removed |
| F3 | World Economic Forum (WEF Technology Pioneer) | Live home page strip. Repo: `src/app/page.tsx:6`, `src/app/layout.tsx:54`, `src/app/about/page.tsx:7,19,49` | Removed |
| F4 | AWS (AWS Partner) | Live home page strip. Repo: `src/app/page.tsx:7` | Removed |
| F5 | AudienceLab | Live home page strip. Repo: `src/app/page.tsx:9`, `src/app/pricing/page.tsx:26,164` ("Intent data from AudienceLab") | Removed |
| F6 | Strip heading "Trusted by teams backed by" | `src/app/page.tsx` (badge section) | Removed |

## 3. Awards, accelerators and partners

| # | Claim | Source | What happened |
|---|---|---|---|
| A1 | AI Fintech 100, WealthTech 100, AI Hot 100, KPMG Top 50 Fintechs | Live home page "Experienced and Award Winning Team". Repo: `src/app/layout.tsx:49-55` (Organization `award` list), `src/app/about/page.tsx:21` | Removed |
| A2 | Banking Tech "Future of Data" finalists | Live home page only | Not in repo |
| A3 | Accelerators: Techstars (Techstars Barclays Accelerator), Fintech Innovation Lab, SixThirty, RevTech Labs, MassChallenge, an insurtech accelerator | Live home page. Repo has Techstars only: `src/app/about/page.tsx:7,18,49` | Removed |
| A4 | Technology partners: Salesforce, Snowflake, Microsoft, Oracle, Google, plus Anthropic and OpenAI | Live home page only | Not in repo |

## 4. Founder and team credentials

| # | Claim | Source | What happened |
|---|---|---|---|
| C1 | "Former CEO of ForwardLane" and the ForwardLane founding story | Live home page "About the Founder". Repo: `src/app/about/page.tsx:7,17,46` | Removed. Replaced by the one allowed bio line. |
| C2 | CRO-level expertise from OpenTable, Booker and VTS | Live home page. Repo: `src/app/about/page.tsx:52` | Removed |
| C3 | Greyscale and the Ned private members club | Live home page. Repo: `src/app/about/page.tsx:52` | Removed |
| C4 | "15+ years building AI for the world's largest financial institutions" | `src/app/about/page.tsx:7,33,46` | Removed |
| C5 | "We've shipped AI products used by the world's largest financial institutions" | `src/app/services/page.tsx:45` | Removed |
| C6 | Timeline 2014 to 2024 (founding, accelerator, WEF, enterprise deployments, awards, Signalhaus launch) | `src/app/about/page.tsx:16-23` | Removed |
| C7 | Organization structured data: founder job title "Founder & CEO", founding date 2023, Fort Lauderdale address, `areaServed` United States | `src/app/layout.tsx:26-39` | Removed. The new Organization JSON-LD has the name, legal name, URL, logo, description, contact page and the founder with the one-line bio. Nothing else. |
| C8 | Author line "SignalHaus Team" on blog posts | All five old posts | Archived. New posts are by Nathan Stevenson. |
| C9 | The course Nathan first prepared the toolkit for, and the institution behind it | Private call notes and the toolkit deck. Never on the site. | Not used. It is a credential claim, so the site links to the toolkit without naming the course. |

## 5. Client lists

| # | Claim | Source | What happened |
|---|---|---|---|
| L1 | BNY Pershing, Invesco, LPL Financial, Columbia Threadneedle | Live home page. Repo: `src/app/about/page.tsx:20,46` | Removed |
| L2 | ABN AMRO, BMO Harris, Allianz, Securian, JSE, Nasdaq, Oracle | Live home page only | Not in repo |
| L3 | "Fortune 500 clients" | `content/blog/agentic-automation-future-of-gtm.mdx:3` | Archived with the post |
| L4 | "A dozen growth-stage and enterprise clients" | `content/blog/building-ai-first-sales-stack.mdx:53` | Archived with the post || L5 | "Dozens of implementations" | `content/blog/data-integration-pitfalls.mdx:11` | Archived with the post |

## 6. Results and numbers

| # | Claim | Source | What happened |
|---|---|---|---|
| R1 | "60-80% less time on manual workflows" | `src/app/page.tsx:37`, `src/app/case-studies/page.tsx:138`, `src/app/pricing/page.tsx:127`, `content/blog/agentic-automation-future-of-gtm.mdx:32`, `BRAINSTORM.md:27` | Removed from pages. `BRAINSTORM.md` is an internal planning note and is left alone. |
| R2 | "$50M+ revenue impact" / "$50M+ enterprise value delivered" | `src/app/page.tsx:38`, `src/app/case-studies/page.tsx:139`, `src/app/about/page.tsx:20` | Removed |
| R3 | "30 days from kickoff to first automation in production", "ROI within 30 days", "in 30 days, not 6 months" | `src/app/page.tsx:39,182`, `src/app/case-studies/page.tsx:140`, `src/app/about/page.tsx:73`, `src/app/layout.tsx:81,100` (site description) | Removed |
| R4 | "100% client retention - every engagement renews" | `src/app/page.tsx:40`, `src/app/case-studies/page.tsx:141` | Removed |
| R5 | Hero line "Your team spends 60% of their time..." | `src/app/page.tsx:50` | Removed |
| R6 | "Rapid Prototyping - idea to prototype in 72 hours" | Live home page only. Repo version says "2-4 weeks": `src/app/services/page.tsx:39` | Removed |
| R7 | "Cut analyst time by 75%" and "triple pipeline velocity" teaser | `src/app/services/page.tsx:124` | Removed |
| R8 | "One financial services client replaced three full-time data entry roles" | `content/blog/agentic-automation-future-of-gtm.mdx:32` | Archived with the post |
| R9 | "Year 1 ROI lands between 180-350%. Break-even is typically 4-7 months" and other rule-of-thumb percentages | `content/blog/ai-roi-calculator-guide.mdx:33,51,57,59` | Archived with the post |
| R10 | "The average enterprise sales team uses 15+ tools" and "a rep who used to spend 20 minutes researching a prospect now spends 5" | `content/blog/building-ai-first-sales-stack.mdx:11,59` | Archived with the post |
| R11 | "40% of the customer records have duplicate entries" (told as a typical story) | `content/blog/data-integration-pitfalls.mdx:15` | Archived with the post |

## 7. Case studies

The whole `/case-studies` page is deleted and redirects to `/blog`. It held four unnamed case studies, each with metrics and a quote.

| # | Case study | Figures claimed | Source |
|---|---|---|---|
| S1 | "Global Wealth Manager" (a top-10 US wealth management firm) | 2,400+ analyst hours per quarter, 75% less reporting time, $1.2M saved a year | `src/app/case-studies/page.tsx:18-40` |
| S2 | "Mid-Market Asset Manager" ($40B AUM) | 3x pipeline velocity, 68% less research time, 22% better first-call conversion | `src/app/case-studies/page.tsx:41-62` |
| S3 | "Enterprise SaaS" (Series C) | Onboarding from 6-8 weeks to days, 80% faster, 60% fewer tickets, 2 deals closed in 30 days | `src/app/case-studies/page.tsx:63-84` |
| S4 | "Regional Insurance Group" | 800+ documents a month, 82% less processing time, 99.1% extraction accuracy | `src/app/case-studies/page.tsx:85-106` |
| S5 | Aggregate stats block (60-80%, $50M+, 30 days, 100%) | See R1 to R4 | `src/app/case-studies/page.tsx:136-142` |

## 8. Testimonials and quotes

All five are unattributed to a named person. Removed with `src/components/TestimonialCarousel.tsx`, which is deleted. Four of them also appeared on `/case-studies`.

| # | Attributed to | Opening words | Source |
|---|---|---|---|
| T1 | SVP of Operations, "Fortune 500 Wealth Manager" | "We went from dreading quarter-end to not noticing it..." | `src/components/TestimonialCarousel.tsx:6-13`, `src/app/case-studies/page.tsx:34-37` |
| T2 | Head of Distribution, "Mid-Market Asset Manager" | "Our reps went from guessing to knowing..." | `src/components/TestimonialCarousel.tsx:14-21`, `src/app/case-studies/page.tsx:56-59` |
| T3 | VP of Customer Success, "Series C Enterprise SaaS" | "Prospects that ghosted us during POC are now live customers..." | `src/components/TestimonialCarousel.tsx:22-29`, `src/app/case-studies/page.tsx:78-81` |
| T4 | Chief Compliance Officer, "Regional Insurance Group" | "Our compliance team now actually does compliance work..." | `src/components/TestimonialCarousel.tsx:30-37`, `src/app/case-studies/page.tsx:100-103` |
| T5 | Chief Data Officer, "Global Financial Institution" | "The ROI conversation was a non-issue..." | `src/components/TestimonialCarousel.tsx:38-45` |

## 9. ROI calculator

`/roi-calculator` is deleted and redirects to `/contact`. Its outputs were built on assumptions that are themselves unconfirmed claims.

| # | Item | Source |
|---|---|---|
| X1 | Assumptions: $75 average hourly rate, 70% of manual time automated, 30% conversion lift, $4,800 monthly cost | `src/lib/roi.ts:21-24` |
| X2 | The calculator UI and its plan recommendation (QuickStart or Growth Engine, with prices) | `src/components/ROICalculator.tsx` |
| X3 | The page and its metadata | `src/app/roi-calculator/page.tsx` |
| X4 | 19 unit tests for the maths | `src/lib/__tests__/roi.test.ts` |
| X5 | A hardcoded third-party form endpoint that received calculator leads | `src/components/ROICalculator.tsx:101` |
| X6 | A hardcoded booking link that carried the ROI figures in its query string | `src/components/ROICalculator.tsx:163` |

## 10. Booking widgets and other integrations

| # | Item | Source | What happened |
|---|---|---|---|
| B1 | Inline booking widget on `/contact` (a 30-minute slot) and its third-party script | `src/app/contact/page.tsx:28-45` | Removed. I could not confirm the booking link is live and current. The form is the only way in for now. |
| B2 | Booking domains in the Content Security Policy | `next.config.ts` | Removed with the widget |
| B3 | Old contact endpoint `/api/contact` that emailed through Resend whenever `RESEND_API_KEY` was set, from a root-domain address | `src/app/api/contact/route.ts` | Deleted. `/api/leads` replaces it, and email is off unless `LEAD_RESEND_ENABLED` is exactly `true`. |
| B4 | Contact email address and company LinkedIn link in the Organization structured data, and the same email as the RSS author | `src/app/layout.tsx:40-48`, `src/app/feed.xml/route.ts:33` | Removed. I could not confirm either is live. The structured data points at `/contact`, and the feed names the author without an address. |
| B5 | Search action in the WebSite structured data pointing at `/blog?q=` | `src/app/layout.tsx:65-69` | Removed. The blog has no search, so the markup described a feature that does not exist. |

## 11. Pages

| Old page | What happened | Why |
|---|---|---|
| `/` | Rewritten | Carried pricing, badges, results and testimonials |
| `/about` | Rewritten | Carried credentials, client lists and the timeline. Now one short page with the allowed bio. |
| `/services` | Rewritten | Carried six service lines with result claims. Now explains Services-as-Software and the three ways to work together, with no prices. |
| `/pricing` | Deleted. Temporary redirect to `/services` | Pricing is unconfirmed |
| `/case-studies` | Deleted. Temporary redirect to `/blog` | Every case study is unconfirmed |
| `/roi-calculator` | Deleted. Temporary redirect to `/contact` | Built on unconfirmed assumptions and prices |
| `/contact` | Rewritten | Budget select and booking widget removed. New lead form. |
| `/blog` and `/blog/[slug]` | Kept, restyled | Lists the four new posts |
| `/api/contact` | Deleted | Replaced by `/api/leads` |

The redirects are temporary (307) on purpose, so that restoring a page later does not fight a cached permanent redirect.

## 12. Blog posts

None of the five existing posts fits the new positioning. All five are written in a company "we" voice for enterprise buyers, and all five lean on client or result claims. They are archived, not deleted, in `content/archive/blog/`. Each old URL redirects (temporarily) to `/blog`.

| Old post | Slug | Why archived |
|---|---|---|
| Agentic Automation: Why AI Agents Are the Future of Go-to-Market | `agentic-automation-future-of-gtm` | "Fortune 500 clients", "60-80%", a client staffing claim, QuickStart at $1,250 |
| AI ROI calculator guide | `ai-roi-calculator-guide` | ROI and break-even ranges presented as typical results. Points to the deleted calculator. |
| Building an AI-first sales stack | `building-ai-first-sales-stack` | "A dozen growth-stage and enterprise clients", benchmark figures |
| Data integration pitfalls | `data-integration-pitfalls` | "Dozens of implementations", a paid assessment offer |
| LLM prompt engineering for the enterprise | `llm-prompt-engineering-enterprise` | No hard claims, but it is an enterprise engineering piece in the team voice and does not fit a founder-to-founder site. The easiest one to bring back. |

## 13. Images and static files

| Item | Source | What happened |
|---|---|---|
| Logo with the tagline "Pragmatic AI. Real Impact." (dark theme) | `public/logo.png` | Deleted. Replaced by a text wordmark and an SVG icon in the new style. |
| Share image "SignalHaus - AI Strategy & Automation" (dark theme) | `public/og-image.png` | Deleted. Replaced by a generated share image in the new style. |
| Static sitemap listing `/pricing`, `/case-studies` and `/roi-calculator` | `public/sitemap.xml` | Deleted. `src/app/sitemap.ts` generates the sitemap. |
| Unused starter icons | `public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` | Deleted |
| Default favicon | `src/app/favicon.ico` | Deleted. `src/app/icon.svg` is the new icon. |
| Static robots file | `public/robots.txt` | Deleted. `src/app/robots.ts` generates it, with the same rules plus `/api/` kept out. |
| ROI maths and its tests | `src/lib/roi.ts`, `src/lib/__tests__/roi.test.ts`, `src/components/ROICalculator.tsx` | Deleted with the calculator (section 9) |
| Testimonial carousel | `src/components/TestimonialCarousel.tsx` | Deleted with the testimonials (section 8) |

## 14. Left alone on purpose

- `BRAINSTORM.md`, `PLAN.md`, `AUDIT.md` and `DEPLOY.md` are internal planning notes from the old build. `BRAINSTORM.md:27` repeats the "$50M+, 60-80%, 100% retention" line. These files are not served by the site, so they are untouched. The captain may want to delete them, since this repo is public.
- The live site is not touched by this branch. Everything in the "Live site" rows stays live until this branch is deployed.

## Summary

- 3 live pricing tiers and 1 service catalog (not found in repo)
- 5 "featured by" badges
- 5 awards, 6 accelerators, 7 technology partners
- 6 founder or team credential claims and a 6-entry timeline
- 11 named clients and 3 vague client-count claims
- 11 result or benchmark claims
- 4 case studies and 5 testimonials
- 1 ROI calculator with 4 baked-in assumptions
- 1 booking widget, 1 third-party form endpoint, 1 ungated email endpoint, 1 unconfirmed contact email and LinkedIn link, and 1 search action for a search that does not exist
- 3 pages deleted with redirects, 4 pages rewritten, 5 posts archived
