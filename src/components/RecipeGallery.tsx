import Image from "next/image";
import type { GalleryImageRow } from "@/lib/data/recipes";

export default function RecipeGallery({ images }: { images: GalleryImageRow[] }) {
  if (images.length === 0) return null;

  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
      {images.map((img) => (
        <div
          key={img.id}
          className="relative aspect-square overflow-hidden rounded-xl bg-taupe-soft"
        >
          <Image
            src={img.url}
            alt={img.caption || ""}
            fill
            sizes="(min-width: 768px) 220px, 45vw"
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}
