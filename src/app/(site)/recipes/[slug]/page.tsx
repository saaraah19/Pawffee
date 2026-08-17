import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getPublishedRecipeBySlug, relatedRecipes } from "@/lib/data/recipes";
import RecipeMeta from "@/components/RecipeMeta";
import IngredientList from "@/components/IngredientList";
import NoteSection from "@/components/NoteSection";
import RecipeCard from "@/components/RecipeCard";
import PawIcon from "@/components/PawIcon";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const recipe = await getPublishedRecipeBySlug(slug);
  if (!recipe) return {};
  return {
    title: recipe.title,
    description: recipe.description || `${recipe.title} — a Pawffee recipe.`,
    alternates: { canonical: `/recipes/${recipe.slug}` },
    openGraph: {
      title: recipe.title,
      description: recipe.description || undefined,
      type: "article",
      images: recipe.cover_image ? [{ url: recipe.cover_image }] : undefined,
    },
  };
}

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const recipe = await getPublishedRecipeBySlug(slug);
  if (!recipe) notFound();

  const related = await relatedRecipes(recipe, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.title,
    description: recipe.description || undefined,
    image: recipe.cover_image ? [recipe.cover_image] : undefined,
    recipeCategory: recipe.category_name || undefined,
    recipeYield: recipe.servings ? String(recipe.servings) : undefined,
    prepTime: recipe.prep_time ? `PT${recipe.prep_time}M` : undefined,
    cookTime: recipe.cook_time ? `PT${recipe.cook_time}M` : undefined,
    recipeIngredient: recipe.ingredients.map((i) =>
      [i.quantity, i.unit, i.name].filter(Boolean).join(" ")
    ),
    recipeInstructions: recipe.steps.map((s) => ({
      "@type": "HowToStep",
      text: s.text,
    })),
  };

  return (
    <article className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      { }
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-taupe">
        <Link href="/recipes" className="hover:text-espresso">Recipes</Link>
        {recipe.category_name && (
          <>
            <span aria-hidden="true">/</span>
            <Link href={`/categories/${recipe.category_slug}`} className="hover:text-espresso">
              {recipe.category_name}
            </Link>
          </>
        )}
      </nav>

      <h1 className="font-display text-3xl font-semibold leading-tight text-espresso sm:text-4xl">
        {recipe.title}
      </h1>
      {recipe.description && (
        <p className="mt-4 text-lg leading-relaxed text-coffee">{recipe.description}</p>
      )}

      {recipe.cover_image && (
        <div className="relative mt-8 aspect-[3/2] w-full overflow-hidden rounded-2xl bg-taupe-soft">
          <Image
            src={recipe.cover_image}
            alt={recipe.title}
            fill
            priority
            sizes="(min-width: 768px) 720px, 100vw"
            className="object-cover"
          />
        </div>
      )}

      <div className="mt-8">
        <RecipeMeta recipe={recipe} />
      </div>

      <div className="mt-6 flex justify-center">
        <a
          href={`/recipes/${recipe.slug}/pdf`}
          className="inline-flex items-center gap-2 rounded-full border border-espresso/20 px-6 py-3 text-sm font-medium text-espresso transition-colors hover:border-gold hover:text-gold-deep"
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M8 1v9m0 0L4.5 6.5M8 10l3.5-3.5M2 12v1.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V12"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Download recipe (PDF)
        </a>
      </div>

      <div className="mt-14 grid gap-12 sm:grid-cols-5">
        <div className="sm:col-span-2">
          <h2 className="font-display text-2xl font-semibold text-espresso">Ingredients</h2>
          <div className="mt-5">
            <IngredientList ingredients={recipe.ingredients} />
          </div>
        </div>

        <div className="sm:col-span-3">
          <div className="space-y-4">
            <NoteSection title="Before you start" content={recipe.before_you_start} />
          </div>

          <h2 className="mt-10 font-display text-2xl font-semibold text-espresso">Instructions</h2>
          <ol className="prose-recipe mt-5 space-y-6">
            {recipe.steps.map((step, idx) => (
              <li key={step.id} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-espresso font-display text-sm text-cream">
                  {idx + 1}
                </span>
                <div className="pt-0.5">
                  <p className="leading-relaxed text-espresso">{step.text}</p>
                  {step.image && (
                    <div className="relative mt-3 aspect-video w-full max-w-md overflow-hidden rounded-xl bg-taupe-soft">
                      <Image src={step.image} alt="" fill className="object-cover" />
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-10 space-y-4">
            <NoteSection title="My tips" content={recipe.my_tips} />
            <NoteSection title="My little secret" content={recipe.my_secret} variant="secret" />
            <NoteSection title="Cooking notes" content={recipe.cooking_notes} />
            <NoteSection title="My verdict" content={recipe.my_verdict} variant="verdict" />
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-20 border-t border-taupe-soft pt-12">
          <p className="label-eyebrow inline-flex items-center gap-1.5">
            <PawIcon size={11} className="text-paw" />
            You might also like
          </p>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {related.map((r) => (
              <RecipeCard key={r.id} recipe={r} />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
