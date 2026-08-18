/**
 * A minimal in-memory rate limiter for the admin login endpoint.
 *
 * This is intentionally simple: it's per-process, so on a multi-instance
 * deploy each instance tracks separately (fine for a single small site on a
 * single instance, which is how Pawffee is meant to run). It's here to slow
 * down casual password guessing, not to replace a strong password.
 */

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 8;

type Bucket = { count: number; resetAt: number };
const attempts = new Map<string, Bucket>();

// Periodically forget old buckets so this doesn't grow forever.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of attempts) {
    if (bucket.resetAt < now) attempts.delete(key);
  }
}, WINDOW_MS).unref?.();

export function checkLoginRateLimit(identifier: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const bucket = attempts.get(identifier);

  if (!bucket || bucket.resetAt < now) {
    attempts.set(identifier, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (bucket.count >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}

export function resetLoginRateLimit(identifier: string): void {
  attempts.delete(identifier);
}
