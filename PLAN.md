# PLAN.md — SignalHaus Website Execution Plan
*Last Updated: 2026-03-10 | v2 by Judge Agent*

## Architecture Overview

The SignalHaus website is a **Next.js 16 App Router** marketing site on Vercel. Proposed changes span 4 layers:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Layer                            │
│  / → /blog → /case-studies → /roi-calculator → /contact         │
│  + NEW: /services/[slug] detail pages                           │
│  + NEW: /case-studies/[slug] detail pages                       │
│  + NEW: Newsletter CTA component (blog sidebar, footer, hero)   │
│  + NEW: Calendly embed on /contact                              │
│  + NEW: Branded 404 page                                        │
├─────────────────────────────────────────────────────────────────┤
│                         API Layer                                │
│  /api/contact  (Resend + Slack + NEW: HubSpot + Turnstile)     │
│  /api/subscribe  NEW: newsletter → Resend Audiences             │
│  /api/roi-email  NEW: email ROI report on lead capture          │
│  /og  NEW: dynamic OG image generation                          │
├─────────────────────────────────────────────────────────────────┤
│                     Infrastructure Layer                         │
│  Upstash Redis (serverless-safe rate limiting)                  │
│  Cloudflare Turnstile (bot protection)                          │
│  HubSpot CRM (lead sync)                                        │
│  Sentry (error monitoring)                                      │
│  Vercel Analytics + Speed Insights                              │
├─────────────────────────────────────────────────────────────────┤
│                       Testing Layer                              │
│  Vitest (unit: validateContact, ROI calc, MDX parsing)          │
│  Playwright E2E (contact form, ROI wizard, navigation)          │
│  GitHub Actions CI (lint → typecheck → build → test)            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Task Dependency Graph

```
P0 (No dependencies — do these first):
  [T-001] Upstash Redis rate limiter
  [T-002] Cloudflare Turnstile integration
  [T-003] GitHub Actions CI pipeline
  [T-004] ESLint + Prettier config
  [T-017] Fix missing logo.png
  [T-018] Branded 404 page

P1 (depends on P0 CI being green):
  [T-005] HubSpot CRM sync          (depends on T-001)
  [T-006] Calendly booking embed    (standalone)
  [T-007] Newsletter signup + drip  (standalone)
  [T-008] Vitest unit tests          (depends on T-004 linting)
  [T-019] Extract ROI calculate()   (prereq for T-008)
  [T-020] Link RSS feed in layout   (standalone, 15min)

P2 (depends on P1 stable):
  [T-009] Playwright E2E tests       (depends on T-008)
  [T-010] Dynamic OG images          (standalone)
  [T-011] /services/[slug] pages     (depends on content structure)
  [T-012] /case-studies/[slug] pages (depends on T-011 pattern)
  [T-013] Zod validation refactor    (depends on T-008 tests passing)
  [T-014] Email ROI report           (depends on T-007 email infra)
  [T-015] src/lib/seo.ts DRY refactor (standalone)

P3 (nice to have):
  [T-016] Vercel Analytics + Sentry  (standalone)
  [T-021] Bundle analysis + lazy carousel (standalone)
  [T-022] CSP nonce hardening        (standalone)
  [T-023] Dependabot config          (standalone, 15min)
```

---

## Recommended Execution Order

### Sprint 0 — Quick Wins (Day 1, ~2h)
1. **T-017** Fix missing logo.png — prevents JSON-LD 404
2. **T-018** Branded 404 page — professional touch
3. **T-020** Link RSS feed — 15-min win for blog discoverability

### Sprint 1 — Security & Infrastructure (Week 1, ~6h)
4. **T-001** Upstash Redis rate limiter — fixes critical serverless bug
5. **T-002** Cloudflare Turnstile — stops spam before CI catches it
6. **T-003** GitHub Actions CI — gate all future PRs
7. **T-004** ESLint + Prettier — standardize before more code lands

### Sprint 2 — Lead Capture & Conversion (Week 2, ~10h)
8. **T-005** HubSpot CRM sync — leads into pipeline immediately
9. **T-006** Calendly embed — reduce friction to booking
10. **T-007** Newsletter signup + drip — capture non-ready leads

### Sprint 3 — Testing Foundation (Week 3, ~6h)
11. **T-019** Extract ROI calculate() to src/lib/roi.ts
12. **T-008** Vitest unit tests — validate logic correctness
13. **T-009** Playwright E2E — full flow regression coverage
14. **T-013** Zod refactor — cleaner validation with type sharing

### Sprint 4 — SEO & Content Depth (Week 4, ~10h)
15. **T-010** Dynamic OG images — every blog post gets a card
16. **T-011** /services/[slug] pages — SEO depth per service
17. **T-012** /case-studies/[slug] pages — detailed social proof
18. **T-014** Email ROI report — nurture ROI calculator leads
19. **T-015** src/lib/seo.ts — eliminate repeated constants

### Sprint 5 — Polish & Observability (Week 5, ~4h)
20. **T-016** Vercel Analytics + Sentry
21. **T-021** Bundle analysis + lazy carousel
22. **T-022** CSP nonce hardening
23. **T-023** Dependabot config

---

## Detailed Task Specs

### T-001: Upstash Redis Rate Limiter
**Priority:** P0 | **Effort:** 1h | **Files:** `src/app/api/contact/route.ts`
```
Install: npm install @upstash/ratelimit @upstash/redis
Create src/lib/ratelimit.ts:
  import { Ratelimit } from "@upstash/ratelimit"
  import { Redis } from "@upstash/redis"
  export const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, "15m"),
    analytics: true,
  })
Replace in-memory Map usage in route.ts:
  const { success, reset } = await ratelimit.limit(ip)
  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000)
    return NextResponse.json({ error: "Too many requests" }, {
      status: 429, headers: { "Retry-After": String(retryAfter) }
    })
  }
Env vars: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
Acceptance: Rate limit persists across serverless cold starts
```

### T-002: Cloudflare Turnstile
**Priority:** P0 | **Effort:** 2h | **Files:** `src/app/contact/ContactForm.tsx`, `src/app/api/contact/route.ts`
```
Client: npm install @marsidev/react-turnstile
Add <Turnstile siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} onSuccess={setToken} />
Server: verify cf-turnstile-response token before processing form
  const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({ secret: TURNSTILE_SECRET_KEY, response: token }),
  })
Env vars: NEXT_PUBLIC_TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY
Acceptance: Bot submissions rejected with 400; real users unaffected
```

### T-003: GitHub Actions CI
**Priority:** P0 | **Effort:** 1h | **Files:** `.github/workflows/ci.yml`
```yaml
name: CI
on: [push, pull_request]
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run build
      - run: npm run test
      - run: npm audit --audit-level=moderate
```

### T-005: HubSpot CRM Sync
**Priority:** P1 | **Effort:** 2h | **Files:** `src/app/api/contact/route.ts`
```
After successful Resend send, fire-and-forget:
  POST https://api.hubapi.com/crm/v3/objects/contacts
  Authorization: Bearer ${HUBSPOT_ACCESS_TOKEN}
  { properties: { email, firstname, lastname, company, 
    budget__c (custom), lead_source: "signalhaus_website" } }
Handle upsert: if contact exists, PATCH /crm/v3/objects/contacts/{id}
Env vars: HUBSPOT_ACCESS_TOKEN
Acceptance: New contact appears in HubSpot within 30s of form submit
```

### T-006: Calendly Embed
**Priority:** P1 | **Effort:** 2h | **Files:** `src/app/contact/page.tsx`, `src/components/CalendlyWidget.tsx`
```
Create CalendlyWidget (client component, dynamic import ssr:false)
Load Calendly inline-widget via script tag
Props: url (from env NEXT_PUBLIC_CALENDLY_URL)
Add to /contact page above form as primary CTA
Update CSP connect-src to include calendly.com
Acceptance: User can book meeting without leaving page
```

### T-007: Newsletter Signup
**Priority:** P1 | **Effort:** 4h | **Files:** `src/app/api/subscribe/route.ts`, `src/components/NewsletterCTA.tsx`
```
API: POST /api/subscribe
  - Validate email
  - POST to Resend Audiences: https://api.resend.com/audiences/{id}/contacts
  - Return 200 or 409 (already subscribed)
Component: email input + submit, success/error states
Placement: blog sidebar, homepage after hero, footer
Env vars: RESEND_AUDIENCE_ID
Drip sequence to configure in Resend:
  Email 1 (day 0): Welcome + AI Automation Guide link
  Email 2 (day 3): Case study highlight
  Email 3 (day 7): ROI calculator CTA
  Email 4 (day 14): "5 enterprise AI mistakes" tips email
  Email 5 (day 21): Book a call CTA
Acceptance: Email captured in Resend Audiences; confirmation shown; unsubscribe works
```

### T-008: Vitest Unit Tests
**Priority:** P1 | **Effort:** 3h
```
Install: npm install --save-dev vitest @vitest/coverage-v8 jsdom @testing-library/react
Create vitest.config.ts (environment: jsdom, globals: true)
Add package.json scripts: "test": "vitest run", "test:coverage": "vitest run --coverage"

Test files:
  src/tests/validateContact.test.ts — all validation branches
  src/tests/roi.test.ts — calculate() with known inputs (depends on T-019)
  src/tests/mdx.test.ts — getAllPostsMeta, getPostBySlug
  src/tests/subscribe.test.ts — email validation in subscribe route
```

### T-010: Dynamic OG Images
**Priority:** P2 | **Effort:** 3h | **Files:** `src/app/og/route.tsx`, `src/app/blog/[slug]/page.tsx`
```
Create /app/og/route.tsx returning ImageResponse
Params: title, author, date, type (blog|service|case-study)
Render: SignalHaus branded card, indigo gradient bg, white text, logo
Usage in blog/[slug]/page.tsx:
  openGraph: { images: [{ url: `/og?title=${encodeURIComponent(title)}&author=${author}&date=${date}` }] }
Acceptance: Each blog post shows unique branded OG card when shared on LinkedIn/Twitter
```

### T-011: /services/[slug] Pages
**Priority:** P2 | **Effort:** 4h
```
Create content/services/*.mdx:
  - ai-strategy.mdx
  - data-integration.mdx
  - workflow-automation.mdx
Each: title, description, methodology steps, case study links, FAQ, CTA
Build src/app/services/[slug]/page.tsx reading from MDX
Update /services index page with links to detail pages
Add Service JSON-LD to each detail page
Acceptance: /services/ai-strategy returns 200, canonical URL, Service schema
```

### T-017: Fix Missing logo.png
**Priority:** P0 | **Effort:** 15min | **Files:** `public/logo.png`
```
Create or export SignalHaus logo as PNG (200x60px)
Place at /public/logo.png
Verify JSON-LD in layout.tsx resolves correctly
Acceptance: GET /logo.png returns 200; no 404 in GSC
```

### T-018: Branded 404 Page
**Priority:** P0 | **Effort:** 30min | **Files:** `src/app/not-found.tsx`
```
Create src/app/not-found.tsx
Content: SignalHaus header, "Page Not Found" heading, helpful nav links, CTA button to homepage
Match site dark theme
Acceptance: Accessing /nonexistent returns branded 404 page
```

---

## New Environment Variables Required

```env
# Upstash Redis (T-001)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Cloudflare Turnstile (T-002)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=

# HubSpot (T-005)
HUBSPOT_ACCESS_TOKEN=

# Calendly (T-006)
NEXT_PUBLIC_CALENDLY_URL=

# Resend Audiences (T-007)
RESEND_AUDIENCE_ID=
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Upstash free tier quota exceeded | Low | Medium | Monitor; free = 10K cmds/day |
| Turnstile false positives | Low | High | Use "managed" mode; add bypass for dev |
| HubSpot API key leak | Low | High | Vercel env vars only, never commit |
| Playwright flaky in CI | Medium | Medium | Add retries; `--reporter=github` |
| Rate limiter blocks legit users | Low | High | 5 req/15min is generous for contact form |

---

## Success Metrics (30 days post-implementation)

- Zero contact form spam (Turnstile)
- Rate limit working across all serverless instances (Upstash)
- >5 newsletter subscribers from blog traffic
- >2 meetings booked via Calendly embed
- Leads appearing in HubSpot CRM within 30s
- CI passing on all PRs
- >50% test coverage on critical paths
- All JSON-LD validates in Google's Rich Results Test
