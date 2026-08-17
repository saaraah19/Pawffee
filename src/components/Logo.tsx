import Link from "next/link";
import PawIcon from "./PawIcon";

export default function Logo({ tagline = false }: { tagline?: boolean }) {
  return (
    <Link href="/" className="group inline-flex flex-col leading-none">
      <span className="inline-flex items-center gap-1.5">
        <PawIcon size={15} className="text-gold mb-2 rotate-[-8deg] transition-transform group-hover:rotate-0" />
        <span className="font-display text-2xl font-semibold text-espresso tracking-tight">
          Pawffee
        </span>
      </span>
      {tagline && (
        <span className="label-eyebrow mt-1 ml-0.5">Recipes worth keeping</span>
      )}
    </Link>
  );
}
