import Link from "next/link";
import Image from "next/image";
import { listRecipes } from "@/lib/data/recipes";
import { listCategoriesWithCounts } from "@/lib/data/categories";
import RecipeCard from "@/components/RecipeCard";
import PawIcon from "@/components/PawIcon";
import EmptyState from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [{ rows: featured }, { rows: latest }, allCategories] = await Promise.all([
    listRecipes({ status: "published", featured: true, limit: 3 }),
    listRecipes({ status: "published", limit: 6 }),
    listCategoriesWithCounts(),
  ]);
  const categories = allCategories.filter((c) => c.recipe_count > 0).slice(0, 6);

  const heroRecipe = featured[0] ?? latest[0];

  return (
    <>
      {/* Hero */}
      <section className="border-b border-taupe-soft">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-2 lg:items-center lg:py-20">
          <div>
            <p className="label-eyebrow mb-5 inline-flex items-center gap-2">
              <PawIcon size={12} className="text-paw" />
              A personal kitchen notebook
            </p>
            <h1 className="font-display text-4xl font-semibold leading-[1.08] text-espresso sm:text-5xl lg:text-[3.4rem]">
              Recipes that worked, saved with love and shared with you.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-coffee">
              Cooking is a hobby I cherish, and Pawffee is where I keep the
              recipes that turned out right: saved with the little notes that
              made them work, and shared so you can make them too.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/recipes"
                className="rounded-full bg-espresso px-6 py-3 text-sm font-medium text-cream transition-colors hover:bg-gold-deep"
              >
                Browse the recipes
              </Link>
              <Link
                href="/categories"
                className="rounded-full border border-espresso/20 px-6 py-3 text-sm font-medium text-espresso transition-colors hover:border-gold hover:text-gold-deep"
              >
                Explore categories
              </Link>
            </div>
          </div>

          <div className="relative">
            {heroRecipe ? (
              <Link
                href={`/recipes/${heroRecipe.slug}`}
                className="group relative block aspect-[5/4] overflow-hidden rounded-[2rem] bg-taupe-soft shadow-[0_30px_60px_-25px_rgba(44,31,23,0.4)]"
              >
                {heroRecipe.cover_image ? (
                  <Image
                    src={heroRecipe.cover_image}
                    alt=""
                    fill
                    priority
                    sizes="(min-width: 1024px) 520px, 90vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-taupe">
                    <PawIcon size={40} />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-espresso/70 via-espresso/10 to-transparent p-6">
                  <p className="label-eyebrow text-cream/80">
                    {heroRecipe.category_name ?? "Featured"}
                  </p>
                  <p className="font-display text-2xl font-semibold text-cream">
                    {heroRecipe.title}
                  </p>
                </div>
              </Link>
            ) : (
              <div className="flex aspect-[5/4] items-center justify-center rounded-[2rem] border border-dashed border-taupe-soft text-taupe">
                <PawIcon size={32} />
              </div>
            )}
            <div
              aria-hidden="true"
              className="absolute -bottom-5 -left-5 hidden h-24 w-24 rotate-[-10deg] items-center justify-center rounded-full bg-paper text-gold shadow-lg sm:flex"
            >
              <PawIcon size={30} />
            </div>
          </div>
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <SectionHeading eyebrow="Curated" title="Featured recipes" />
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((r) => (
              <RecipeCard key={r.id} recipe={r} />
            ))}
          </div>
        </section>
      )}

      {/* Latest */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="flex items-end justify-between">
          <SectionHeading eyebrow="Fresh from the kitchen" title="Latest recipes" />
          <Link href="/recipes" className="hidden text-sm font-medium text-gold-deep hover:underline sm:block">
            View all →
          </Link>
        </div>
        <div className="mt-8">
          {latest.length === 0 ? (
            <EmptyState
              title="The kitchen is quiet, for now."
              message="No recipes have been published yet. Check back soon."
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {latest.map((r) => (
                <RecipeCard key={r.id} recipe={r} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <SectionHeading eyebrow="Browse by mood" title="Categories" />
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/categories/${c.slug}`}
                className="group flex flex-col items-center gap-2 rounded-2xl border border-taupe-soft bg-paper px-4 py-7 text-center transition-colors hover:border-gold"
              >
                <span className="font-display text-lg text-espresso group-hover:text-gold-deep">
                  {c.name}
                </span>
                <span className="text-xs text-taupe">
                  {c.recipe_count} {c.recipe_count === 1 ? "recipe" : "recipes"}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Personal note */}
      <section className="border-t border-taupe-soft bg-paper">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-8">
          <PawIcon size={20} className="mx-auto mb-5 text-paw" />
          <p className="font-display text-2xl italic leading-relaxed text-espresso sm:text-3xl">
            &ldquo;Every recipe here has been made in my own kitchen, usually more
            than once, always with a cat somewhere underfoot.&rdquo;
          </p>
          <p className="mt-6 text-sm text-coffee">From the Pawffee kitchen</p>
        </div>
      </section>
    </>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="label-eyebrow">{eyebrow}</p>
      <h2 className="mt-2 font-display text-3xl font-semibold text-espresso">{title}</h2>
    </div>
  );
}
