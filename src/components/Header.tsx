import Link from "next/link";
import Logo from "./Logo";

const NAV = [
  { href: "/recipes", label: "Recipes" },
  { href: "/categories", label: "Categories" },
  { href: "/about", label: "About" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-taupe-soft bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <Logo />
        <nav className="hidden items-center gap-8 sm:flex" aria-label="Primary">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-coffee transition-colors hover:text-espresso"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <Link
            href="/recipes"
            className="hidden rounded-full border border-espresso/15 px-4 py-2 text-sm font-medium text-espresso transition-colors hover:border-gold hover:text-gold-deep sm:inline-block"
          >
            Search recipes
          </Link>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}

function MobileNav() {
  return (
    <details className="relative sm:hidden">
      <summary
        className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full border border-espresso/15 text-espresso [&::-webkit-details-marker]:hidden"
        aria-label="Open menu"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M1 3h14M1 8h14M1 13h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </summary>
      <div className="absolute right-0 top-11 w-44 rounded-xl border border-taupe-soft bg-paper p-2 shadow-lg">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-lg px-3 py-2 text-sm text-espresso hover:bg-taupe-soft/60"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </details>
  );
}
