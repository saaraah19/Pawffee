"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Category } from "@/lib/data/categories";
import type { FullRecipe } from "@/lib/data/recipes";

type IngredientDraft = {
  key: string;
  group: string;
  name: string;
  quantity: string;
  unit: string;
  notes: string;
};

type StepDraft = {
  key: string;
  text: string;
  image: string;
};

let keySeed = 0;
function newKey() {
  keySeed += 1;
  return `k${Date.now()}${keySeed}`;
}

function emptyIngredient(): IngredientDraft {
  return { key: newKey(), group: "", name: "", quantity: "", unit: "", notes: "" };
}
function emptyStep(): StepDraft {
  return { key: newKey(), text: "", image: "" };
}

const UNITS = ["g", "kg", "ml", "l", "tsp", "tbsp", "cup", "fl_oz", "oz", "lb", "pinch", ""];
const DIFFICULTIES = ["easy", "medium", "hard"] as const;

export default function RecipeEditorForm({
  categories,
  recipe,
}: {
  categories: Category[];
  recipe?: FullRecipe;
}) {
  const router = useRouter();
  const isEdit = Boolean(recipe);

  const [title, setTitle] = useState(recipe?.title ?? "");
  const [description, setDescription] = useState(recipe?.description ?? "");
  const [coverImage, setCoverImage] = useState(recipe?.cover_image ?? "");
  const [categoryId, setCategoryId] = useState<string>(
    recipe?.category_id ? String(recipe.category_id) : ""
  );
  const [tags, setTags] = useState((recipe?.tagList ?? []).join(", "));

  const [prepTime, setPrepTime] = useState(recipe?.prep_time?.toString() ?? "");
  const [restTime, setRestTime] = useState(recipe?.rest_time?.toString() ?? "");
  const [cookTime, setCookTime] = useState(recipe?.cook_time?.toString() ?? "");
  const [servings, setServings] = useState(recipe?.servings?.toString() ?? "");
  const [difficulty, setDifficulty] = useState(recipe?.difficulty ?? "");
  const [costDzd, setCostDzd] = useState(recipe?.cost_dzd?.toString() ?? "");

  const [beforeYouStart, setBeforeYouStart] = useState(recipe?.before_you_start ?? "");
  const [myTips, setMyTips] = useState(recipe?.my_tips ?? "");
  const [mySecret, setMySecret] = useState(recipe?.my_secret ?? "");
  const [cookingNotes, setCookingNotes] = useState(recipe?.cooking_notes ?? "");
  const [myVerdict, setMyVerdict] = useState(recipe?.my_verdict ?? "");

  const [ingredients, setIngredients] = useState<IngredientDraft[]>(
    recipe && recipe.ingredients.length
      ? recipe.ingredients.map((i) => ({
          key: newKey(),
          group: i.group_name ?? "",
          name: i.name,
          quantity: i.quantity ?? "",
          unit: i.unit ?? "",
          notes: i.notes ?? "",
        }))
      : [emptyIngredient()]
  );
  const [steps, setSteps] = useState<StepDraft[]>(
    recipe && recipe.steps.length
      ? recipe.steps.map((s) => ({ key: newKey(), text: s.text, image: s.image ?? "" }))
      : [emptyStep()]
  );

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function updateIngredient(key: string, patch: Partial<IngredientDraft>) {
    setIngredients((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  }
  function updateStep(key: string, patch: Partial<StepDraft>) {
    setSteps((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  }

  async function handleCoverUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setCoverImage(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload image");
    } finally {
      setUploading(false);
    }
  }

  function buildPayload(status: "draft" | "published") {
    return {
      title: title.trim(),
      description: description.trim() || null,
      cover_image: coverImage || null,
      category_id: categoryId ? Number(categoryId) : null,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      status,
      featured: recipe?.featured ?? false,
      prep_time: prepTime ? Number(prepTime) : null,
      rest_time: restTime ? Number(restTime) : null,
      cook_time: cookTime ? Number(cookTime) : null,
      servings: servings ? Number(servings) : null,
      difficulty: difficulty || null,
      cost_dzd: costDzd ? Number(costDzd) : null,
      before_you_start: beforeYouStart.trim() || null,
      my_tips: myTips.trim() || null,
      my_secret: mySecret.trim() || null,
      cooking_notes: cookingNotes.trim() || null,
      my_verdict: myVerdict.trim() || null,
      ingredients: ingredients
        .filter((i) => i.name.trim())
        .map((i) => ({
          group: i.group.trim() || null,
          name: i.name.trim(),
          quantity: i.quantity.trim() || null,
          unit: i.unit.trim() || null,
          notes: i.notes.trim() || null,
        })),
      steps: steps
        .filter((s) => s.text.trim())
        .map((s) => ({ text: s.text.trim(), image: s.image.trim() || null })),
    };
  }

  async function handleSave(status: "draft" | "published") {
    setSaving(true);
    setError(null);
    setFieldErrors({});

    const payload = buildPayload(status);
    if (!payload.title) {
      setError("Title is required.");
      setSaving(false);
      return;
    }
    if (payload.ingredients.length === 0) {
      setError("Add at least one ingredient.");
      setSaving(false);
      return;
    }
    if (payload.steps.length === 0) {
      setError("Add at least one instruction step.");
      setSaving(false);
      return;
    }

    try {
      const url = isEdit ? `/api/admin/recipes/${recipe!.id}` : "/api/admin/recipes";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save the recipe.");
        if (data.details?.fieldErrors) setFieldErrors(data.details.fieldErrors);
        setSaving(false);
        return;
      }
      router.push("/admin/recipes");
      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!recipe) return;
    if (!confirm(`Delete "${recipe.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/recipes/${recipe.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      router.push("/admin/recipes");
      router.refresh();
    } catch {
      setError("Could not delete the recipe.");
      setDeleting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-taupe-soft bg-cream px-3.5 py-2.5 text-sm text-espresso focus:border-gold";
  const labelClass = "mb-1.5 block text-sm font-medium text-espresso";

  return (
    <div className="max-w-4xl">
      {error && (
        <p role="alert" className="mb-6 rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      {/* Basic information */}
      <Section title="Basic information">
        <div>
          <label htmlFor="title" className={labelClass}>Title</label>
          <input id="title" className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} required />
          {fieldErrors.title && <FieldError messages={fieldErrors.title} />}
        </div>
        <div>
          <label htmlFor="description" className={labelClass}>Short description</label>
          <textarea id="description" className={inputClass} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div>
          <span className={labelClass}>Cover image</span>
          <div className="flex items-center gap-4">
            {coverImage ? (
              <div className="relative h-24 w-32 overflow-hidden rounded-lg bg-taupe-soft">
                <Image src={coverImage} alt="" fill className="object-cover" />
              </div>
            ) : (
              <div className="flex h-24 w-32 items-center justify-center rounded-lg border border-dashed border-taupe-soft text-xs text-taupe">
                No image
              </div>
            )}
            <label className="cursor-pointer rounded-full border border-espresso/20 px-4 py-2 text-sm text-espresso hover:border-gold">
              {uploading ? "Uploading…" : coverImage ? "Replace" : "Upload image"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleCoverUpload(file);
                }}
              />
            </label>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="category" className={labelClass}>Category</label>
            <select id="category" className={inputClass} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tags" className={labelClass}>Tags (comma-separated)</label>
            <input id="tags" className={inputClass} value={tags} onChange={(e) => setTags(e.target.value)} placeholder="weekend baking, chocolate" />
          </div>
        </div>
      </Section>

      {/* Recipe information */}
      <Section title="Recipe information">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <NumberField label="Prep (min)" value={prepTime} onChange={setPrepTime} />
          <NumberField label="Rest (min)" value={restTime} onChange={setRestTime} />
          <NumberField label="Cook (min)" value={cookTime} onChange={setCookTime} />
          <NumberField label="Servings" value={servings} onChange={setServings} />
          <div>
            <label htmlFor="difficulty" className={labelClass}>Difficulty</label>
            <select id="difficulty" className={inputClass} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="">—</option>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>{d[0].toUpperCase() + d.slice(1)}</option>
              ))}
            </select>
          </div>
          <NumberField label="Cost (DZD)" value={costDzd} onChange={setCostDzd} />
        </div>
      </Section>

      {/* Ingredients */}
      <Section title="Ingredients">
        <div className="space-y-3">
          {ingredients.map((ing) => (
            <div key={ing.key} className="grid grid-cols-12 gap-2 rounded-lg border border-taupe-soft/70 p-3">
              <input
                placeholder="Group (optional, e.g. Dough)"
                className={`col-span-12 ${inputClass}`}
                value={ing.group}
                onChange={(e) => updateIngredient(ing.key, { group: e.target.value })}
              />
              <input
                placeholder="Ingredient name"
                className={`col-span-12 sm:col-span-5 ${inputClass}`}
                value={ing.name}
                onChange={(e) => updateIngredient(ing.key, { name: e.target.value })}
              />
              <input
                placeholder="Qty"
                className={`col-span-4 sm:col-span-2 ${inputClass}`}
                value={ing.quantity}
                onChange={(e) => updateIngredient(ing.key, { quantity: e.target.value })}
              />
              <select
                className={`col-span-4 sm:col-span-2 ${inputClass}`}
                value={ing.unit}
                onChange={(e) => updateIngredient(ing.key, { unit: e.target.value })}
              >
                {UNITS.map((u) => (
                  <option key={u || "none"} value={u}>{u || "—"}</option>
                ))}
              </select>
              <input
                placeholder="Notes (optional)"
                className={`col-span-3 sm:col-span-2 ${inputClass}`}
                value={ing.notes}
                onChange={(e) => updateIngredient(ing.key, { notes: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setIngredients((prev) => prev.filter((i) => i.key !== ing.key))}
                className="col-span-1 rounded-lg text-taupe hover:text-danger"
                aria-label="Remove ingredient"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setIngredients((prev) => [...prev, emptyIngredient()])}
          className="mt-3 rounded-full border border-espresso/20 px-4 py-2 text-sm text-espresso hover:border-gold"
        >
          + Add ingredient
        </button>
      </Section>

      {/* Instructions */}
      <Section title="Instructions">
        <div className="space-y-3">
          {steps.map((step, idx) => (
            <div key={step.key} className="flex gap-3 rounded-lg border border-taupe-soft/70 p-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-espresso text-xs text-cream">
                {idx + 1}
              </span>
              <textarea
                placeholder="Describe this step…"
                className={`${inputClass} flex-1`}
                rows={2}
                value={step.text}
                onChange={(e) => updateStep(step.key, { text: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setSteps((prev) => prev.filter((s) => s.key !== step.key))}
                className="shrink-0 rounded-lg px-2 text-taupe hover:text-danger"
                aria-label="Remove step"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setSteps((prev) => [...prev, emptyStep()])}
          className="mt-3 rounded-full border border-espresso/20 px-4 py-2 text-sm text-espresso hover:border-gold"
        >
          + Add step
        </button>
      </Section>

      {/* Personal notes */}
      <Section title="Personal notes" subtitle="Optional — leave blank to hide a section on the public page.">
        <TextAreaField label="Before you start" value={beforeYouStart} onChange={setBeforeYouStart} />
        <TextAreaField label="My tips" value={myTips} onChange={setMyTips} />
        <TextAreaField label="My little secret" value={mySecret} onChange={setMySecret} />
        <TextAreaField label="Cooking notes" value={cookingNotes} onChange={setCookingNotes} />
        <TextAreaField label="My verdict" value={myVerdict} onChange={setMyVerdict} />
      </Section>

      {/* Publishing */}
      <div className="sticky bottom-0 mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-taupe-soft bg-paper p-5">
        <div>
          {recipe && (
            <span className="text-xs text-taupe">
              Currently {recipe.status === "published" ? "published" : "a draft"}.
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-full border border-danger/30 px-5 py-2.5 text-sm font-medium text-danger hover:bg-danger/10 disabled:opacity-60"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          )}
          <button
            type="button"
            onClick={() => handleSave("draft")}
            disabled={saving}
            className="rounded-full border border-espresso/20 px-5 py-2.5 text-sm font-medium text-espresso hover:border-gold disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save as draft"}
          </button>
          <button
            type="button"
            onClick={() => handleSave("published")}
            disabled={saving}
            className="rounded-full bg-espresso px-5 py-2.5 text-sm font-medium text-cream hover:bg-gold-deep disabled:opacity-60"
          >
            {saving ? "Publishing…" : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8 rounded-2xl border border-taupe-soft bg-paper p-6">
      <h2 className="font-display text-lg font-semibold text-espresso">{title}</h2>
      {subtitle && <p className="mt-1 text-xs text-taupe">{subtitle}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-espresso">{label}</label>
      <input
        type="number"
        min={0}
        inputMode="numeric"
        className="w-full rounded-lg border border-taupe-soft bg-cream px-3.5 py-2.5 text-sm text-espresso focus:border-gold"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-espresso">{label}</label>
      <textarea
        rows={3}
        className="w-full rounded-lg border border-taupe-soft bg-cream px-3.5 py-2.5 text-sm text-espresso focus:border-gold"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function FieldError({ messages }: { messages: string[] }) {
  return <p className="mt-1 text-xs text-danger">{messages.join(", ")}</p>;
}
