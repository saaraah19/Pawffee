import Link from "next/link";
import Image from "next/image";
import type { RecipeRow } from "@/lib/data/recipes";
import { DIFFICULTY_LABELS, formatCost, formatMinutes, totalTime } from "@/lib/utils";
import PawIcon from "./PawIcon";

export default function RecipeCard({ recipe }: { recipe: RecipeRow }) {
  const total = totalTime(recipe.prep_time, recipe.rest_time, recipe.cook_time);
  return (
    <Link
      href={`/recipes/${recipe.slug}`}
      className="group block overflow-hidden rounded-2xl border border-taupe-soft bg-paper transition-shadow hover:shadow-[0_10px_30px_-15px_rgba(44,31,23,0.35)]"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-taupe-soft">
        {recipe.cover_image ? (
          <Image
            src={recipe.cover_image}
            alt=""
            fill
            sizes="(min-width: 1024px) 380px, (min-width: 640px) 45vw, 90vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-taupe">
            <PawIcon size={28} />
          </div>
        )}
        {recipe.category_name && (
          <span className="absolute left-3 top-3 rounded-full bg-paper/90 px-3 py-1 text-xs font-medium text-coffee shadow-sm">
            {recipe.category_name}
          </span>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-display text-xl font-semibold leading-snug text-espresso group-hover:text-gold-deep">
          {recipe.title}
        </h3>
        {recipe.description && (
          <p className="mt-1.5 line-clamp-2 text-sm text-coffee">{recipe.description}</p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-taupe">
          {total && <span>{formatMinutes(total)}</span>}
          {recipe.difficulty && (
            <span>{DIFFICULTY_LABELS[recipe.difficulty] ?? recipe.difficulty}</span>
          )}
          {recipe.cost_dzd != null && <span>{formatCost(recipe.cost_dzd)}</span>}
        </div>
      </div>
    </Link>
  );
}
