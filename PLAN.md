# SignalHaus Website — Execution Plan v2

_Updated by Judge Agent v2 — 2026-03-01_

## Current State Summary

The site is a **Next.js 16 marketing site** with the following in production:
- Core pages: home, about, services, pricing, contact, blog (MDX), case studies, ROI calculator
- Contact form → Resend email (working)
- Rate limiting + Zod validation on /api/contact ✅
- GA4 tracking ✅
- Calendly embed on contact ✅
- Testimonial carousel ✅
- GitHub Actions CI + Dependabot ✅

**Remaining gaps:** Security headers, HubSpot CRM, JSON-LD SEO, ESLint, Slack notifications, dynamic sitemap, E2E tests, real badge images, more content.

---

## Proposed Architecture

```
signalhaus-website/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── contact/route.ts     [HARDEN: CSP, CONTACT_EMAIL guard]
│   │   │   └── newsletter/route.ts  [NEW: email capture → Beehiiv/ConvertKit]
│   │   ├── sitemap.ts               [NEW: dynamic sitemap replacing public/sitemap.xml]
│   │   └── blog/[slug]/page.tsx     [UPDATE: add Article JSON-LD]
│   ├── components/
│   │   ├── JsonLd.tsx               [NEW: structured data helper]
│   │   └── NewsletterSignup.tsx     [NEW: email capture widget]
│   └── lib/
│       └── metadata.ts              [NEW: DRY metadata helper]
├── next.config.ts                   [UPDATE: add security headers()]
├── .eslintrc.json                   [NEW]
├── .prettierrc                      [NEW]
└── tests/
    └── e2e/                         [NEW: Playwright tests]
```

---

## TODO Dependency Graph

```
TODO 320 (CSP + CONTACT_EMAIL guard) — standalone, do first
    └── informs TODO 321 (Slack webhook — also touches contact route)

TODO 317 (JSON-LD schemas) — standalone
TODO 318 (HubSpot + newsletter) — standalone, builds on secure contact route
TODO 319 (E2E tests) — run after core features stable
TODO 321 (Slack webhook) — standalone, pairs with 318 for lead visibility
TODO 322 (ESLint + Prettier + CI) — standalone
TODO 323 (dynamic sitemap) — standalone
TODO 316 (testimonials + case studies) — standalone (needs Nathan content)
```

---

## Recommended Execution Order

| Order | TODO | Description | Est | Impact |
|-------|------|-------------|-----|--------|
| 1 | 320 | CSP headers + CONTACT_EMAIL fix | 1-2h | Security |
| 2 | 322 | ESLint + Prettier + CI type-check | 1-2h | Code quality baseline |
| 3 | 317 | JSON-LD Organization + Service + Article schemas | 2-3h | SEO |
| 4 | 321 | Slack webhook on contact submit | 1h | Lead visibility |
| 5 | 318 | HubSpot CRM + newsletter signup | 3-4h | Revenue pipeline |
| 6 | 323 | Dynamic sitemap | 30min | SEO scalability |
| 7 | 319 | Playwright E2E tests | 3-4h | Quality lock |
| 8 | 316 | Real testimonials + case studies (needs Nathan input) | — | Conversion |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Site defaced (no CSP) | LOW | HIGH | TODO 320 immediately |
| Leads lost (no CRM) | HIGH | HIGH | TODO 318 this week |
| Poor SEO without structured data | MEDIUM | MEDIUM | TODO 317 quick win |
| No lead pipeline visibility | HIGH | HIGH | TODO 321 (Slack) quick win |
| Blog won't scale with static sitemap | MEDIUM | MEDIUM | TODO 323 (30 min) |

---

## Content Roadmap (Nathan Action Items — Not Coded)

1. **Real testimonials** from BNY Pershing, Invesco, LPL contacts → feeds TODO 316
2. **Badge logos** (Harvard Alumni, WEF, AWS, AI Hot 100) as actual SVG/PNG files
3. **5+ blog posts** targeting: "AI automation financial services", "enterprise AI consulting ROI", "workflow automation for wealth management"
4. **LinkedIn Company Page** for sameAs in JSON-LD Organization schema
5. **Demo/loom video** of a real automation workflow for homepage

---

## Performance Targets

- Lighthouse Performance: 95+
- Lighthouse SEO: 100 (achievable after TODO 317 + TODO 323)
- Lighthouse Accessibility: 95+
- Core Web Vitals: All green
- Contact form → HubSpot contact creation: <2s

---

## v3 Plan Updates (2026-03-02)

### Newly Completed
- ✅ **Slack webhook** (commit 49c4448) — TODO-321 DONE

### New TODOs Added This Run

| TODO | Description | Est | Priority |
|------|-------------|-----|----------|
| 323 | Dynamic sitemap (`src/app/sitemap.ts`) | 30min | P1 |
| 324 | Microsoft Clarity heatmaps | 15min | P1 |
| 325 | LinkedIn Insight Tag | 15min | P1 |
| 326 | Welcome email sequence (Resend scheduled) | 2h | P1 |
| 327 | CRO: Social proof above fold on homepage | 30min | P2 |
| 328 | FAQ accordion + FAQPage JSON-LD on /pricing | 1h | P2 |
| 329 | `src/lib/constants.ts` + `src/lib/env.ts` type-safe env | 30min | P2 |
| 330 | Google Search Console verification + GA4 link | 15min | P2 |
| 331 | Contact Form → HubSpot Deal creation | 1h | P1 (extends TODO-318) |
| 332 | Uptime monitoring (Vercel or Better Uptime) | 15min | P2 |

### Execution Priority v3

```
IMMEDIATE (< 1 hour each):
  324 → Microsoft Clarity (15 min, free)
  325 → LinkedIn Insight Tag (15 min)
  330 → Google Search Console (15 min)
  332 → Uptime monitoring (15 min)
  323 → Dynamic sitemap (30 min)
  327 → Social proof CRO (30 min)

THIS WEEK:
  320 → CSP headers
  317 → JSON-LD schemas
  322 → ESLint + Prettier + CI
  326 → Welcome email sequence
  329 → constants.ts + env.ts

NEXT SPRINT:
  318 → HubSpot CRM + 331 (Deal creation)
  319 → Playwright E2E tests
  328 → FAQ accordion + schema
  316 → Real testimonials (Nathan content)
```
