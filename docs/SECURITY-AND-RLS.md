# Aeroloom — Security Architecture & Row Level Security (RLS) Specification

## 1. Security Architecture Principles

Aeroloom enforces strict defence-in-depth principles:
1. **Never Trust Client Payloads:** All database read, write, update, and delete permissions are validated strictly at the database layer via PostgreSQL Row Level Security using `auth.uid()`.
2. **Zero Client Secret Exposure:** Only `NEXT_PUBLIC_SUPABASE_ANON_KEY` is bundled in client-side JavaScript. Service-role credentials (`SUPABASE_SERVICE_ROLE_KEY`) are strictly restricted to server runtimes and never prefixed with `NEXT_PUBLIC_`.
3. **No Unauthenticated Cross-User Leakage:** Anonymous users cannot query private user tables. Authenticated users cannot read, mutate, or delete records belonging to any other user.
4. **Zero Fabricated Telemetry:** ADS-B telemetry is normalized directly from verified public readsb transponder feeds with WGS-84 coordinate validation, track angle clamping, and octal squawk validation.

---

## 2. Row Level Security (RLS) Matrix

Every user-owned table in the Aeroloom database has RLS explicitly enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`).

| Table Name | Operation | Policy Name | Enforcement Clause |
| :--- | :--- | :--- | :--- |
| `public.profiles` | `SELECT` | `Users can read own profile` | `USING (auth.uid() = id)` |
| `public.profiles` | `INSERT` | `Users can insert own profile` | `WITH CHECK (auth.uid() = id)` |
| `public.profiles` | `UPDATE` | `Users can update own profile` | `USING (auth.uid() = id)` |
| `public.saved_flights` | `SELECT` | `Users can view own saved flights` | `USING (auth.uid() = user_id)` |
| `public.saved_flights` | `INSERT` | `Users can save flights` | `WITH CHECK (auth.uid() = user_id)` |
| `public.saved_flights` | `DELETE` | `Users can delete own saved flights` | `USING (auth.uid() = user_id)` |
| `public.watchlists` | `SELECT` | `Users can view own watchlists` | `USING (auth.uid() = user_id)` |
| `public.watchlists` | `INSERT` | `Users can create own watchlists` | `WITH CHECK (auth.uid() = user_id)` |
| `public.watchlists` | `UPDATE` | `Users can update own watchlists` | `USING (auth.uid() = user_id)` |
| `public.watchlists` | `DELETE` | `Users can delete own watchlists` | `USING (auth.uid() = user_id)` |
| `public.alert_rules` | `SELECT` | `Users can view own alert rules` | `USING (auth.uid() = user_id)` |
| `public.alert_rules` | `INSERT` | `Users can insert own alert rules` | `WITH CHECK (auth.uid() = user_id)` |
| `public.alert_rules` | `UPDATE` | `Users can update own alert rules` | `USING (auth.uid() = user_id)` |
| `public.alert_rules` | `DELETE` | `Users can delete own alert rules` | `USING (auth.uid() = user_id)` |
| `public.airspace_alerts`| `SELECT` | `Users can view own alerts` | `USING (auth.uid() = user_id OR user_id IS NULL)` |
| `public.airspace_alerts`| `UPDATE` | `Users can update alert read status`| `USING (auth.uid() = user_id)` |
| `public.airspace_alerts`| `DELETE` | `Users can delete own alerts` | `USING (auth.uid() = user_id)` |

---

## 3. Database Triggers & Automated Provisioning

### `public.handle_new_user()`
To prevent orphaned profiles and guarantee immediate profile creation upon signup:
```sql
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
```
This runs as `SECURITY DEFINER`, ensuring that even when user email verification is enabled, the profile record is initialized safely with the user's selected callsign.

---

## 4. Session & Cookie Security (Next.js 16 App Router)

- Next.js 16 App Router requires asynchronous header and cookie access: `await cookies()`.
- Supabase SSR cookies (`@supabase/ssr`) are configured with:
  - `SameSite=Lax` to prevent cross-site request forgery.
  - `Secure` flag in production environments (HTTPS).
  - Server-side session verification prevents unauthorized access to protected dashboard routes.

---

## 5. Telemetry Validation Safeguards

1. **WGS-84 Coordinate Clamping:** Latitude is constrained strictly to `[-90.0, 90.0]`, longitude to `[-180.0, 180.0]`. Out-of-bound inputs are rejected before passing to MapLibre or PostGIS.
2. **Squawk Sanitization:** Squawks are validated as 4-character octal strings (`[0-7]{4}`). Malformed or injected strings are dropped.
3. **Data Freshness Guard:** Live alerts are only triggered for aircraft whose telemetry was received within the last 120 seconds, preventing stale ghost notifications.
