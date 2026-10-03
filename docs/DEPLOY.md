# Aeroloom — Free-Tier Production Deployment Guide (Vercel)

This runbook guides repository owners through deploying Aeroloom to **Vercel** entirely on free, zero-cost tiers.

---

## 1. Prerequisites (All Free Tiers)

Before deploying, ensure you have free accounts on:
1. **GitHub** (`https://github.com`): Hosting the source repository.
2. **Vercel** (`https://vercel.com`): Serverless frontend and API route hosting (Hobby Tier).
3. **Upstash** (`https://upstash.com`): Serverless Redis caching tier (Free Tier: 10,000 commands/day).
4. **Supabase** (`https://supabase.com`): PostgreSQL database, Auth, and RLS persistence (Free Tier: 2 free projects).
5. **OpenRouter** (`https://openrouter.ai`): Free access to open-weights LLMs for "Ask Aeroloom".

---

## 2. Step 1: Upstash Redis Provisioning (5 minutes)

1. Log in to the [Upstash Console](https://console.upstash.com/).
2. Click **Create Database**.
3. Name: `aeroloom-cache`
4. Type: **Regional** (choose region closest to your Vercel deployment, e.g. `us-east-1` or `ap-south-1`).
5. Tier: **Free**.
6. Once provisioned, scroll to **REST API** section:
   - Copy `UPSTASH_REDIS_REST_URL` (starts with `https://...upstash.io`).
   - Copy `UPSTASH_REDIS_REST_TOKEN`.
7. Keep these available for the Vercel environment settings.

---

## 3. Step 2: Supabase Auth & Cloud Sync Provisioning (5 minutes)

1. Log in to the [Supabase Dashboard](https://supabase.com/dashboard).
2. Click **New Project**:
   - Organization: Select or create your personal organization.
   - Name: `aeroloom-db`
   - Database Password: Create and securely store a strong password.
   - Region: Select region nearest your primary user base.
   - Pricing Plan: **Free**.
3. Once provisioned, navigate to **Project Settings** &rarr; **API**:
   - Copy **Project URL** (`NEXT_PUBLIC_SUPABASE_URL`).
   - Copy **anon public** key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`).
   - Copy **service_role secret** (`SUPABASE_SERVICE_ROLE_KEY`).
4. Apply the database migrations documented in `docs/AUTH_SETUP.md`.

---

## 4. Step 3: OpenRouter API Key (Optional for AI Assistant)

1. Log in to [OpenRouter](https://openrouter.ai/).
2. Navigate to **Keys** &rarr; **Create Key**.
3. Name: `aeroloom-assistant`.
4. Copy the resulting key (`OPENROUTER_API_KEY`).

---

## 5. Step 4: Vercel Deployment Setup

1. Log in to the [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** &rarr; **Project**.
3. Import your GitHub repository: `Aeroloom` (branch: `redesign/v2` or `main`).
4. Configure Build and Output Settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm ci`
   - **Node.js Version**: `20.x` or `22.x`

5. Expand **Environment Variables** and add:

| Variable Name | Value / Description | Required? |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Your production URL (e.g. `https://aeroloom.vercel.app` or `https://yourdomain.com`) | **REQUIRED** |
| `UPSTASH_REDIS_REST_URL` | Copied from Upstash Console | Optional (Recommended) |
| `UPSTASH_REDIS_REST_TOKEN` | Copied from Upstash Console | Optional (Recommended) |
| `NEXT_PUBLIC_SUPABASE_URL` | Copied from Supabase Dashboard | Optional (For Accounts) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Copied from Supabase Dashboard | Optional (For Accounts) |
| `SUPABASE_SERVICE_ROLE_KEY` | Copied from Supabase Dashboard | Optional (Server-only) |
| `OPENROUTER_API_KEY` | Copied from OpenRouter | Optional (For AI Assistant) |
| `ASSISTANT_MODELS` | `meta-llama/llama-3.3-70b-instruct:free,google/gemini-2.0-flash-exp:free,qwen/qwen-2.5-72b-instruct:free` | Optional |
| `ADSB_PROVIDER_PRIMARY` | `airplanes.live` | Optional (Default) |
| `ADSB_CACHE_TTL_MS` | `4000` | Optional (Default) |

6. Click **Deploy**. Vercel will build and assign a production URL (e.g. `https://aeroloom.vercel.app`).

---

## 6. Step 5: Post-Deployment OAuth Redirect Configuration

Once Vercel assigns your domain (e.g., `https://aeroloom.vercel.app`):
1. In the Supabase Dashboard, go to **Authentication** &rarr; **URL Configuration**:
   - **Site URL**: Set to your production URL (`https://aeroloom.vercel.app`).
   - **Redirect URLs**: Add `https://aeroloom.vercel.app/auth/callback` and `http://localhost:3000/auth/callback`.
2. Follow the Google and GitHub OAuth setup steps in `docs/AUTH_SETUP.md`.

---

## 7. Step 6: Post-Deployment Smoke Test Runbook

Execute these quick verification checks on your production deployment:
1. **Landing Page**: Navigate to `https://your-domain.vercel.app/`. Verify hero typography, live stats strip, and 1:1 scrub flight section.
2. **Live Map**: Navigate to `/map`. Verify light MapLibre cartography loads and live ADS-B aircraft markers appear.
3. **Airport Dossier**: Navigate to `/airport/KJFK`. Verify decoded METAR weather card and radar scope.
4. **Health Check**: Open `https://your-domain.vercel.app/api/health`. Confirm status code `200` and upstream feed availability.
5. **System Status**: Navigate to `/status`. Verify honest service health reporting.
6. **Dev Gate**: Navigate to `/dev/kit`. Confirm an editorial `404 Not Found` response is returned.

---

## 8. Rollback Procedures

If an unexpected regression is identified in production:
1. **Instant Vercel Rollback**:
   - Go to the Vercel Dashboard &rarr; **Deployments**.
   - Locate the previous stable deployment.
   - Click the three dots (`...`) &rarr; **Promote to Production**. Rollback is effective in < 5 seconds with zero rebuild time.
2. **Git Branch Revert**:
   - Check out `redesign/v2`.
   - Revert commit: `git revert HEAD`.
   - Push to GitHub: `git push origin redesign/v2`.
