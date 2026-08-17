import type { Metadata } from "next";
import Link from "next/link";
import { listCategoriesWithCounts } from "@/lib/data/categories";
import EmptyState from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse Pawffee recipes by category.",
};

export default async function CategoriesPage() {
  const categories = await listCategoriesWithCounts();

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
      <p className="label-eyebrow">Browse by mood</p>
      <h1 className="mt-2 font-display text-4xl font-semibold text-espresso">Categories</h1>
      <p className="mt-3 max-w-xl text-coffee">
        From weekend bakes to quick weeknight cooking — find recipes by the
        kind of thing you&apos;re after.
      </p>

      {categories.length === 0 ? (
        <div className="mt-10">
          <EmptyState title="No categories yet." />
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/categories/${c.slug}`}
              className="group flex flex-col gap-2 rounded-2xl border border-taupe-soft bg-paper px-5 py-8 text-center transition-colors hover:border-gold"
            >
              <span className="font-display text-xl text-espresso group-hover:text-gold-deep">
                {c.name}
              </span>
              <span className="text-xs text-taupe">
                {c.recipe_count} {c.recipe_count === 1 ? "recipe" : "recipes"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
