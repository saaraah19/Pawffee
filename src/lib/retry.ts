/**
 * Small retry helper for the database layer.
 *
 * Free Postgres tiers (Neon, Supabase) pause when idle, and the first
 * connection after a pause can be refused or time out while the database
 * wakes up. Retrying a few times with a growing delay turns that into a slow
 * first page instead of an error page.
 */

export type RetryOptions = {
  /** Total number of tries, including the first one. */
  attempts?: number;
  /** Delay before the second try. Doubles after every failure. */
  baseDelayMs?: number;
  /** Upper bound for the delay between tries. */
  maxDelayMs?: number;
  /** Decides whether an error is worth another try. */
  shouldRetry?: (err: unknown) => boolean;
  /** Replaceable so tests do not have to wait. */
  sleep?: (ms: number) => Promise<void>;
};

const TRANSIENT_CODES = new Set([
  // Node socket errors
  "ECONNREFUSED",
  "ECONNRESET",
  "ECONNABORTED",
  "ETIMEDOUT",
  "ENOTFOUND",
  "EAI_AGAIN",
  "EPIPE",
  // Postgres: shutting down, starting up, connection exceptions, too many clients
  "57P01",
  "57P02",
  "57P03",
  "08000",
  "08001",
  "08003",
  "08004",
  "08006",
  "53300",
]);

const TRANSIENT_MESSAGES: RegExp[] = [
  /timeout exceeded when trying to connect/i,
  /connection terminated/i,
  /connection (was )?(closed|reset)/i,
  /server closed the connection unexpectedly/i,
  /the database system is (starting up|shutting down)/i,
];

/**
 * True for errors that mean "the database is not reachable right now" and
 * are likely to go away on their own. Constraint violations, bad SQL and
 * similar errors are not transient and must surface immediately.
 */
export function isTransientDbError(err: unknown, depth = 0): boolean {
  if (!err || typeof err !== "object" || depth > 3) return false;
  const e = err as { code?: unknown; message?: unknown; cause?: unknown; errors?: unknown };

  if (typeof e.code === "string" && TRANSIENT_CODES.has(e.code)) return true;
  if (typeof e.message === "string" && TRANSIENT_MESSAGES.some((re) => re.test(e.message as string))) {
    return true;
  }
  // Node reports a failed dual-stack connect as an AggregateError.
  if (Array.isArray(e.errors) && e.errors.some((inner) => isTransientDbError(inner, depth + 1))) {
    return true;
  }
  return e.cause ? isTransientDbError(e.cause, depth + 1) : false;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const {
    attempts = 4,
    baseDelayMs = 600,
    maxDelayMs = 4000,
    shouldRetry = isTransientDbError,
    sleep = defaultSleep,
  } = options;

  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= attempts || !shouldRetry(err)) throw err;
      await sleep(Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1)));
    }
  }
}
