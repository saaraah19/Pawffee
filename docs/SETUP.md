# Setup and deployment notes

Reference for running Pawffee locally or redeploying it.

## Stack

Next.js (App Router), PostgreSQL, Tailwind CSS, S3-compatible or Cloudinary image storage, and a JWT-based single-admin login.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL, SESSION_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm run seed                 # creates schema, admin account, categories, demo recipes
npm run dev
```

## Changing your admin email or password later

```bash
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-new-strong-password' npm run set-admin
```

It is safe to run at any time. It updates the existing admin account instead of creating a second one. Restart the app afterwards if you also rotated `SESSION_SECRET` and want old sessions to stop working immediately.

## Removing demo content

```sql
DELETE FROM recipes WHERE is_demo = true;
```

## Deploying on Render

A `render.yaml` blueprint is included at the repo root.

Do not run Postgres inside the same web service container. Render web services (free or paid) have an ephemeral disk, so a self-hosted Postgres there is wiped on every redeploy or restart. Free web services cannot attach a persistent disk at all, which makes it even less safe.

### What the free tier gives you

| Service | Free tier | Notes |
|---|---|---|
| Render web service | Works well for a small personal site | Spins down after 15 minutes idle, then takes about 30 to 60 seconds to start on the next request |
| Render's own Postgres | Not for real data | Expires 30 days after creation, with a 14 day grace period, then it is deleted along with its data |
| Neon or Supabase Postgres | Recommended | Small free tier with no expiration timer, so the data persists |
| Shell or SSH access | Not available on free web services | Needed for the one-time `npm run seed`, see the workaround below |

For a free and permanent setup, use Render's free web service for the app and pair it with a free Postgres from Neon or Supabase.

### Steps

1. Create a free Postgres database at neon.tech or supabase.com and copy its connection string.
2. In the Render dashboard, choose **New**, then **Blueprint**, and connect this repository. Render reads `render.yaml` and creates the web service.
3. On the web service's **Environment** tab, fill in `DATABASE_URL` with the connection string from step 1, plus `ADMIN_EMAIL`, `ADMIN_PASSWORD` and your Cloudinary keys. They are all left blank in the blueprint on purpose.
4. Deploy.
5. Run the one-time seed. Free web services have no Shell tab, so run it from your own machine, pointed at the remote database:
   ```bash
   DATABASE_URL="<the same connection string>" PGSSL=true \
   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-real-password' \
   npm run seed
   ```
   On a paid Render plan you get a Shell tab and can run `npm run seed` there directly.

## Required production environment variables

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `PGSSL` | `true` for most managed Postgres providers |
| `SESSION_SECRET` | Long random string. The app refuses to start in production without it, there is no silent fallback |
| `ADMIN_EMAIL` and `ADMIN_PASSWORD` | Only needed once, for `npm run seed` or `npm run set-admin` |

Image storage: set one of these two groups.

| Cloudinary | S3-compatible |
|---|---|
| `CLOUDINARY_CLOUD_NAME` | `S3_BUCKET` |
| `CLOUDINARY_API_KEY` | `S3_ACCESS_KEY_ID` |
| `CLOUDINARY_API_SECRET` | `S3_SECRET_ACCESS_KEY` |
| `CLOUDINARY_FOLDER` (optional) | `S3_REGION` (optional) |
| | `S3_ENDPOINT` (non-AWS only) |
| | `S3_PUBLIC_URL_BASE` |

Without either group, uploads fall back to the local disk. That is fine for `npm run dev` but not persistent on most hosting platforms.

## Build and run

```bash
npm run build
npm run start
```

## Notes on the admin area

- Auth is a single admin account, which you can rotate with `npm run set-admin`. Sessions use an `httpOnly` cookie, marked `Secure` in production.
- Login attempts are rate limited per IP (8 attempts per 15 minutes). The counter lives in memory, so it resets on restart or redeploy, which is fine for a single small instance.
- Draft recipes are unreachable from any public route. This is enforced in the database queries, not only hidden in the interface.
- Keeping the repository private is the only real way to keep the admin route out of sight. The README does not spell it out, but it is visible in the source for anyone who can read the code.
