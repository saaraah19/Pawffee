import Link from "next/link";
import Logo from "./Logo";
import PawIcon from "./PawIcon";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-taupe-soft bg-paper">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Logo />
            <p className="mt-3 max-w-sm text-sm text-coffee">
              A little corner of the internet for recipes I&apos;ve made, tested, and
              decided were worth keeping — kept company by a cat or two.
            </p>
          </div>
          <div className="flex gap-12 text-sm">
            <div>
              <p className="label-eyebrow mb-3">Explore</p>
              <ul className="space-y-2 text-coffee">
                <li><Link href="/recipes" className="hover:text-espresso">All recipes</Link></li>
                <li><Link href="/categories" className="hover:text-espresso">Categories</Link></li>
                <li><Link href="/about" className="hover:text-espresso">About</Link></li>
              </ul>
            </div>
            <div>
              <p className="label-eyebrow mb-3">Studio</p>
              <ul className="space-y-2 text-coffee">
                <li><Link href="/admin" className="hover:text-espresso">Admin</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="divider mt-10 flex flex-col items-start justify-between gap-2 pt-6 text-xs text-taupe sm:flex-row sm:items-center">
          <p className="inline-flex items-center gap-1.5">
            <PawIcon size={11} className="text-paw" />
            © {new Date().getFullYear()} Pawffee. Made in a small, well-loved kitchen.
          </p>
        </div>
      </div>
    </footer>
  );
}
