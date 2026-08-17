import { listCategoriesWithCounts } from "@/lib/data/categories";
import CategoryManager from "@/components/admin/CategoryManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  const categories = await listCategoriesWithCounts();

  return (
    <div>
      <p className="label-eyebrow">Manage</p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-espresso">Categories</h1>
      <div className="mt-8">
        <CategoryManager categories={categories} />
      </div>
    </div>
  );
}
