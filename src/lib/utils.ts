import slugifyLib from "slugify";

export function slugify(input: string) {
  return slugifyLib(input, { lower: true, strict: true, trim: true });
}

export function formatMinutes(mins?: number | null) {
  if (!mins && mins !== 0) return null;
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
}

export function totalTime(prep?: number | null, rest?: number | null, cook?: number | null) {
  const sum = (prep || 0) + (rest || 0) + (cook || 0);
  return sum || null;
}

export function formatCost(dzd?: number | null) {
  if (!dzd && dzd !== 0) return null;
  return `${dzd.toLocaleString("en-US")} DZD`;
}

export const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
