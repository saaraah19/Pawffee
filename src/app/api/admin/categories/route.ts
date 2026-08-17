import { NextRequest, NextResponse } from "next/server";
import { createCategory, listCategoriesWithCounts } from "@/lib/data/categories";

export async function GET() {
  const categories = await listCategoriesWithCounts();
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  let body: { name?: string; description?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.name || body.name.trim().length < 2) {
    return NextResponse.json({ error: "Category name is required" }, { status: 400 });
  }

  try {
    const category = await createCategory(body.name.trim(), body.description?.trim());
    return NextResponse.json({ category }, { status: 201 });
  } catch (err) {
    console.error("Failed to create category", err);
    return NextResponse.json({ error: "Could not create category" }, { status: 500 });
  }
}
