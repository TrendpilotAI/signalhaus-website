# SignalHaus.ai Website

Production-ready Next.js 14+ website for SignalHaus AI consultancy.

## Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4**
- **Inter font** (Google Fonts)
- Static export ready

## Getting Started

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # Production build
npm start       # Serve production build
```

## Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import in [vercel.com](https://vercel.com)
3. Deploy — zero config needed

### Railway / Docker
```bash
npm run build
npm start
```

### Static Export
Add to `next.config.ts`:
```ts
const config = { output: 'export' };
```
Then `npm run build` generates static files in `out/`.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage — hero, services, social proof, pricing preview, CTA |
| `/services` | 6 service cards with deliverables |
| `/pricing` | 3-tier pricing (QuickStart, Growth, Enterprise) |
| `/about` | Nathan's bio, company timeline, values |
| `/contact` | Contact form |
| `/blog` | Blog listing + sample post |

## SEO Features

- ✅ Unique title & meta description per page
- ✅ JSON-LD schema (ProfessionalService + Offer)
- ✅ Open Graph & Twitter Card tags
- ✅ Canonical URLs
- ✅ Single H1 per page
- ✅ Semantic HTML with proper alt text
- ✅ Mobile-responsive design

## Customization

- **OG Image**: Replace `public/og-image.png` (1200×630px)
- **Logo**: Replace `public/logo.png`
- **Contact form**: Wire up to your backend/email service in `src/app/contact/page.tsx`
- **Blog**: Add new posts as directories under `src/app/blog/[slug]/page.tsx`
