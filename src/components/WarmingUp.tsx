"use client";

import { useEffect, useState } from "react";
import PawIcon from "@/components/PawIcon";

const SLOW_AFTER_MS = 4000;

/**
 * Loading state for pages that wait on the database. It shows a skeleton right
 * away and, if the wait drags on, explains why. That usually means the
 * database was paused and is waking up.
 */
export default function WarmingUp({ cards = 3 }: { cards?: number }) {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), SLOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8" aria-busy="true">
      <div role="status" aria-live="polite" className="mb-10 flex items-start gap-3">
        <PawIcon size={18} className="mt-0.5 shrink-0 animate-pulse text-paw" />
        <div>
          <p className="font-display text-lg text-espresso">
            {slow ? "Still warming up the kitchen" : "Loading"}
          </p>
          {slow && (
            <p className="mt-1 max-w-md text-sm text-coffee">
              The site rests when nobody has visited for a while, so the first page can take
              up to a minute. It will appear on its own.
            </p>
          )}
        </div>
      </div>

      <div className="animate-pulse" aria-hidden="true">
        <div className="h-3 w-24 rounded-full bg-taupe-soft" />
        <div className="mt-4 h-9 w-2/3 max-w-md rounded-lg bg-taupe-soft" />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: cards }, (_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-taupe-soft bg-paper">
              <div className="aspect-[4/3] bg-taupe-soft" />
              <div className="space-y-3 p-5">
                <div className="h-4 w-3/4 rounded-full bg-taupe-soft" />
                <div className="h-3 w-1/2 rounded-full bg-taupe-soft/70" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
