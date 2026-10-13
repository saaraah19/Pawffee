"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@/lib/data/categories";

type CategoryWithCount = Category & { recipe_count: number };

export default function CategoryManager({ categories }: { categories: CategoryWithCount[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(categories);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not create category.");
        return;
      }
      setRows((prev) => [...prev, { ...data.category, recipe_count: 0 }].sort((a, b) => a.name.localeCompare(b.name)));
      setName("");
      setDescription("");
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(c: CategoryWithCount) {
    setEditingId(c.id);
    setEditName(c.name);
    setEditDescription(c.description ?? "");
  }

  async function saveEdit(id: number) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), description: editDescription.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setRows((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ...data.category } : c))
        );
        setEditingId(null);
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(c: CategoryWithCount) {
    const warning =
      c.recipe_count > 0
        ? `"${c.name}" has ${c.recipe_count} recipe(s). Deleting it will leave those recipes uncategorized. Continue?`
        : `Delete "${c.name}"?`;
    if (!confirm(warning)) return;
    setBusyId(c.id);
    try {
      const res = await fetch(`/api/admin/categories/${c.id}`, { method: "DELETE" });
      if (res.ok) {
        setRows((prev) => prev.filter((r) => r.id !== c.id));
        router.refresh();
      }
    } finally {
      setBusyId(null);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-taupe-soft bg-cream px-3.5 py-2.5 text-sm text-espresso focus:border-gold";

  return (
    <div>
      <form onSubmit={handleCreate} className="mb-8 rounded-2xl border border-taupe-soft bg-paper p-6">
        <h2 className="font-display text-lg font-semibold text-espresso">Add a category</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <input
            placeholder="Name (e.g. Cakes)"
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            placeholder="Short description (optional)"
            className={inputClass}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="mt-4 rounded-full bg-espresso px-5 py-2.5 text-sm font-medium text-cream hover:bg-gold-deep disabled:opacity-60"
        >
          {saving ? "Adding…" : "Add category"}
        </button>
      </form>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-taupe-soft bg-paper/60 p-8 text-center text-sm text-coffee">
          No categories yet.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-taupe-soft bg-paper">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-taupe-soft text-xs text-taupe">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Description</th>
                <th className="px-5 py-3 font-medium">Recipes</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-b border-taupe-soft/60 last:border-0 align-top">
                  {editingId === c.id ? (
                    <>
                      <td className="px-5 py-3">
                        <input className={inputClass} value={editName} onChange={(e) => setEditName(e.target.value)} />
                      </td>
                      <td className="px-5 py-3">
                        <input className={inputClass} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
                      </td>
                      <td className="px-5 py-3 text-coffee">{c.recipe_count}</td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-3 text-xs">
                          <button onClick={() => saveEdit(c.id)} disabled={busyId === c.id} className="font-medium text-gold-deep hover:underline">
                            Save
                          </button>
                          <button onClick={() => setEditingId(null)} className="font-medium text-coffee hover:underline">
                            Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-5 py-3 font-medium text-espresso">{c.name}</td>
                      <td className="px-5 py-3 text-coffee">{c.description || "None"}</td>
                      <td className="px-5 py-3 text-coffee">{c.recipe_count}</td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-3 text-xs">
                          <button onClick={() => startEdit(c)} className="font-medium text-coffee hover:underline">
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(c)}
                            disabled={busyId === c.id}
                            className="font-medium text-danger hover:underline disabled:opacity-60"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
