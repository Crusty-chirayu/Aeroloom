# Aeroloom — Repository Owner Launch Checklist

This checklist guides the owner (**Chirayu Sharma**) in transitioning Aeroloom from local repository development to public live deployment.

---

## 1. Developer & Legal Configuration (`lib/site-config.ts`)

Aeroloom uses `lib/site-config.ts` as the single source of truth for branding, metadata, developer links, and compliance placeholders.

Review the following fields in `lib/site-config.ts`:

- [ ] **Developer Name**: Current value is `"Chirayu Sharma"`. Confirm preferred portfolio display name.
- [ ] **Developer Role**: Current value is `"Lead Architect & Systems Engineer"`.
- [ ] **Developer Location**: Current value is `"India"`.
- [ ] **Portfolio URL**: `https://chirayu.dev` — Update to your active personal website/portfolio URL.
- [ ] **GitHub Profile**: `https://github.com/Crusty-chirayu` — Update to your GitHub handle.
- [ ] **LinkedIn Profile**: `https://linkedin.com/in/chirayusharma` — Update to your LinkedIn profile URL.
- [ ] **Contact Email**: `contact@chirayu.dev` — Update to your active inbox address (used by obfuscated contact mailto links).
- [ ] **Legal Owner Placeholders (`TODO_OWNER`)**:
  - `legalOwner`: Entity or individual name legally operating the deployment.
  - `jurisdiction`: Governing law jurisdiction (default: `State of Delaware / Republic of India`).
  - `disputeVenue`: City/court for arbitration or dispute resolution.

---

## 2. Third-Party Free-Tier Accounts & API Keys

Aeroloom is built to run entirely on zero-cost free tiers. Complete these one-time registrations:

### A. Upstash Redis (Caching Tier)
- [ ] Register at [upstash.com](https://upstash.com) (Hobby Free Tier: 10,000 requests/day).
- [ ] Create a regional database (`aeroloom-cache`).
- [ ] Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
- [ ] Add both to your Vercel Project Environment Variables.

### B. Supabase (PostgreSQL & OAuth Authentication)
- [ ] Register at [supabase.com](https://supabase.com) (Free Tier: 2 free projects).
- [ ] Create project (`aeroloom-db`).
- [ ] Apply SQL migration schema from `docs/AUTH_SETUP.md`.
- [ ] In Supabase **Authentication** &rarr; **URL Configuration**:
  - Site URL: `https://your-domain.vercel.app`
  - Redirect URLs: `https://your-domain.vercel.app/auth/callback`, `http://localhost:3000/auth/callback`
- [ ] (Optional) In Supabase **Authentication** &rarr; **Providers**:
  - Enable **Google** (enter Client ID & Secret from Google Cloud Console).
  - Enable **GitHub** (enter Client ID & Secret from GitHub Developer Settings).
- [ ] Copy `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.

### C. OpenRouter (Grounded AI Flight Assistant)
- [ ] Register at [openrouter.ai](https://openrouter.ai).
- [ ] Create API key (`aeroloom-assistant`).
- [ ] Copy `OPENROUTER_API_KEY` to Vercel Environment Variables.
- [ ] Confirm free-tier models are active: `meta-llama/llama-3.3-70b-instruct:free`, `google/gemini-2.0-flash-exp:free`, `qwen/qwen-2.5-72b-instruct:free`.

---

## 3. Production Deployment (Vercel)

- [ ] Push clean branch `redesign/v2` to GitHub:
  ```bash
  git push origin redesign/v2
  ```
- [ ] Connect repository in [vercel.com](https://vercel.com).
- [ ] Configure Environment Variables as specified in `docs/DEPLOY.md`:
  - `NEXT_PUBLIC_SITE_URL` = `https://your-domain.vercel.app`
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `OPENROUTER_API_KEY`
- [ ] Deploy and verify production build logs.

---

## 4. Custom Domain & DNS (Optional)

If pointing a custom domain (e.g., `aeroloom.dev` or `aeroloom.aero`):
- [ ] Add domain in Vercel Project Settings &rarr; **Domains**.
- [ ] Set DNS `A` / `CNAME` records at your domain registrar.
- [ ] Update `NEXT_PUBLIC_SITE_URL` in Vercel to match the custom domain.
- [ ] Update Supabase **Redirect URLs** to match the custom domain.

---

## 5. Verification Commands

Run these local checks before sharing or demonstrating the observatory:

```bash
# 1. Type-check & lint
npx tsc --noEmit
npm run lint

# 2. Automated test suite (194 tests)
npm test

# 3. Pre-flight launch readiness audit
npm run check:launch

# 4. Production build validation
npm run build

# 5. Secrets leak scan
node scripts/audit-secrets.mjs

# 6. WCAG 2.2 AA accessibility scan (with production server running)
node scripts/audit-accessibility.mjs

# 7. Horizontal overflow scan (with production server running)
node scripts/check-overflow.mjs
```

---

## 6. Social Preview & Share Assets

All social cards are generated automatically:
- Root card: `/opengraph-image`
- Dynamic flight cards: `/flight/[flightId]/opengraph-image`
- Dynamic airport cards: `/airport/[code]/opengraph-image`
- Favicon: `/icon.svg`
- Apple Touch Icon: `/apple-icon`
