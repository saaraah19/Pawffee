import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getPublishedRecipeBySlug } from "@/lib/data/recipes";
import { RecipePdfDocument } from "@/lib/pdf";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const recipe = await getPublishedRecipeBySlug(slug);

  if (!recipe) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }

  try {
    const buffer = await renderToBuffer(RecipePdfDocument({ recipe }));
    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${recipe.slug}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("PDF generation failed", err);
    return NextResponse.json({ error: "Could not generate PDF" }, { status: 500 });
  }
}
