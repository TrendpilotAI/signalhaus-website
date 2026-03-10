# AUDIT.md — SignalHaus Website Code Quality Audit
*Last Updated: 2026-03-10 | v2 by Judge Agent*

## Summary

| Category | Status | Issues Found |
|---|---|---|
| Security | 🔴 Critical | 1 critical, 2 medium |
| Dead Code | ✅ Clean | 0 significant issues |
| DRY Violations | ⚠️ Minor | 3 issues |
| Missing Assets | 🔴 Bug | 1 missing file (logo.png) |
| Dependencies | ✅ Clean | 0 CVEs |
| Test Coverage | 🔴 Critical | 0% — no test files exist |
| Performance | ⚠️ Minor | 3 issues |
| Type Safety | ✅ Good | TypeScript strict mode; PostFrontmatter typed ✅ |
| SEO / Meta | ⚠️ Needs Work | Missing dynamic OG, missing logo.png, RSS not linked |

---

## 1. Security Issues

### [CRITICAL] In-Memory Rate Limiter — Serverless-Unsafe
**File:** `src/app/api/contact/route.ts` — Lines 14-16, 22-37  
**Severity:** Critical  
**Live Bug — Active in Production**

```typescript
// PROBLEMATIC — line 14
const rateLimitStore = new Map<string, RateEntry>()
// Map state dies on every Vercel cold start.
// Attacker can trigger 5 requests, wait for new cold start, repeat indefinitely.
```

**Fix:** Replace with Upstash Redis + `@upstash/ratelimit`:
```typescript
// src/lib/ratelimit.ts
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "15m"),
})
```

---

### [MEDIUM] No Bot/CAPTCHA Protection on Contact Form
**File:** `src/app/contact/ContactForm.tsx`, `src/app/api/contact/route.ts`  
**Severity:** Medium  
Manual XSS pattern blocking (`BLOCKED_PATTERNS`) is not a replacement for bot challenge. Automated form submission tools bypass string checks trivially.

**Fix:** Integrate Cloudflare Turnstile (free, invisible/managed mode).

---

### [MEDIUM] CSP allows `unsafe-inline` scripts and styles
**File:** `next.config.ts` — Lines 3-15  
```typescript
script-src 'self' 'unsafe-inline' 'unsafe-eval' ...
style-src 'self' 'unsafe-inline' ...
```
`'unsafe-inline'` and `'unsafe-eval'` significantly weaken XSS protection.

**Fix:** Implement nonce-based CSP using Next.js middleware. `'unsafe-eval'` may be needed for Next.js hydration but `'unsafe-inline'` for scripts can be replaced.

---

## 2. Missing Assets

### [BUG] /logo.png Referenced in JSON-LD but Missing
**File:** `src/app/layout.tsx` — Line 18
```typescript
logo: {
  "@type": "ImageObject",
  url: "https://www.signalhaus.ai/logo.png",  // ← 404
  width: 200,
  height: 60,
},
```
**Impact:** Google's structured data parser sees a 404 for the organization logo. This hurts rich results and brand credibility in search.

**Fix:** Add a `logo.png` (200x60px) to `/public/logo.png`.

---

## 3. Dead Code

### No significant dead code found ✅
All components are imported and used. No commented-out logic blocks.

**Note:** `src/lib/gtag.ts` exports a `pageview()` helper that may not be called post-navigation in App Router (GA4 auto-tracks SPA navigation). Verify in GA4 Real-Time dashboard.

---

## 4. DRY Violations

### [MINOR] Repeated `openGraph.images` across page metadata
**Files:** `src/app/pricing/page.tsx:11`, `src/app/roi-calculator/page.tsx:9`, `src/app/about/page.tsx`, `src/app/case-studies/page.tsx`, `src/app/contact/page.tsx`
```typescript
// Repeated on every page:
images: [{ url: "/og-image.png", width: 1200, height: 630 }]
```
**Fix:** Extract to `src/lib/seo.ts`:
```typescript
export const siteConfig = {
  url: 'https://www.signalhaus.ai',
  defaultOgImage: { url: '/og-image.png', width: 1200, height: 630, alt: '...' },
} as const
```

### [MINOR] Hard-coded site URL string
Multiple pages use `"https://www.signalhaus.ai"` inline for canonical URLs and alternates.  
**Fix:** Use `siteConfig.url` from `src/lib/seo.ts`.

### [MINOR] ROI `calculate()` function embedded in client component
**File:** `src/components/ROICalculator.tsx` — Lines 78-100  
Pure function with no UI dependencies. Untestable in current location.  
**Fix:** Move to `src/lib/roi.ts`:
```typescript
// src/lib/roi.ts
export const ROI_CONSTANTS = {
  AVG_HOURLY_RATE: 75,
  AUTOMATION_EFFICIENCY: 0.70,
  CONVERSION_LIFT: 0.30,
  SIGNALHAUS_MONTHLY_COST: 4800,
}
export function calculate(inputs: Inputs): Results { ... }
```

---

## 5. Dependencies

### npm audit: 0 vulnerabilities ✅
No known CVEs in current dependency tree.

### Notable versions:
| Package | Version | Status |
|---------|---------|--------|
| next | 16.1.6 | Latest ✅ |
| react | 19.2.3 | Latest ✅ |
| tailwindcss | ^4 | Latest ✅ |
| typescript | 5.9.3 | Latest ✅ |
| resend | ^6.9.2 | Latest ✅ |
| gray-matter | ^4.0.3 | Stable ✅ |
| next-mdx-remote | ^6.0.0 | Latest ✅ |

**Missing from devDependencies:**
- No linting config (`eslint-config-next` not configured beyond defaults)
- No `@typescript-eslint/recommended`
- No Prettier

---

## 6. Test Coverage

### [CRITICAL] 0% Test Coverage
No test files, no test runner config, no `@testing-library`, no Playwright setup.

**Functions that need unit tests (prioritized):**

#### Unit Tests — Vitest (high priority)
| Function | File | Lines | What to test |
|---------|------|-------|-------------|
| `validateContact()` | `api/contact/route.ts` | 52-105 | All 6 fields, XSS patterns, budget whitelist |
| `checkRateLimit()` | `api/contact/route.ts` | 22-36 | Under/at/over limit, reset after window |
| `calculate()` | `ROICalculator.tsx` | 78-100 | Math accuracy with known inputs |
| `getAllPostsMeta()` | `lib/mdx.ts` | — | Sorted DESC, correct field extraction |
| `getPostBySlug()` | `lib/mdx.ts` | — | Returns null for missing slug |
| `getAdjacentPosts()` | `lib/mdx.ts` | — | First/last post edge cases |

#### Integration Tests — Vitest + msw
- `/api/contact` POST — happy path (mock Resend + Slack)
- `/api/contact` POST — validation errors return 422
- `/api/contact` POST — rate limit returns 429

#### E2E Tests — Playwright
- Contact form: fill + submit → success toast
- Contact form: submit empty → inline error messages
- ROI calculator: step through all 5 steps → see results
- Navigation: all pages return non-error responses
- Blog: post list loads, clicking opens correct slug

---

## 7. Performance Issues

### [MINOR] TestimonialCarousel loaded eagerly
**File:** `src/app/page.tsx` — Line 1 (top-level import)  
**Description:** Client component with CSS animation. Included in initial server render unnecessarily.
```typescript
// Fix: src/app/page.tsx
import dynamic from "next/dynamic"
const TestimonialCarousel = dynamic(
  () => import("@/components/TestimonialCarousel"),
  { ssr: false, loading: () => <div className="h-48 bg-gray-800 animate-pulse rounded-xl" /> }
)
```

### [MINOR] Blog filesystem reads on every request
**File:** `src/lib/mdx.ts`  
`getAllPostsMeta()` reads + parses all MDX files synchronously on every request. Will degrade with >20 posts.
```typescript
// Fix: Add caching in mdx.ts
import { cache } from "react"
export const getAllPostsMeta = cache(function getAllPostsMeta(): PostMeta[] {
  // ... existing implementation
})
// Or: export const revalidate = 3600 in blog routes
```

### [MINOR] RSS feed not linked — poor discoverability
**File:** `src/app/layout.tsx`  
The RSS feed (`/feed.xml`) exists but isn't linked in `<head>`.
```typescript
// Fix: Add to layout.tsx <head>:
<link rel="alternate" type="application/rss+xml" title="SignalHaus Blog" href="/feed.xml" />
```

---

## 8. Type Safety

### TypeScript strict mode: ON ✅
`tsconfig.json` → `"strict": true`

### PostFrontmatter interface: TYPED ✅
`src/lib/mdx.ts` has properly typed `PostFrontmatter` interface. (Prior audit flagged this — it was already resolved.)

### [MINOR] `body` param typed as `unknown` in contact API
**Status:** Correct pattern — `unknown` + runtime validation is the right approach ✅

---

## 9. SEO / Meta Issues

### [HIGH] No dynamic OG images for blog posts
**File:** `src/app/blog/[slug]/page.tsx`  
All blog posts share `/og-image.png`. Unique OG cards dramatically improve LinkedIn/Twitter CTR.

### [HIGH] Missing logo.png (see Section 2)
JSON-LD organization schema references a missing logo. Breaks rich results.

### [MEDIUM] RSS feed not discoverable
`/feed.xml` exists but no `<link rel="alternate">` in `<head>`. Feed readers/search engines won't find it.

### [MINOR] Blog posts' `author` JSON-LD missing
**File:** `src/app/blog/[slug]/page.tsx`  
The Article JSON-LD should include `author: { "@type": "Person", name: "..." }`.

---

## Action Items (prioritized)

| # | Issue | File | Priority | Effort |
|---|-------|------|----------|--------|
| 1 | Fix missing logo.png | `public/logo.png` | P0 | 15min |
| 2 | Replace in-memory rate limiter with Upstash | `api/contact/route.ts` | P0 | 1h |
| 3 | Add Cloudflare Turnstile | `contact/ContactForm.tsx` + API | P0 | 2h |
| 4 | Set up GitHub Actions CI | `.github/workflows/ci.yml` | P0 | 1h |
| 5 | Set up Vitest + write unit tests | `src/tests/` | P1 | 3h |
| 6 | Extract ROI calculate() to lib/roi.ts | `src/lib/roi.ts` | P1 | 30min |
| 7 | Link RSS feed in layout | `src/app/layout.tsx` | P1 | 15min |
| 8 | Add `React.cache()` to getAllPostsMeta | `src/lib/mdx.ts` | P2 | 15min |
| 9 | Dynamic OG images | `src/app/og/route.tsx` | P2 | 3h |
| 10 | Extract seo.ts constants (DRY) | `src/lib/seo.ts` | P2 | 1h |
| 11 | Add blog author to Article JSON-LD | `blog/[slug]/page.tsx` | P2 | 30min |
| 12 | Lazy-load TestimonialCarousel | `src/app/page.tsx` | P3 | 30min |
| 13 | CSP nonce for styles | `next.config.ts` | P3 | 2h |
| 14 | npm audit in CI | `.github/workflows/ci.yml` | P1 | 5min |
