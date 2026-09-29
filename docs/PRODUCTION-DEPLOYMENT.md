# Aeroloom — Production Deployment & Vercel Release Guide

## 1. Overview

Aeroloom is built on Next.js 16 (Turbopack / App Router), React 19, MapLibre GL, and Three.js / React Three Fiber.
It is specifically optimized for deployment on Vercel's Edge/Serverless platform under standard Free / Hobby tier limits ($0 infrastructure cost).

---

## 2. Pre-Deployment Verification

Before triggering production deployment, verify all local gates pass:
```bash
# 1. Type check
npx tsc --noEmit

# 2. Automated Test Suite (93 tests across 20 suites)
npm test

# 3. Production Build Validation
npm run build
```

---

## 3. Vercel Project Setup

1. Push all committed changes to the GitHub repository:
   ```bash
   git push origin main
   ```
2. Navigate to [https://vercel.com](https://vercel.com) and click **Add New Project**.
3. Import the repository: `https://github.com/Crusty-chirayu/Aeroloom`.
4. In the Project Configuration screen, verify the default settings:
   - **Framework Preset:** Next.js
   - **Root Directory:** `./`
   - **Build Command:** `next build` (or default)
   - **Output Directory:** `.next` (default)
   - **Install Command:** `npm install` (default)

---

## 4. Production Environment Variables Configuration

In Vercel &rarr; Project Settings &rarr; **Environment Variables**, add the following keys for `Production` (and optionally `Preview`):

| Variable Name | Environment | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview | Hosted Supabase project URL (`https://xxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview | Supabase anon public JWT key |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview | Server-only Supabase service-role key (do NOT expose in browser) |
| `NEXT_PUBLIC_SITE_URL` | Production | Your assigned Vercel URL (e.g. `https://aeroloom.vercel.app`) |

---

## 5. Post-Deployment Smoke Test Checklist

Once Vercel finishes the initial production deployment:
1. **Landing & 3D Observatory:** Verify the 3D particle radar sphere renders cleanly and responsive navigation works.
2. **Transition to Live Map:** Click "LAUNCH OBSERVATORY" and confirm transition into the full-screen MapLibre 2D tactical map.
3. **Live ADS-B Telemetry:** Confirm aircraft markers appear, pulse with live updates, and display realistic speeds and altitudes.
4. **Flight Selection & Dossier:** Click any flight marker, verify the Horizon Telemetry Dock expands with callsign, hex, speed, and heading. Click "OPEN DOSSIER" to view the detailed dossier page.
5. **Airports Directory & Radar:** Navigate to `/airports` and open `/airport/KJFK`. Confirm terminal radar renders.
6. **Authentication & Cloud Sync:** Click "SIGN IN" in the header. Register a new test account, verify login succeeds, and save a flight. Refresh the page to confirm persistent cloud synchronization!

---

## 6. Rollback Procedures

If an unexpected production defect is detected:
1. In the Vercel Dashboard, go to **Deployments**.
2. Locate the previous stable deployment.
3. Click the three dots menu (`...`) and select **Instant Rollback**.
4. Traffic will instantly route to the previous build with zero downtime.
