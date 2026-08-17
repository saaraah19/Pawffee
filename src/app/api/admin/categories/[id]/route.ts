import { NextRequest, NextResponse } from "next/server";
import { deleteCategory, getCategoryById, updateCategory } from "@/lib/data/categories";

function parseId(idParam: string) {
  const id = Number(idParam);
  return Number.isFinite(id) ? id : null;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (!id) return NextResponse.json({ error: "Invalid category id" }, { status: 400 });

  let body: { name?: string; description?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.name || body.name.trim().length < 2) {
    return NextResponse.json({ error: "Category name is required" }, { status: 400 });
  }

  const existing = await getCategoryById(id);
  if (!existing) return NextResponse.json({ error: "Category not found" }, { status: 404 });

  const category = await updateCategory(id, body.name.trim(), body.description?.trim());
  return NextResponse.json({ category });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (!id) return NextResponse.json({ error: "Invalid category id" }, { status: 400 });

  const existing = await getCategoryById(id);
  if (!existing) return NextResponse.json({ error: "Category not found" }, { status: 404 });

  await deleteCategory(id);
  return NextResponse.json({ ok: true });
}
