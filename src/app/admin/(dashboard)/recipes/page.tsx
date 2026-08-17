import Link from "next/link";
import { listRecipes } from "@/lib/data/recipes";
import AdminRecipesTable from "@/components/admin/AdminRecipesTable";

export const dynamic = "force-dynamic";
export const metadata = { title: "Recipes" };

export default async function AdminRecipesPage() {
  const { rows } = await listRecipes();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="label-eyebrow">Manage</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-espresso">Recipes</h1>
        </div>
        <Link
          href="/admin/recipes/new"
          className="rounded-full bg-espresso px-5 py-2.5 text-sm font-medium text-cream hover:bg-gold-deep"
        >
          + New recipe
        </Link>
      </div>

      <div className="mt-8">
        <AdminRecipesTable recipes={rows} />
      </div>
    </div>
  );
}
