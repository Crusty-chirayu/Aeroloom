# Aeroloom — Supabase Auth, Watchlist Sync & RLS Setup Guide

This document specifies the exact production configuration for Supabase Authentication, Row Level Security (RLS) policies, multi-tier persistence, and guest-mode cloud synchronization per **DESIGN_SPEC.md §8**.

---

## 1. PostgreSQL Database Schema & RLS Policies

Execute the following DDL script in the **Supabase SQL Editor**:

```sql
-- 1. Create Profiles Table (Triggered automatically on auth.users insert)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Auto-create profile trigger on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Create Saved Flights Table
CREATE TABLE IF NOT EXISTS public.saved_flights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  aircraft_hex TEXT NOT NULL,
  callsign TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, aircraft_hex)
);

ALTER TABLE public.saved_flights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own saved flights"
  ON public.saved_flights FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Create Watchlists Table
CREATE TABLE IF NOT EXISTS public.watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  aircraft_hexes TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own watchlists"
  ON public.watchlists FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Create Alert Rules Table
CREATE TABLE IF NOT EXISTS public.alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  condition_type TEXT NOT NULL,
  target_val TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own alert rules"
  ON public.alert_rules FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Create Airspace Alerts Table
CREATE TABLE IF NOT EXISTS public.airspace_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_id TEXT,
  aircraft_hex TEXT NOT NULL,
  callsign TEXT,
  alert_type TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.airspace_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own airspace alerts"
  ON public.airspace_alerts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

## 2. OAuth Provider Configuration

### A. Google OAuth
1. Go to **Google Cloud Console** > APIs & Services > Credentials.
2. Create an OAuth 2.0 Client ID (Web Application).
3. Authorized Redirect URIs: `https://<YOUR_SUPABASE_PROJECT_ID>.supabase.co/auth/v1/callback`
4. Copy **Client ID** and **Client Secret** into Supabase Dashboard under **Authentication > Providers > Google**.

### B. GitHub OAuth
1. Go to **GitHub Settings** > Developer Settings > OAuth Apps > New OAuth App.
2. Authorization Callback URL: `https://<YOUR_SUPABASE_PROJECT_ID>.supabase.co/auth/v1/callback`
3. Copy **Client ID** and **Client Secret** into Supabase Dashboard under **Authentication > Providers > GitHub**.

---

## 3. Multi-Tier Persistence & Guest Synchronization Protocol

1. **Guest Mode (Default):**
   - Unauthenticated visitors store watchlists, saved flights, and alert rules in `localStorage` under `aeroloom_watchlists_v1` and `aeroloom_alert_rules_v1`.
   - 100% of features function without requiring login.

2. **Sign-In Synchronization:**
   - When a user signs in via OAuth or Magic Link, `CloudPersistenceAdapter.syncLocalToCloud(userId)` reads existing guest local storage data and upserts it to Supabase PostgreSQL.
   - Cross-device updates sync via Supabase Realtime subscriptions.

3. **Fallback & Degradation:**
   - If Supabase environment variables are missing (`NEXT_PUBLIC_SUPABASE_URL`), the app automatically degrades to `LocalDevicePersistenceAdapter` with 0 console errors or breaking UI state.
