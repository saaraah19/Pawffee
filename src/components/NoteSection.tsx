import PawIcon from "./PawIcon";

export default function NoteSection({
  title,
  content,
  variant = "default",
}: {
  title: string;
  content?: string | null;
  variant?: "default" | "secret" | "verdict";
}) {
  if (!content) return null;

  const styles =
    variant === "secret"
      ? "border-gold/40 bg-[#fbf1e0]"
      : variant === "verdict"
      ? "border-taupe-soft bg-espresso text-cream"
      : "border-taupe-soft bg-paper";

  return (
    <section className={`rounded-2xl border p-6 ${styles}`}>
      <p
        className={`label-eyebrow mb-2 inline-flex items-center gap-1.5 ${
          variant === "verdict" ? "text-cream/70" : ""
        }`}
      >
        {variant === "secret" && <PawIcon size={11} className="text-gold" />}
        {title}
      </p>
      <div
        className={`whitespace-pre-line text-[0.95rem] leading-relaxed ${
          variant === "verdict" ? "font-display text-lg italic text-cream" : "text-coffee"
        }`}
      >
        {content}
      </div>
    </section>
  );
}
