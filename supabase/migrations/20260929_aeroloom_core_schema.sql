-- ============================================================================
-- AEROLOOM: THE ATMOSPHERIC OBSERVATORY
-- Database Migration: Core User Persistence & Airspace Intelligence Schema
-- Target: Supabase / PostgreSQL 15+
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. User Profiles Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT,
    callsign_callout BOOLEAN DEFAULT true,
    audio_alerts_enabled BOOLEAN DEFAULT true,
    preferred_sector TEXT DEFAULT 'ksfo',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Trigger to automatically create profile record when user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 2. Saved Flights Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.saved_flights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    aircraft_hex VARCHAR(6) NOT NULL,
    callsign VARCHAR(12),
    aircraft_type VARCHAR(8),
    registration VARCHAR(12),
    notes TEXT,
    saved_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_user_aircraft UNIQUE (user_id, aircraft_hex)
);

CREATE INDEX IF NOT EXISTS idx_saved_flights_user ON public.saved_flights(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_flights_hex ON public.saved_flights(aircraft_hex);

ALTER TABLE public.saved_flights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved flights"
    ON public.saved_flights FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can save flights"
    ON public.saved_flights FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved flights"
    ON public.saved_flights FOR DELETE
    USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 3. Watchlists Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.watchlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(64) NOT NULL,
    aircraft_hexes TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_watchlists_user ON public.watchlists(user_id);

ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own watchlists"
    ON public.watchlists FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own watchlists"
    ON public.watchlists FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watchlists"
    ON public.watchlists FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own watchlists"
    ON public.watchlists FOR DELETE
    USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 4. User Alert Rules Configuration Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.alert_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(64) NOT NULL,
    rule_type VARCHAR(32) NOT NULL, -- 'EMERGENCY_SQUAWK' | 'ALTITUDE_CEILING' | 'WATCHLIST_MATCH'
    threshold_altitude INT,
    squawk_code VARCHAR(4),
    enabled BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_alert_rules_user ON public.alert_rules(user_id);

ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alert rules"
    ON public.alert_rules FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alert rules"
    ON public.alert_rules FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alert rules"
    ON public.alert_rules FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alert rules"
    ON public.alert_rules FOR DELETE
    USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 5. Airspace Alert Event Log Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.airspace_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(32) NOT NULL,
    severity VARCHAR(16) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    aircraft_hex VARCHAR(6) NOT NULL,
    callsign VARCHAR(12),
    squawk VARCHAR(4),
    read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_alerts_user_created ON public.airspace_alerts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_hex ON public.airspace_alerts(aircraft_hex);

ALTER TABLE public.airspace_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alerts"
    ON public.airspace_alerts FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update alert read status"
    ON public.airspace_alerts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts"
    ON public.airspace_alerts FOR DELETE
    USING (auth.uid() = user_id);
