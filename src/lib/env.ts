/**
 * Reads a required secret from the environment. In production this throws
 * loudly at first use instead of silently falling back to a dev default.
 * A forgotten env var should break the deploy, not quietly weaken security.
 */
export function requireSecret(name: string, devFallback: string): string {
  const value = process.env[name];
  if (value && value.trim()) return value;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      `${name} is not set. Pawffee refuses to start in production without it, ` +
        `set it in your hosting provider's environment variables (a long random string).`
    );
  }
  return devFallback;
}
