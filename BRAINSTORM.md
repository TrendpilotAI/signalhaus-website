# BRAINSTORM.md — SignalHaus Website
*Last Updated: 2026-03-10 | v2 by Judge Agent*

## 2026-03-10 Refresh — Delta Since 2026-03-09

### What Changed
- No new commits since 2026-03-09 analysis
- Critical bugs remain live in production: in-memory rate limiter broken
- All prior brainstorm items are still pending
- `src/lib/mdx.ts` already has `PostFrontmatter` typed (AUDIT.md item was already done ✅)
- ROI `calculate()` function exists in `ROICalculator.tsx` — extractable for testing

### New Insights This Cycle
1. **Logo.png missing** — `layout.tsx` JSON-LD references `/logo.png` but file doesn't exist in `/public`. Search crawlers will 404 on this.
2. **ROI calculator math is extractable** — `calculate()` function in `ROICalculator.tsx` is a pure function (no side effects). Should move to `src/lib/roi.ts` for testability.
3. **About page has no JSON-LD** — About page references Nathan Stevenson as founder but no `Person` schema markup.
4. **Header has 7 nav items** — ROI Calculator in top nav is unusual for a marketing site. Consider moving to a CTA-prominent position.
5. **No 404 page** — Missing `src/app/not-found.tsx`. Next.js default 404 has no branding.
6. **Feed.xml route exists** — RSS feed is implemented (`src/app/feed.xml/route.ts`) but not linked anywhere.

---

## Current State Summary
Next.js 16 App Router marketing site for SignalHaus AI consultancy (signalhaus.ai).

**What's working:**
- Landing page with hero, services, results metrics ($50M+, 60-80% time savings, 100% retention), pricing preview, testimonials carousel
- Blog: 5 MDX posts, tag filtering, RSS feed, dynamic sitemap.ts — typed PostFrontmatter interface
- Case studies page (3 case studies with metrics)
- Interactive ROI calculator with wizard UI + 5-step lead capture
- Contact form: Resend email + Slack webhook, manual validation, HTML escaping
- Analytics: GA4, Microsoft Clarity, LinkedIn Insight Tag
- Security: CSP/HSTS headers, JSON-LD structured data (Organization, WebSite, Service, Article)
- Deployed on Vercel, Next.js 16, TailwindCSS v4, TypeScript strict

**Critical Gaps:**
- 0% test coverage — no test files anywhere
- In-memory rate limiter broken on serverless cold starts (Map resets per instance) — **LIVE BUG**
- No CRM integration (HubSpot/Pipedrive) — leads die in email
- No Cloudflare Turnstile / CAPTCHA — bots can spam contact form
- No dynamic OG images — blog posts share static `/og-image.png`
- `/logo.png` referenced in JSON-LD but missing from `/public` — 404 for crawlers
- No `/services/[slug]` or `/case-studies/[slug]` detail pages — shallow content hurts SEO
- No newsletter signup or drip sequence
- No booking embed (Calendly/cal.com)
- No CI/CD pipeline (GitHub Actions)
- No branded 404 page

**Scores:** Revenue Potential: 7 | Strategic Value: 8 | Completeness: 7 | Urgency: 7 | Effort Remaining: 7

---

## 1. 🚀 New Features (Revenue Impact)

### 1.1 CRM Integration — HubSpot Contact Sync ⭐ HIGH PRIORITY
**Effort:** 2h | **Impact:** High
Every contact form submission should create/update a HubSpot contact with deal properties.
Currently leads go to email + Slack and could be lost. HubSpot free tier supports this.
- Add `HUBSPOT_API_TOKEN` env var
- POST to HubSpot Contacts API from `/api/contact` handler
- Map: name → firstname/lastname, email → email, company → company, budget → budget field

### 1.2 Booking Embed — Calendly/cal.com ⭐ HIGH PRIORITY
**Effort:** 2h | **Impact:** High
Replace "Book a Free Consultation" CTA with inline calendar embed on `/contact` page.
Users can book directly instead of waiting for follow-up. Higher conversion.
- Embed `<CalendlyWidget />` component on contact page
- Add to hero CTA as second option

### 1.3 Newsletter Signup + Drip Sequence ⭐ HIGH PRIORITY
**Effort:** 4h | **Impact:** High
Capture email leads who aren't ready to book. Nurture via Resend Audiences.
- Add `/api/subscribe` route → Resend Audiences API
- Newsletter CTA component: in blog sidebar, footer, homepage
- 5-email drip: welcome → AI strategy tips → case study → ROI calculator CTA → book call

### 1.4 Dynamic OG Images via next/og ⭐ MEDIUM PRIORITY
**Effort:** 3h | **Impact:** Medium (SEO/social sharing)
Blog posts currently share one static OG image. Each post should have a unique card.
- Create `/app/og/route.tsx` using `new ImageResponse`
- Add `?title=&author=&date=` params → render branded card
- Update blog `[slug]/page.tsx` metadata to point to dynamic OG

### 1.5 Service Detail Pages `/services/[slug]` ⭐ MEDIUM PRIORITY
**Effort:** 4h | **Impact:** Medium-High (SEO depth)
Current `/services` is a single page. Each service needs a dedicated URL for:
- Long-tail SEO keywords ("AI strategy consulting for financial services")
- Case study cross-links
- Service-specific FAQs and pricing context

### 1.6 Case Study Detail Pages `/case-studies/[slug]` ⭐ MEDIUM PRIORITY
**Effort:** 3h | **Impact:** Medium-High
Detailed MDX case studies with methodology, results, testimonials, and CTAs.
Unlocks schema markup for `CaseStudy` structured data.

### 1.7 Email ROI Report from Calculator
**Effort:** 3h | **Impact:** Medium
After ROI calc lead capture, email a branded HTML report.
- Create ROI report email template in Resend
- Pass calculated results to `/api/roi-email`
- Drive perceived value, warm leads for follow-up

### 1.8 Branded 404 Page ⭐ NEW
**Effort:** 30min | **Impact:** Medium
Create `src/app/not-found.tsx` with SignalHaus branding, nav links, and CTA.
Default Next.js 404 looks unprofessional.

### 1.9 Fix Missing Logo.png ⭐ NEW — QUICK WIN
**Effort:** 15min | **Impact:** Medium (SEO/JSON-LD)
`layout.tsx` references `https://www.signalhaus.ai/logo.png` in Organization JSON-LD.
This file doesn't exist in `/public`. Upload or create a PNG logo to fix 404.

### 1.10 Link RSS Feed in Layout
**Effort:** 15min | **Impact:** Low-Medium
The RSS feed exists at `/feed.xml` but isn't discoverable. Add `<link rel="alternate" type="application/rss+xml">` to layout `<head>`.

---

## 2. 🔧 Code Quality

### 2.1 Replace In-Memory Rate Limiter with Upstash Redis ⭐ CRITICAL
**Effort:** 1h | **Impact:** Critical (correctness)
Current `Map<string, RateEntry>` resets on every serverless cold start.
On Vercel, this means the rate limiter provides zero protection in production.
- Install `@upstash/ratelimit` + `@upstash/redis`
- Replace `rateLimitStore` Map with `Ratelimit.slidingWindow(5, "15m")`
- Needs `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` env vars

### 2.2 Extract ROI `calculate()` to `src/lib/roi.ts` ⭐ NEW
**Effort:** 30min | **Impact:** Low-Medium (testability)
Pure function in `ROICalculator.tsx` is untestable in its current location (client component).
Move to `src/lib/roi.ts` for unit testing.

### 2.3 Shared Metadata Defaults — DRY
**Effort:** 1h | **Impact:** Low-Medium
Pages repeat `openGraph.images[0].url` and site URL. Extract to `src/lib/seo.ts`.

### 2.4 Add Zod for Contact Validation
**Effort:** 1h | **Impact:** Medium
Replace hand-rolled `validateContact()` with Zod schema. Reduces surface area, improves error messages.

---

## 3. 🧪 Testing ⭐ CRITICAL GAP

**Current:** 0% test coverage. No test infrastructure at all.

### 3.1 Vitest Unit Tests ⭐ CRITICAL
**Effort:** 2-3h
- `validateContact()` logic — all branches (missing name, bad email, XSS patterns, budget whitelist)
- `calculate()` ROI math — known inputs → expected outputs
- `getAllPostsMeta()` MDX parsing — sorted by date DESC
- `getPostBySlug()` — returns null for missing slug

### 3.2 API Route Tests (Vitest + msw)
**Effort:** 2h
- Mock Resend + Slack, test `/api/contact` happy path and error cases
- Test rate limit headers (once Upstash is in)

### 3.3 Playwright E2E Tests
**Effort:** 4h
- Contact form: submit valid data, validation errors, rate limit message
- ROI calculator: step through wizard, verify calculation output
- Navigation: all top-level pages return 200

---

## 4. 🔌 Integrations

### 4.1 Cloudflare Turnstile Bot Protection ⭐ HIGH PRIORITY
**Effort:** 2h
Replace manual XSS guards with Turnstile challenge.
- `<Turnstile siteKey={...} />` on ContactForm
- Server-side verify `cf-turnstile-response` token in `/api/contact`
- Free tier, no UX impact (invisible/managed mode)

### 4.2 HubSpot CRM (see 1.1)

### 4.3 Vercel Analytics + Speed Insights
**Effort:** 0.5h
Already on Vercel → just add `<Analytics />` + `<SpeedInsights />` components.

### 4.4 Sentry Error Monitoring
**Effort:** 1h
`@sentry/nextjs` for API route exception capture.

---

## 5. ⚙️ Workflows / CI-CD

### 5.1 GitHub Actions CI Pipeline ⭐ HIGH PRIORITY
**Effort:** 1h
No automation currently. Create `.github/workflows/ci.yml`:
- Steps: checkout → setup-node → npm ci → lint → typecheck → build → test → npm audit

### 5.2 ESLint + Prettier Config
**Effort:** 1h
No linting config beyond Next.js defaults.

### 5.3 Dependabot
**Effort:** 15min
Create `.github/dependabot.yml` for automated dependency updates with grouped PRs.

---

## 6. ⚡ Performance

### 6.1 Lazy-load TestimonialCarousel
**Effort:** 0.5h
Move to `dynamic(() => import(...), { ssr: false })`.

### 6.2 Blog Posts Filesystem Caching
**Effort:** 0.5h
`getAllPostsMeta()` reads FS on every request. Add `React.cache()` or `revalidate = 3600`.

### 6.3 Bundle Analysis
**Effort:** 0.5h
Run `@next/bundle-analyzer` to check ROI calculator bundle impact.

---

## 7. 🔒 Security

### 7.1 Upstash Rate Limiting (see 2.1) — CRITICAL
### 7.2 Cloudflare Turnstile (see 4.1) — HIGH
### 7.3 CSP nonce for `unsafe-inline` styles
**Effort:** 2h — Implement nonce-based CSP for stronger XSS protection.

---

## Priority Matrix (Updated 2026-03-10)

| # | Item | Impact | Effort | Priority |
|---|------|--------|--------|----------|
| 1.9 | Fix missing logo.png | Medium | 15min | P0 |
| 2.1 | Upstash rate limiter | Critical | 1h | P0 |
| 4.1 | Cloudflare Turnstile | High | 2h | P0 |
| 5.1 | GitHub Actions CI | High | 1h | P0 |
| 1.8 | Branded 404 page | Medium | 30min | P0 |
| 1.1 | HubSpot CRM sync | High | 2h | P1 |
| 1.2 | Calendly booking embed | High | 2h | P1 |
| 1.3 | Newsletter + drip | High | 4h | P1 |
| 3.1 | Vitest unit tests | High | 3h | P1 |
| 2.2 | Extract ROI calculate() | Low | 30min | P1 |
| 1.10 | Link RSS feed | Low | 15min | P1 |
| 1.4 | Dynamic OG images | Medium | 3h | P2 |
| 1.5 | /services/[slug] pages | Medium | 4h | P2 |
| 1.6 | /case-studies/[slug] | Medium | 3h | P2 |
| 3.3 | Playwright E2E tests | Medium | 4h | P2 |
| 2.4 | Zod validation | Medium | 1h | P2 |
| 2.3 | seo.ts constants (DRY) | Low | 1h | P2 |
| 1.7 | Email ROI report | Medium | 3h | P2 |
| 4.3 | Vercel Analytics | Low | 0.5h | P3 |
| 4.4 | Sentry | Low | 1h | P3 |
| 6.1 | Lazy carousel | Low | 0.5h | P3 |
| 7.3 | CSP nonce | Low | 2h | P3 |
