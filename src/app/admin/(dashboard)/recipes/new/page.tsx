import { listCategories } from "@/lib/data/categories";
import RecipeEditorForm from "@/components/admin/RecipeEditorForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "New recipe" };

export default async function NewRecipePage() {
  const categories = await listCategories();

  return (
    <div>
      <p className="label-eyebrow">Recipes</p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-espresso">New recipe</h1>
      <div className="mt-8">
        <RecipeEditorForm categories={categories} />
      </div>
    </div>
  );
}
