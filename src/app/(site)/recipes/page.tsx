import type { Metadata } from "next";
import Link from "next/link";
import { listRecipes } from "@/lib/data/recipes";
import { listCategories } from "@/lib/data/categories";
import RecipeCard from "@/components/RecipeCard";
import RecipeFilters from "@/components/RecipeFilters";
import EmptyState from "@/components/EmptyState";

export const metadata: Metadata = {
  title: "Recipes",
  description: "Browse the full Pawffee recipe library. Search or filter by category.",
};

const PER_PAGE = 12;

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const categories = await listCategories();

  const { rows, total } = await listRecipes({
    status: "published",
    search: params.q?.trim() || undefined,
    categorySlug: params.category || undefined,
    limit: PER_PAGE,
    offset: (page - 1) * PER_PAGE,
  });

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
      <p className="label-eyebrow">The library</p>
      <h1 className="mt-2 font-display text-4xl font-semibold text-espresso">All recipes</h1>
      <p className="mt-3 max-w-xl text-coffee">
        Every published recipe, in one place. Search by name or ingredient, or
        narrow things down by category.
      </p>

      <div className="mt-8">
        <RecipeFilters categories={categories} search={params.q} category={params.category} />
      </div>

      <div className="mt-10">
        {rows.length === 0 ? (
          <EmptyState
            title="No recipes found."
            message="Try another ingredient, recipe name, or category."
          />
        ) : (
          <>
            <p className="mb-6 text-sm text-taupe">
              {total} {total === 1 ? "recipe" : "recipes"}
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((r) => (
                <RecipeCard key={r.id} recipe={r} />
              ))}
            </div>
          </>
        )}
      </div>

      {totalPages > 1 && (
        <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Pagination">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const qs = new URLSearchParams();
            if (params.q) qs.set("q", params.q);
            if (params.category) qs.set("category", params.category);
            qs.set("page", String(p));
            return (
              <Link
                key={p}
                href={`/recipes?${qs.toString()}`}
                aria-current={p === page ? "page" : undefined}
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm ${
                  p === page
                    ? "bg-espresso text-cream"
                    : "border border-taupe-soft text-coffee hover:border-gold"
                }`}
              >
                {p}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
