import type { Category } from "@/lib/data/categories";

export default function RecipeFilters({
  categories,
  search,
  category,
  action = "/recipes",
}: {
  categories: Category[];
  search?: string;
  category?: string;
  action?: string;
}) {
  return (
    <form action={action} method="get" className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <label htmlFor="q" className="sr-only">
          Search recipes
        </label>
        <input
          id="q"
          type="search"
          name="q"
          defaultValue={search}
          placeholder="Search by name, ingredient, or category…"
          className="w-full rounded-full border border-taupe-soft bg-paper px-5 py-3 text-sm text-espresso placeholder:text-taupe focus:border-gold"
        />
      </div>
      <div>
        <label htmlFor="category" className="sr-only">
          Category
        </label>
        <select
          id="category"
          name="category"
          defaultValue={category || ""}
          className="w-full rounded-full border border-taupe-soft bg-paper px-5 py-3 text-sm text-espresso focus:border-gold sm:w-52"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="rounded-full bg-espresso px-6 py-3 text-sm font-medium text-cream transition-colors hover:bg-gold-deep"
      >
        Search
      </button>
    </form>
  );
}
