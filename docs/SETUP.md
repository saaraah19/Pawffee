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
