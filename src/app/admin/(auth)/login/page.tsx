"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PawIcon from "@/components/PawIcon";
import { useSlowFlag } from "@/lib/use-slow-flag";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const slow = useSlowFlag(loading);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-5">
      <div className="w-full max-w-sm rounded-2xl border border-taupe-soft bg-paper p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <PawIcon size={20} className="mb-3 text-gold" />
          <h1 className="font-display text-2xl font-semibold text-espresso">Pawffee Admin</h1>
          <p className="mt-1 text-sm text-coffee">Sign in to manage recipes.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-espresso">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-taupe-soft bg-cream px-3.5 py-2.5 text-sm text-espresso focus:border-gold"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-espresso">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-taupe-soft bg-cream px-3.5 py-2.5 text-sm text-espresso focus:border-gold"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-espresso py-2.5 text-sm font-medium text-cream transition-colors hover:bg-gold-deep disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
          {slow && (
            <p role="status" className="text-center text-xs text-coffee">
              The server is waking up after a quiet spell. This can take up to a minute.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
