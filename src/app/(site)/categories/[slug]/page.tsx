import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryBySlug } from "@/lib/data/categories";
import { listRecipes } from "@/lib/data/recipes";
import RecipeCard from "@/components/RecipeCard";
import EmptyState from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  return {
    title: category.name,
    description: category.description || `Pawffee recipes in ${category.name}.`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const { rows, total } = await listRecipes({ status: "published", categorySlug: slug });

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
      <p className="label-eyebrow">Category</p>
      <h1 className="mt-2 font-display text-4xl font-semibold text-espresso">{category.name}</h1>
      {category.description && (
        <p className="mt-3 max-w-xl text-coffee">{category.description}</p>
      )}
      <p className="mt-4 text-sm text-taupe">
        {total} {total === 1 ? "recipe" : "recipes"}
      </p>

      <div className="mt-8">
        {rows.length === 0 ? (
          <EmptyState
            title="No recipes in this category yet."
            message="Check back soon, or browse the full library in the meantime."
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((r) => (
              <RecipeCard key={r.id} recipe={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
