# SignalHaus Website — Code Audit v2

_Updated by Judge Agent v2 — 2026-03-01_

---

## Security

### ✅ RESOLVED: Rate Limiting
**File:** `src/app/api/contact/route.ts`  
Rate limiting (5 req / 15 min per IP) is implemented with in-memory Map store.

### ✅ RESOLVED: Input Validation
**File:** `src/app/api/contact/route.ts`  
Full Zod-style validation with max lengths, XSS pattern blocking, budget whitelist.

### ✅ RESOLVED: Error Leakage
**File:** `src/app/api/contact/route.ts`  
Generic error messages returned to client. Internal errors logged to console only.

### HIGH: No CSP Headers
**File:** `next.config.ts`  
**Issue:** No Content-Security-Policy, X-Frame-Options, or X-Content-Type-Options headers. Site is susceptible to clickjacking and content injection.  
**Fix:** Add `headers()` in `next.config.ts`:
```ts
async headers() {
  return [{
    source: '/(.*)',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; ..." },
    ]
  }]
}
```

### MEDIUM: CONTACT_EMAIL Fallback to Personal Email
**File:** `src/app/api/contact/route.ts`, line 3  
**Issue:** `const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "nathan@forwardlane.com"` — silently routes to personal email if env var not set in production.  
**Fix:** Check for `CONTACT_EMAIL` alongside `RESEND_API_KEY` and return 500 if missing.

---

## Code Quality

### MEDIUM: Badge Images Are Text Placeholders
**File:** `src/app/page.tsx`, lines ~57-70 (badges section)  
**Issue:** Social proof badges rendered as `<div>` text elements instead of actual logo images. Looks unpolished and reduces credibility.  
**Fix:** Replace with real SVG/PNG logos or proper `<img>` elements.

### MEDIUM: No ESLint Configuration
**File:** `package.json` — no `lint` script; no `.eslintrc.json`  
**Issue:** No static analysis. Type errors and code style issues can slip through.  
**Fix:** Add `next lint` script, `.eslintrc.json` with `next/core-web-vitals`, add to CI.

### MEDIUM: Metadata Duplication Across Pages
**Files:** `src/app/about/page.tsx`, `src/app/services/page.tsx`, `src/app/pricing/page.tsx`, `src/app/contact/page.tsx`, `src/app/blog/page.tsx`  
**Issue:** Each page repeats full OG image URL (`/og.png`), site name pattern, and base URL string.  
**Fix:** Create `src/lib/metadata.ts` with `baseMetadata` and `generatePageMetadata(title, desc, path)` helper.

### LOW: No `next/image` Usage
**Files:** `src/app/page.tsx` (badges), all pages  
**Issue:** No images use `<Image>` from next/image. When real images are added, they won't be lazy-loaded or optimized.

### LOW: No Prettier Config
**File:** `package.json` — no `format` script; no `.prettierrc`  
**Issue:** Code style consistency not enforced.

---

## Testing

### HIGH: Zero Test Coverage
**Issue:** No unit, integration, or E2E tests across entire codebase. Contact form, API route, all pages untested.  
**See:** TODO 319 (Playwright E2E)

---

## Performance

### LOW: Static Sitemap Won't Scale
**File:** `public/sitemap.xml`  
**Issue:** Static file won't auto-update when new blog posts are added via MDX.  
**Fix:** Replace with `src/app/sitemap.ts` using Next.js built-in dynamic sitemap generation.

### LOW: Bundle Size Unknown
**File:** `package.json` — no `@next/bundle-analyzer`  
**Issue:** No visibility into client bundle sizes. Should check `next-mdx-remote` client-side footprint.

---

## SEO

### HIGH: No JSON-LD Structured Data
**Files:** All pages, `src/app/layout.tsx`  
**Issue:** No Organization, Service, or Article schemas. Missing rich result eligibility in Google.  
**Fix:** See TODO 317.

### MEDIUM: Blog Post Missing Article Schema
**File:** `src/app/blog/[slug]/page.tsx`  
**Issue:** Blog posts have frontmatter metadata but no Article JSON-LD schema in the `<head>`.  
**Fix:** Add `<script type="application/ld+json">` with Article schema in the blog post page.

### LOW: Internal Linking Sparse
**File:** Blog post content  
**Issue:** Blog posts don't link to /services or /pricing. Case studies don't link to /contact. Missing link equity flow.

---

## Accessibility

### MEDIUM: Badge Section Role Mismatch
**File:** `src/app/page.tsx` (badges section)  
**Issue:** Badges use `role="img"` on a `<div>` but without actual images. Screen readers will announce "image" but there's no visual image. Use `role="presentation"` or add actual `<img>` elements.

### LOW: Mobile Navigation
**File:** `src/components/Header.tsx`  
**Issue:** Desktop nav visible. Mobile hamburger menu behavior should be verified. No explicit mobile nav component visible in source.

---

## Summary Table

| Severity | Count | Key Issues |
|----------|-------|------------|
| HIGH | 3 | CSP headers, zero tests, no JSON-LD |
| MEDIUM | 6 | CONTACT_EMAIL fallback, badge images, no ESLint, metadata DRY, no Prettier, blog Article schema |
| LOW | 5 | next/image, static sitemap, bundle size, internal linking, mobile nav |

**Most impactful immediate actions:**
1. Add CSP headers (security, 30 min)
2. Add JSON-LD schemas (SEO, 2 hours)
3. Add HubSpot integration (revenue, 4 hours)

---

## v3 Audit Update (2026-03-02)

### ✅ RESOLVED: Slack Webhook
**Commit:** 49c4448
Slack webhook fires on successful contact form submit with rich block layout. Non-blocking (fire-and-forget). Error logged to console only.

### MEDIUM: CONTACT_EMAIL Silent Fallback Still Present
**File:** `src/app/api/contact/route.ts`, line 3
```ts
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "nathan@forwardlane.com"
```
RESEND_API_KEY is checked (returns 500 if missing), but CONTACT_EMAIL is NOT. If env var is missing in production, emails silently go to personal address. Fix: add guard alongside RESEND_API_KEY check.

### LOW: No Type-Safe Env Module
**Issue:** Environment variables read ad-hoc with `process.env.X`. If a new required var is added, failure mode is silent (undefined) rather than a startup crash.
**Fix:** Create `src/lib/env.ts` with explicit checks and typed exports.

### LOW: Rate Limit Store Not Persistent
**File:** `src/app/api/contact/route.ts`
**Issue:** In-memory Map resets on cold start (Vercel serverless). Under high load or if the function scales to multiple instances, rate limits won't be shared across instances.
**Note:** Acceptable for current traffic. At scale, replace with Upstash Redis.

### LOW: No Structured Logging
**Issue:** `console.error()` calls are spread across the API. No request IDs, no structured JSON logs. Hard to correlate errors in Vercel logs.
**Fix (optional):** Add a lightweight logger helper `src/lib/logger.ts` that emits `{ level, message, requestId, timestamp }` JSON.

---

## Revised Summary Table (v3)

| Severity | Count | Key Issues |
|----------|-------|------------|
| HIGH | 3 | CSP headers, zero tests, no JSON-LD |
| MEDIUM | 5 | CONTACT_EMAIL fallback, badge images, no ESLint, metadata DRY, no newsletter |
| LOW | 7 | next/image, static sitemap, bundle size, internal linking, mobile nav, env.ts, structured logging |

**Quick wins (<30min each):**
1. Microsoft Clarity (free heatmaps)
2. LinkedIn Insight Tag
3. Google Search Console
4. Uptime monitoring
5. Dynamic sitemap
