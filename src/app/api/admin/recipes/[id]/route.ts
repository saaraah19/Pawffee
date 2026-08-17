import { NextRequest, NextResponse } from "next/server";
import {
  deleteRecipe,
  getRecipeById,
  setRecipeStatus,
  updateRecipe,
} from "@/lib/data/recipes";
import { recipeSchema } from "@/lib/validation";
import { deleteUploadedImage } from "@/lib/storage";

function parseId(idParam: string) {
  const id = Number(idParam);
  return Number.isFinite(id) ? id : null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (!id) return NextResponse.json({ error: "Invalid recipe id" }, { status: 400 });

  const recipe = await getRecipeById(id);
  if (!recipe) return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  return NextResponse.json({ recipe });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (!id) return NextResponse.json({ error: "Invalid recipe id" }, { status: 400 });

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

  const existing = await getRecipeById(id);
  if (!existing) return NextResponse.json({ error: "Recipe not found" }, { status: 404 });

  try {
    const recipe = await updateRecipe(id, parsed.data);
    return NextResponse.json({ recipe });
  } catch (err) {
    console.error("Failed to update recipe", err);
    return NextResponse.json({ error: "Could not save recipe" }, { status: 500 });
  }
}

// Lightweight status toggle (publish / unpublish) from the recipes list.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (!id) return NextResponse.json({ error: "Invalid recipe id" }, { status: 400 });

  let body: { status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.status !== "draft" && body.status !== "published") {
    return NextResponse.json({ error: "status must be 'draft' or 'published'" }, { status: 400 });
  }

  const existing = await getRecipeById(id);
  if (!existing) return NextResponse.json({ error: "Recipe not found" }, { status: 404 });

  await setRecipeStatus(id, body.status);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (!id) return NextResponse.json({ error: "Invalid recipe id" }, { status: 400 });

  const existing = await getRecipeById(id);
  if (!existing) return NextResponse.json({ error: "Recipe not found" }, { status: 404 });

  try {
    await deleteRecipe(id);
    // Best-effort cleanup of the cover image; step images are left as-is
    // since they may reference shared/external URLs.
    if (existing.cover_image && existing.cover_image.startsWith("/uploads/")) {
      await deleteUploadedImage(existing.cover_image.replace("/uploads/", ""));
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to delete recipe", err);
    return NextResponse.json({ error: "Could not delete recipe" }, { status: 500 });
  }
}
