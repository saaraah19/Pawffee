"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PawIcon from "@/components/PawIcon";

const POLL_EVERY_MS = 3000;
const MAX_POLLS = 40; // about two minutes

async function isHealthy(): Promise<boolean> {
  try {
    const res = await fetch("/api/health", { cache: "no-store", signal: AbortSignal.timeout(8000) });
    const body = (await res.json()) as { status?: string };
    return body.status === "ok";
  } catch {
    return false;
  }
}

type Phase = "checking" | "waking" | "failed";

/**
 * Shown when a page fails to render.
 *
 * It first asks /api/health whether the failure looks like a cold start.
 * If the server or database is not ready it says so, keeps polling, and
 * reloads the page by itself once things are up. If the health check is fine,
 * the error is something else, so it stops there and offers a manual retry.
 * That check is also what prevents an endless reload loop.
 */
export default function ErrorPanel({
  error,
  reset,
  backHref = "/",
  backLabel = "Back to home",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  backHref?: string;
  backLabel?: string;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("checking");
  const [round, setRound] = useState(0);

  // router.refresh() re-runs the server components, reset() re-renders the
  // boundary. Both are needed for a server-side failure to actually retry.
  const retry = () => {
    startTransition(() => {
      router.refresh();
      reset();
    });
  };
  const retryRef = useRef(retry);
  useEffect(() => {
    retryRef.current = retry;
  });

  useEffect(() => {
    console.error(error);
  }, [error]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function watch() {
      if (await isHealthy()) {
        if (!cancelled) setPhase("failed");
        return;
      }
      if (cancelled) return;
      setPhase("waking");

      for (let i = 0; i < MAX_POLLS; i++) {
        await new Promise<void>((resolve) => {
          timer = setTimeout(resolve, POLL_EVERY_MS);
        });
        if (cancelled) return;
        if (await isHealthy()) {
          if (!cancelled) retryRef.current();
          return;
        }
      }
      if (!cancelled) setPhase("failed");
    }

    void watch();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [round]);

  const waiting = phase !== "failed";

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-5 py-24 text-center sm:px-8">
      <PawIcon size={26} className={`mb-5 text-paw ${waiting ? "animate-pulse" : ""}`} />

      {waiting ? (
        <div role="status" aria-live="polite">
          <h1 className="font-display text-3xl font-semibold text-espresso">
            Waking up the kitchen
          </h1>
          <p className="mt-3 text-coffee">
            The server was resting and is starting up again. This page will reload by itself
            as soon as it is ready, usually within a minute.
          </p>
        </div>
      ) : (
        <div role="alert">
          <h1 className="font-display text-3xl font-semibold text-espresso">
            That did not work
          </h1>
          <p className="mt-3 text-coffee">
            Something went wrong while loading this page. It is usually temporary, so trying
            again often fixes it.
          </p>
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => {
            setPhase("checking");
            setRound((r) => r + 1);
            retry();
          }}
          className="rounded-full bg-espresso px-6 py-3 text-sm font-medium text-cream transition-colors hover:bg-gold-deep"
        >
          Try again
        </button>
        <Link
          href={backHref}
          className="rounded-full border border-espresso/20 px-6 py-3 text-sm font-medium text-espresso transition-colors hover:border-gold hover:text-gold-deep"
        >
          {backLabel}
        </Link>
      </div>
    </div>
  );
}
