import Link from "next/link";
import { dashboardCounts, listRecipes } from "@/lib/data/recipes";
import { formatDate } from "@/lib/utils";
import StatusPill from "@/components/admin/StatusPill";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const [counts, recent] = await Promise.all([
    dashboardCounts(),
    listRecipes({ limit: 6 }),
  ]);

  const stats = [
    { label: "Total recipes", value: counts.total },
    { label: "Published", value: counts.published },
    { label: "Drafts", value: counts.drafts },
    { label: "Categories", value: counts.categories },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="label-eyebrow">Overview</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-espresso">Dashboard</h1>
        </div>
        <Link
          href="/admin/recipes/new"
          className="rounded-full bg-espresso px-5 py-2.5 text-sm font-medium text-cream hover:bg-gold-deep"
        >
          + New recipe
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-taupe-soft bg-paper p-5">
            <p className="font-display text-3xl font-semibold text-espresso">{s.value}</p>
            <p className="mt-1 text-xs text-taupe">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-espresso">Recent recipes</h2>
          <Link href="/admin/recipes" className="text-sm font-medium text-gold-deep hover:underline">
            View all →
          </Link>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-taupe-soft bg-paper">
          {recent.rows.length === 0 ? (
            <p className="p-6 text-sm text-coffee">No recipes yet — create your first one.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-taupe-soft text-xs text-taupe">
                  <th className="px-5 py-3 font-medium">Title</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {recent.rows.map((r) => (
                  <tr key={r.id} className="border-b border-taupe-soft/60 last:border-0">
                    <td className="px-5 py-3">
                      <Link href={`/admin/recipes/${r.id}/edit`} className="font-medium text-espresso hover:text-gold-deep">
                        {r.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill status={r.status} />
                    </td>
                    <td className="px-5 py-3 text-taupe">{formatDate(r.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
