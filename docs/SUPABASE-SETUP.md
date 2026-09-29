# Aeroloom — Supabase Hosted Project Provisioning & Handoff Guide

**Target Audience:** Chirayu (Project Owner)  
**Estimated Time Required:** 4 minutes  
**Cost:** $0.00 (Supabase Free Tier)

---

## 1. Overview

Aeroloom is fully architected to operate in two seamless modes:
1. **Device-Local Mode (Active by default):** Operates completely offline with zero credentials required. All telemetry, saved flights, watchlists, and in-app alerts are stored securely in browser LocalStorage.
2. **Cloud-Synced Mode (Activated via Supabase):** Enables cross-device synchronization, Supabase PostgreSQL persistence, email/password operator authentication, and strict Row Level Security (RLS) isolation.

Everything in the codebase has been implemented, tested, and validated. The only required manual action is provisioning your Supabase project and adding the credentials into `.env.local`.

---

## 2. Step-by-Step Provisioning Guide

### Step 1: Create a Free Supabase Project
1. Navigate to [https://supabase.com](https://supabase.com) and sign in.
2. Click **New Project**.
3. Fill in the project details:
   - **Name:** `Aeroloom` (or any name you prefer)
   - **Database Password:** Generate a secure password and store it in your password manager.
   - **Region:** Choose the region geographically closest to your primary users (e.g. `us-west-1` or `eu-west-1`).
   - **Pricing Plan:** Free Tier ($0/month).
4. Click **Create new project** and wait ~1-2 minutes for provisioning to complete.

---

### Step 2: Retrieve API Credentials
1. In the Supabase dashboard, click the **Settings** (gear icon) on the left sidebar.
2. Navigate to **API** under Configuration.
3. Locate the following values:
   - **Project URL:** `https://xxxxxxxxxxxxxxxxxxxx.supabase.co`
   - **Project API Keys &bull; anon (public):** Starts with `eyJhbGciOi...`
   - **Project API Keys &bull; service_role (secret):** Starts with `eyJhbGciOi...`

> [!IMPORTANT]
> **Key Distinction:**
> - `anon (public)` key is safe to be exposed in browser client code. RLS policies guarantee users can only access their own records.
> - `service_role (secret)` key has admin bypass rights. It must **NEVER** be committed to Git or given a `NEXT_PUBLIC_` prefix.

---

### Step 3: Configure Local Environment Variables
1. At the root of the Aeroloom workspace (`E:\projects\Aeroloom`), create a `.env.local` file by copying the template:
   ```bash
   cp .env.example .env.local
   ```
2. Open `.env.local` in your editor and paste the values retrieved in Step 2:
   ```ini
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```
3. Save the file. `.env.local` is already in `.gitignore` and will never be committed.

---

### Step 4: Apply Database Schema & Migrations
1. In the Supabase Dashboard, click the **SQL Editor** tab on the left sidebar.
2. Click **New Query**.
3. Open the file [`supabase/migrations/20260929_aeroloom_core_schema.sql`](file:///E:/projects/Aeroloom/supabase/migrations/20260929_aeroloom_core_schema.sql) in this repository.
4. Copy the entire contents of the file, paste into the Supabase SQL Editor, and click **Run**.
5. Verify that all 5 tables are created successfully:
   - `public.profiles` (User profile details & preferences)
   - `public.saved_flights` (Pinned transponder hexes & callsigns)
   - `public.watchlists` (Custom transponder tracking groups)
   - `public.alert_rules` (User alert triggers: 7700 squawks, ceiling excursions)
   - `public.airspace_alerts` (Historical transponder event log)

---

### Step 5: Configure Supabase Authentication Settings
1. In the Supabase Dashboard, navigate to **Authentication** &rarr; **URL Configuration**.
2. Set **Site URL** to:
   - `http://localhost:3000` (for local development)
   - Or your production Vercel URL when deploying.
3. Under **Redirect URLs**, add:
   - `http://localhost:3000/**`
   - `https://your-production-app.vercel.app/**` (once known)
4. (Optional) In **Authentication** &rarr; **Providers** &rarr; **Email**, you can toggle "Confirm email" OFF if you want instant test logins without waiting for verification emails in development.

---

### Step 6: Verify Health with Aeroloom Automated Validator
Run the automated validator from your terminal:
```bash
npm run check:env
```
The validator will check your environment variables, verify token formats (supporting both legacy JWT `ey...` and modern Supabase publishable keys `sb_...`), test network reachability to the Supabase Auth API, and confirm that Cloud-Synced mode is fully operational!

---

## 3. Hosted Project Acceptance & Live Verification Status

| Component | Status | Verification Detail |
| :--- | :--- | :--- |
| **`.env.local` Credentials** | **Verified** | Both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` configured and non-empty. Zero secret exposure. |
| **API Key Compatibility** | **Verified** | Modern Supabase Publishable Key (`sb_...`) verified and accepted by `validate-supabase.ts`. |
| **Auth Service Reachability** | **Verified** | HTTP 200 received from hosted Supabase `/auth/v1/health` endpoint. |
| **Core Database Schema** | **Verified Applied** | All 5 tables (`profiles`, `saved_flights`, `watchlists`, `alert_rules`, `airspace_alerts`) exist and returned HTTP 200. |
| **PostgreSQL RLS Policies** | **Verified Enforced** | Unauthenticated insert attempts to `profiles`, `saved_flights`, `watchlists`, and `alert_rules` rejected with Postgres code `42501`. |
| **Hosted Registration & Login** | **Verified Operational** | Email confirmation disabled. Tested real `signUp`, instant session issuance, `signOut`, `signInWithPassword`, and failure handling (`Invalid login credentials`). |
| **Profile Trigger (`handle_new_user`)** | **Verified Operational** | Security definer trigger automatically provisions `public.profiles` row upon new user creation. |
| **Authenticated RLS & Cross-User Isolation** | **Verified Enforced** | Authenticated user can read/write own flights, watchlists, rules. Writes using another user's ID are strictly rejected (42501). |
| **Multi-Tier Persistence** | **Verified** | `CloudPersistenceAdapter` operates with graceful fallback to `LocalDevicePersistenceAdapter` when unauthenticated. |

