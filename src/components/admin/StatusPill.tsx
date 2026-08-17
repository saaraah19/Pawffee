export default function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
        status === "published" ? "bg-success/10 text-success" : "bg-taupe-soft text-coffee"
      }`}
    >
      {status === "published" ? "Published" : "Draft"}
    </span>
  );
}
