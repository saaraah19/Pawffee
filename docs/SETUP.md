# Setup & deployment notes

Reference for running this locally or redeploying it — not meant to be
public-facing copy.

## Stack

Next.js (App Router) · PostgreSQL · Tailwind CSS · S3-compatible or
Cloudinary image storage · JWT-based single-admin auth.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL, SESSION_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm run seed                 # creates schema, admin account, categories, demo recipes
npm run dev
```

## Changing your admin email/password later

```bash
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-new-strong-password' npm run set-admin
```

Safe to run any time — updates the existing admin account rather than
creating a second one. Restart the app afterward if you also rotated
`SESSION_SECRET` and want to invalidate old sessions immediately.

## Removing demo content

```sql
DELETE FROM recipes WHERE is_demo = true;
```

## Deploying on Render (recommended path)

A `render.yaml` blueprint is included at the repo root. Do not run Postgres
inside the same web service container: Render web services (free *or*
paid) have ephemeral disk, so a self-hosted Postgres there gets wiped on
every redeploy/restart. Free-tier web services can't attach a persistent
disk at all, so this would be even less safe there, not more.

### Free-tier reality check

| | Free | Notes |
|---|---|---|
| Render web service | ✅ works fine for a small personal site | Spins down after 15 min idle; ~30-60s cold start on the next request |
| Render's own Postgres | ⚠️ not for real data | **Expires 30 days after creation**, 14-day grace period, then deleted along with everything in it |
| Neon / Supabase Postgres | ✅ recommended | Small free tier, but no expiration timer — data persists |
| Shell/SSH access | ❌ not on free web services | Needed for the one-time `npm run seed` — see workaround below |

If you want a genuinely free, permanent setup: use Render's free web
service for the app, paired with a free Postgres from **Neon** or
**Supabase** instead of Render's own database.

### Steps

1. Create a free Postgres database at neon.tech or supabase.com and copy its
   connection string.
2. Render dashboard → **New → Blueprint** → connect this repo. It reads
   `render.yaml` and creates the web service.
3. On the web service's **Environment** tab, fill in `DATABASE_URL` with
   the connection string from step 1, plus `ADMIN_EMAIL`, `ADMIN_PASSWORD`,
   and your Cloudinary keys (all deliberately left blank in the blueprint).
4. Deploy.
5. **Run the one-time seed.** Free web services don't have Shell access, so
   run it from your own machine instead, pointed at the remote database:
   ```bash
   DATABASE_URL="<the same connection string>" PGSSL=true \
   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-real-password' \
   npm run seed
   ```
   (On a paid Render plan, you'd instead get a Shell tab and could just run
   `npm run seed` there directly.)

## Required production environment variables

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `PGSSL` | `true` for most managed Postgres providers |
| `SESSION_SECRET` | Long random string. **The app will refuse to start in production without this set** — no silent fallback. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Only needed once, for `npm run seed` or `npm run set-admin` |

Image storage — set **one** of these:

| Cloudinary | S3-compatible |
|---|---|
| `CLOUDINARY_CLOUD_NAME` | `S3_BUCKET` |
| `CLOUDINARY_API_KEY` | `S3_ACCESS_KEY_ID` |
| `CLOUDINARY_API_SECRET` | `S3_SECRET_ACCESS_KEY` |
| | `S3_ENDPOINT` (non-AWS only) |
| | `S3_PUBLIC_URL_BASE` |

Without either, uploads fall back to local disk — fine for `npm run dev`,
**not** persistent on most hosting platforms.

## Build & run

```bash
npm run build
npm run start
```

## Notes on the admin area

- Auth is a single hardcoded admin account (rotate it with `npm run set-admin`), sessions via an `httpOnly`, `Secure`-in-production cookie.
- Login attempts are rate-limited per IP (in-memory — resets on restart/redeploy, fine for a single small instance).
- Draft recipes are unreachable from any public route — checked at the query level, not just hidden in the UI.
- Keeping the repository private is the only real way to keep the admin route itself out of sight — the README intentionally doesn't spell it out, but it's visible in the source either way once someone can read the code.
