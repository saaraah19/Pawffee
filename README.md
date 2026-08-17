# Pawffee

A small, personal cooking and baking recipe website — the recipes are the
product. Built with Next.js (App Router), PostgreSQL, and Tailwind CSS.

## Stack

- **Framework:** Next.js 16 (App Router, TypeScript, Turbopack)
- **Database:** PostgreSQL, via the `pg` driver (no ORM — a small hand-written
  data-access layer in `src/lib/data/`)
- **Styling:** Tailwind CSS v4, self-hosted Fraunces + Work Sans fonts (no
  external font requests)
- **Auth:** Cookie-based admin session (JWT + bcrypt), single admin account
- **Image storage:** S3-compatible object storage in production (AWS S3,
  Cloudflare R2, Supabase Storage, DigitalOcean Spaces, MinIO, ...), with a
  local-disk fallback for `npm run dev`
- **PDF generation:** `@react-pdf/renderer` — a real structured document, not
  a screenshot

## Local setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start PostgreSQL** (locally, or point at any hosted instance) and create
   a database, e.g.:

   ```bash
   createdb pawffee
   ```

3. **Configure environment variables.** Copy `.env.example` to `.env.local`
   and fill in at least `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_EMAIL`, and
   `ADMIN_PASSWORD`:

   ```bash
   cp .env.example .env.local
   ```

   Object storage (`S3_*` vars) can stay empty for local development —
   uploaded images will be written to `public/uploads` instead. Fill them in
   before deploying (see below).

4. **Create the schema, admin account, and demo content:**

   ```bash
   npm run seed
   ```

   This is idempotent — safe to re-run. It creates the schema if missing,
   creates the admin user from `ADMIN_EMAIL`/`ADMIN_PASSWORD` if one doesn't
   exist yet, adds the starter categories, and adds a handful of demo
   recipes (tagged `is_demo` in the database) the first time only.

5. **Run the dev server:**

   ```bash
   npm run dev
   ```

   Visit `http://localhost:3000` for the public site and
   `http://localhost:3000/admin` for the admin area.

## Publishing your first real recipe

1. Sign in at `/admin/login` with the admin account created by the seed
   script (or created directly in the `admin_users` table).
2. Go to **Recipes → New recipe**.
3. Fill in the basic info, upload a cover image, add ingredients (optionally
   grouped, e.g. "For the dough" / "For the topping") and ordered steps.
4. Fill in whichever personal note sections apply — Before You Start, My
   Tips, My Little Secret, Cooking Notes, My Verdict. Empty ones are
   automatically hidden on the public page.
5. Click **Save as draft** to keep working on it privately, or **Publish**
   to make it live immediately. You can unpublish at any time from the
   recipes list.

## Removing the demo content

The seed script tags its recipes with `is_demo = true`. Once you have real
content, remove them from the admin recipe list, or directly:

```sql
DELETE FROM recipes WHERE is_demo = true;
```

## Production deployment

- **Database:** point `DATABASE_URL` at a managed Postgres instance (e.g.
  Supabase, Neon, Render, RDS). Set `PGSSL=true` for providers that require
  SSL (most do).
- **Image storage:** set `S3_BUCKET`, `S3_ACCESS_KEY_ID`,
  `S3_SECRET_ACCESS_KEY`, and (for non-AWS providers) `S3_ENDPOINT` and
  `S3_PUBLIC_URL_BASE`. Without these, uploads fall back to the local
  filesystem, which is **not persistent** on most hosting platforms
  (serverless functions and most container platforms wipe local disk on
  every deploy/restart) — configure object storage before going live.
- **Session secret:** set `SESSION_SECRET` to a long random value.
- Build and run:

  ```bash
  npm run build
  npm run start
  ```

## Project structure

```
src/
  app/
    (site)/            # public pages: home, recipes, categories, about
    admin/
      (auth)/login/     # admin login (no sidebar layout)
      (dashboard)/      # dashboard, recipes CRUD, categories CRUD (behind auth)
    api/admin/          # admin REST API (recipes, categories, upload, auth)
  components/            # public + admin UI components
  lib/
    data/                # recipe & category data-access layer (Postgres)
    db.ts                # pg pool + schema migration
    auth.ts               # admin auth helpers
    storage.ts            # S3-compatible image storage (+ dev fallback)
    pdf.tsx                # recipe PDF document definition
    validation.ts          # zod schema for the recipe editor payload
scripts/
  seed.ts                # schema + admin user + categories + demo recipes
```
