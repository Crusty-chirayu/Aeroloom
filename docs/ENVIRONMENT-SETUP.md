# AEROLOOM: ENVIRONMENT SETUP & DEPLOYMENT GUIDE

This guide details the prerequisites, local development procedures, testing instructions, and deployment configurations for **Aeroloom: The Atmospheric Observatory**.

---

## 1. PREREQUISITES & SYSTEM REQUIREMENTS

* **Node.js**: `v20.x` or `v22.x` (ESM native support, Node test runner with `--experimental-strip-types`)
* **Package Manager**: `npm` (included with Node.js)
* **Graphics**: WebGL 2.0 compatible browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Apple Safari)

---

## 2. ENVIRONMENT VARIABLES CONFIGURATION

Aeroloom is designed to operate immediately at **$0 cost** without requiring any mandatory environment variables. By default, it runs with device-local persistence and public open ADS-B feeds.

To enable optional multi-device cloud synchronization via Supabase PostgreSQL, create a `.env.local` file in the repository root:

```env
# Optional: Supabase PostgreSQL Cloud Sync Tier
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> **SECURITY NOTICE:**
> Never commit `.env.local` or any service-role private keys to Git. The project `.gitignore` automatically excludes all `.env*.local` files.

---

## 3. LOCAL DEVELOPMENT WORKFLOW

### 3.1 Install Dependencies
```bash
npm install
```

### 3.2 Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3.3 Run Test Suite
The test suite executes using Node's native runner with zero heavy test runner dependencies:
```bash
npm test
```
*Current test suite: **81 tests passing** across 18 test suites.*

### 3.4 TypeScript Typecheck
```bash
npx tsc --noEmit
```

### 3.5 Production Build
```bash
npm run build
npm start
```

---

## 4. DATABASE MIGRATION PROCEDURE (SUPABASE POSTGRESQL)

If deploying the cloud-synced storage tier:
1. Create a free project at [supabase.com](https://supabase.com).
2. Navigate to **SQL Editor** in the Supabase Dashboard.
3. Open and run the migration script:
   `supabase/migrations/20260929_aeroloom_core_schema.sql`
4. The migration will create:
   - `public.profiles`
   - `public.saved_flights`
   - `public.watchlists`
   - `public.airspace_alerts`
   along with Row Level Security (RLS) policies ensuring users can only read and write their own records.

---

## 5. VERCEL DEPLOYMENT CONFIGURATION

1. Push your repository to GitHub.
2. Import the repository in [Vercel](https://vercel.com).
3. Framework Preset: **Next.js**
4. Root Directory: `./`
5. Node Version: `20.x`
6. Add environment variables if utilizing Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
7. Click **Deploy**. Zero custom build settings required.
