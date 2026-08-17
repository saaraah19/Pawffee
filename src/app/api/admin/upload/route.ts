import { NextRequest, NextResponse } from "next/server";
import { saveUploadedImage } from "@/lib/storage";

export const runtime = "nodejs";

const MAX_SIZE = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Unsupported file type. Use JPEG, PNG, WebP, or AVIF." },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Image is too large (max 8MB)." }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { url } = await saveUploadedImage(buffer, file.name, file.type);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("Image upload failed", err);
    return NextResponse.json({ error: "Could not upload image" }, { status: 500 });
  }
}
