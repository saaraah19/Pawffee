import PawIcon from "./PawIcon";

export default function EmptyState({
  title,
  message,
}: {
  title: string;
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-taupe-soft bg-paper/60 px-8 py-16 text-center">
      <PawIcon size={22} className="mb-4 text-taupe" />
      <p className="font-display text-lg text-espresso">{title}</p>
      {message && <p className="mt-2 max-w-sm text-sm text-coffee">{message}</p>}
    </div>
  );
}
