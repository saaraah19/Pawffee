import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DB_CHECK_TIMEOUT_MS = 6000;

// Anyone can call this, and the standalone wake page calls it from another
// origin, so it only ever reports "up" or "down" and nothing else.
const HEADERS = {
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
};

async function checkDatabase(): Promise<"up" | "down"> {
  try {
    // Imported lazily so a missing DATABASE_URL shows up as "down" here
    // instead of making the whole endpoint fail to load.
    const { pool } = await import("@/lib/db");
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("database check timed out")), DB_CHECK_TIMEOUT_MS);
    });
    try {
      await Promise.race([pool.query("SELECT 1"), timeout]);
    } finally {
      clearTimeout(timer);
    }
    return "up";
  } catch {
    return "down";
  }
}

/**
 * Health check used by the cold start screens.
 *
 * If this responds at all, the web server is awake. The `db` field says
 * whether the database is awake too (free Postgres tiers pause when idle).
 * Calling it also nudges a paused database to start waking up.
 */
export async function GET() {
  const db = await checkDatabase();
  return NextResponse.json(
    { status: db === "up" ? "ok" : "degraded", app: "up", db },
    { status: db === "up" ? 200 : 503, headers: HEADERS }
  );
}
