import type { RecipeIngredientRow } from "@/lib/data/recipes";

export default function IngredientList({ ingredients }: { ingredients: RecipeIngredientRow[] }) {
  const groups = new Map<string, RecipeIngredientRow[]>();
  for (const ing of ingredients) {
    const key = ing.group_name || "";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(ing);
  }

  return (
    <div className="space-y-6">
      {Array.from(groups.entries()).map(([groupName, items]) => (
        <div key={groupName || "default"}>
          {groupName && (
            <h3 className="mb-3 font-display text-base font-semibold text-espresso">
              {groupName}
            </h3>
          )}
          <ul className="space-y-2.5">
            {items.map((ing) => (
              <li
                key={ing.id}
                className="flex items-baseline justify-between gap-4 border-b border-taupe-soft/70 pb-2.5 text-sm"
              >
                <span className="text-espresso">
                  {ing.name}
                  {ing.notes && <span className="text-taupe"> ({ing.notes})</span>}
                </span>
                {(ing.quantity || ing.unit) && (
                  <span className="shrink-0 font-medium text-coffee">
                    {ing.quantity} {ing.unit}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
