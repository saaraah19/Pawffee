import { DIFFICULTY_LABELS, formatCost, formatMinutes, totalTime } from "@/lib/utils";
import type { FullRecipe } from "@/lib/data/recipes";

function Stat({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-1">
      <span className="label-eyebrow">{label}</span>
      <span className="font-display text-lg text-espresso">{value}</span>
    </div>
  );
}

export default function RecipeMeta({ recipe }: { recipe: FullRecipe }) {
  const total = totalTime(recipe.prep_time, recipe.rest_time, recipe.cook_time);
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-5 rounded-2xl border border-taupe-soft bg-paper px-6 py-6 sm:grid-cols-3 lg:grid-cols-6">
      <Stat label="Prep" value={formatMinutes(recipe.prep_time)} />
      <Stat label="Rest" value={formatMinutes(recipe.rest_time)} />
      <Stat label="Cook" value={formatMinutes(recipe.cook_time)} />
      <Stat label="Total" value={formatMinutes(total)} />
      <Stat label="Servings" value={recipe.servings ? String(recipe.servings) : null} />
      <Stat
        label="Difficulty"
        value={recipe.difficulty ? DIFFICULTY_LABELS[recipe.difficulty] ?? recipe.difficulty : null}
      />
      <Stat label="Cost" value={formatCost(recipe.cost_dzd)} />
    </div>
  );
}
