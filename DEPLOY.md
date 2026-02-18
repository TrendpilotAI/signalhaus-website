# SignalHaus Website — Deployment Guide

## Vercel Deployment

### Quick Deploy
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the `TrendpilotAI/signalhaus-website` GitHub repo
3. Framework preset: **Next.js** (auto-detected)
4. Click **Deploy**

### Custom Domain
1. In Vercel project → Settings → Domains
2. Add `www.signalhaus.ai`
3. Update DNS: Add CNAME record pointing to `cname.vercel-dns.com`

### Environment Variables
None required for static build.

### Build Settings
- Build command: `npm run build`
- Output directory: `.next`
- Install command: `npm install`

## Local Development
```bash
npm install
npm run dev    # http://localhost:3000
npm run build  # Production build
```
