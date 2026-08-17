import { NextRequest, NextResponse } from "next/server";
import { createRecipe, listRecipes } from "@/lib/data/recipes";
import { recipeSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("q") || undefined;

  const { rows, total } = await listRecipes({
    status: status === "draft" || status === "published" ? status : undefined,
    search,
  });
  return NextResponse.json({ recipes: rows, total });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = recipeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const recipe = await createRecipe(parsed.data);
    return NextResponse.json({ recipe }, { status: 201 });
  } catch (err) {
    console.error("Failed to create recipe", err);
    return NextResponse.json({ error: "Could not save recipe" }, { status: 500 });
  }
}
