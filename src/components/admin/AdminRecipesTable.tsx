"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { RecipeRow } from "@/lib/data/recipes";
import { formatDate } from "@/lib/utils";
import StatusPill from "./StatusPill";

export default function AdminRecipesTable({ recipes }: { recipes: RecipeRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rows, setRows] = useState(recipes);

  async function toggleStatus(recipe: RecipeRow) {
    setBusyId(recipe.id);
    const nextStatus = recipe.status === "published" ? "draft" : "published";
    try {
      const res = await fetch(`/api/admin/recipes/${recipe.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setRows((prev) =>
          prev.map((r) => (r.id === recipe.id ? { ...r, status: nextStatus } : r))
        );
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(recipe: RecipeRow) {
    if (!confirm(`Delete "${recipe.title}"? This cannot be undone.`)) return;
    setBusyId(recipe.id);
    try {
      const res = await fetch(`/api/admin/recipes/${recipe.id}`, { method: "DELETE" });
      if (res.ok) {
        setRows((prev) => prev.filter((r) => r.id !== recipe.id));
        router.refresh();
      }
    } finally {
      setBusyId(null);
    }
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-taupe-soft bg-paper/60 p-10 text-center text-sm text-coffee">
        No recipes yet — create your first one.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-taupe-soft bg-paper">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-taupe-soft text-xs text-taupe">
            <th className="px-5 py-3 font-medium">Title</th>
            <th className="px-5 py-3 font-medium">Category</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium">Updated</th>
            <th className="px-5 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-taupe-soft/60 last:border-0">
              <td className="px-5 py-3">
                <Link href={`/admin/recipes/${r.id}/edit`} className="font-medium text-espresso hover:text-gold-deep">
                  {r.title}
                </Link>
              </td>
              <td className="px-5 py-3 text-coffee">{r.category_name ?? "—"}</td>
              <td className="px-5 py-3"><StatusPill status={r.status} /></td>
              <td className="px-5 py-3 text-taupe">{formatDate(r.updated_at)}</td>
              <td className="px-5 py-3">
                <div className="flex justify-end gap-3 text-xs">
                  <button
                    onClick={() => toggleStatus(r)}
                    disabled={busyId === r.id}
                    className="font-medium text-gold-deep hover:underline disabled:opacity-60"
                  >
                    {r.status === "published" ? "Unpublish" : "Publish"}
                  </button>
                  <Link href={`/admin/recipes/${r.id}/edit`} className="font-medium text-coffee hover:underline">
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(r)}
                    disabled={busyId === r.id}
                    className="font-medium text-danger hover:underline disabled:opacity-60"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
