import { notFound } from "next/navigation";
import { listCategories } from "@/lib/data/categories";
import { getRecipeById } from "@/lib/data/recipes";
import RecipeEditorForm from "@/components/admin/RecipeEditorForm";

export const metadata = { title: "Edit recipe" };

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recipeId = Number(id);
  if (!Number.isFinite(recipeId)) notFound();

  const [recipe, categories] = await Promise.all([
    getRecipeById(recipeId),
    listCategories(),
  ]);
  if (!recipe) notFound();

  return (
    <div>
      <p className="label-eyebrow">Recipes</p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-espresso">Edit recipe</h1>
      <div className="mt-8">
        <RecipeEditorForm categories={categories} recipe={recipe} />
      </div>
    </div>
  );
}
