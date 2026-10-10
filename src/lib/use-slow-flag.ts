import { useEffect, useState } from "react";

/**
 * Becomes true once `active` has stayed true for `ms` milliseconds.
 * Used to explain a slow request (for example a sleeping server) instead of
 * leaving the person staring at a spinner.
 */
export function useSlowFlag(active: boolean, ms = 4000): boolean {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => setSlow(true), ms);
    return () => {
      clearTimeout(timer);
      setSlow(false);
    };
  }, [active, ms]);

  return active && slow;
}
