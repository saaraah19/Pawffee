import Link from "next/link";
import PawIcon from "@/components/PawIcon";
import LogoutButton from "@/components/admin/LogoutButton";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/recipes", label: "Recipes" },
  { href: "/admin/categories", label: "Categories" },
];

export const metadata = { title: "Pawffee Admin", robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream text-espresso">
      <div className="mx-auto flex max-w-7xl">
        <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-taupe-soft px-5 py-8 sm:flex">
          <Link href="/admin" className="mb-10 inline-flex items-center gap-1.5">
            <PawIcon size={14} className="text-gold" />
            <span className="font-display text-lg font-semibold">Pawffee</span>
            <span className="label-eyebrow ml-1 rounded-full bg-taupe-soft px-2 py-0.5 text-[0.6rem]">
              admin
            </span>
          </Link>
          <nav className="flex flex-col gap-1 text-sm">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-coffee hover:bg-taupe-soft/60 hover:text-espresso"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto flex flex-col gap-2">
            <Link href="/" className="rounded-lg px-3 py-2 text-sm text-taupe hover:text-espresso">
              ← Back to site
            </Link>
            <LogoutButton />
          </div>
        </aside>
        <main className="flex-1 px-5 py-8 sm:px-10">{children}</main>
      </div>
    </div>
  );
}
