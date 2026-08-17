import { Pool, type QueryResultRow } from "pg";

declare global {
   
  var __pawffee_pg_pool__: Pool | undefined;
   
  var __pawffee_schema_ready__: Promise<void> | undefined;
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Pawffee requires a PostgreSQL connection string, e.g. " +
        "postgres://user:password@host:5432/pawffee"
    );
  }
  return new Pool({
    connectionString,
    // Most managed Postgres providers (Supabase, Neon, Render) require SSL.
    // Local/self-hosted Postgres typically doesn't -- opt in via PGSSL=true.
    ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : undefined,
    max: 10,
  });
}

export const pool = global.__pawffee_pg_pool__ ?? createPool();
if (process.env.NODE_ENV !== "production") global.__pawffee_pg_pool__ = pool;

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const result = await pool.query<T>(text, params);
  return result.rows;
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T | undefined> {
  const rows = await query<T>(text, params);
  return rows[0];
}

/**
 * Runs a set of statements inside a single client/transaction.
 * `fn` receives a query function bound to the transaction's client.
 */
export async function transaction<T>(
  fn: (q: <R extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]) => Promise<R[]>) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const q = async <R extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []) => {
      const res = await client.query<R>(text, params);
      return res.rows;
    };
    const result = await fn(q);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS recipes (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    cover_image TEXT,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'draft',
    featured BOOLEAN NOT NULL DEFAULT false,
    prep_time INTEGER,
    rest_time INTEGER,
    cook_time INTEGER,
    servings INTEGER,
    difficulty TEXT,
    cost_dzd INTEGER,
    before_you_start TEXT,
    my_tips TEXT,
    my_secret TEXT,
    cooking_notes TEXT,
    my_verdict TEXT,
    is_demo BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT recipes_status_check CHECK (status IN ('draft', 'published')),
    CONSTRAINT recipes_difficulty_check CHECK (difficulty IS NULL OR difficulty IN ('easy', 'medium', 'hard'))
  );

  CREATE TABLE IF NOT EXISTS ingredient_groups (
    id SERIAL PRIMARY KEY,
    recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    name TEXT,
    position INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS ingredients (
    id SERIAL PRIMARY KEY,
    recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    group_id INTEGER REFERENCES ingredient_groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity TEXT,
    unit TEXT,
    notes TEXT,
    position INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS steps (
    id SERIAL PRIMARY KEY,
    recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 0,
    text TEXT NOT NULL,
    image TEXT
  );

  CREATE TABLE IF NOT EXISTS recipe_images (
    id SERIAL PRIMARY KEY,
    recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    caption TEXT,
    position INTEGER NOT NULL DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_recipe_images_recipe ON recipe_images(recipe_id);

  CREATE INDEX IF NOT EXISTS idx_recipes_status ON recipes(status);
  CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category_id);
  CREATE INDEX IF NOT EXISTS idx_ingredients_recipe ON ingredients(recipe_id);
  CREATE INDEX IF NOT EXISTS idx_ingredient_groups_recipe ON ingredient_groups(recipe_id);
  CREATE INDEX IF NOT EXISTS idx_steps_recipe ON steps(recipe_id);
`;

async function runSchema() {
  await pool.query(SCHEMA_SQL);
}

/**
 * Ensures the schema exists. Safe to call from many places concurrently --
 * the migration only runs once per process thanks to the memoized promise.
 */
export function ensureSchema(): Promise<void> {
  if (!global.__pawffee_schema_ready__) {
    global.__pawffee_schema_ready__ = runSchema();
  }
  return global.__pawffee_schema_ready__;
}
