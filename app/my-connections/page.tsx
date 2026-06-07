import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function MyConnectionsPage() {
  const session = await requireAuth();
  if (!session?.userId) redirect("/login");

  const profiles = await prisma.profile.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { scans: true } },
    },
  });

  // Confirm-to-connect: confirmed = network, pending = awaiting the owner's decision.
  const statusGroups = await prisma.connection.groupBy({
    by: ["profileId", "status"],
    where: { profile: { userId: session.userId } },
    _count: { _all: true },
  });
  const counts = new Map<string, { confirmed: number; pending: number }>();
  for (const g of statusGroups) {
    const entry = counts.get(g.profileId) ?? { confirmed: 0, pending: 0 };
    if (g.status === "confirmed") entry.confirmed = g._count._all;
    else if (g.status === "pending") entry.pending = g._count._all;
    counts.set(g.profileId, entry);
  }
  const countsFor = (profileId: string) =>
    counts.get(profileId) ?? { confirmed: 0, pending: 0 };

  return (
    <main className="min-h-screen bg-background text-foreground px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">My Connections</h1>
          <p className="text-sm text-muted mt-1">Per-card connection and scan totals.</p>
        </div>

        {profiles.length === 0 ? (
          <p className="text-muted">No profiles yet. Create your first one to start collecting connections.</p>
        ) : (
          <div className="grid gap-3">
            {profiles.map((p) => (
              <div key={p.id} className="bg-surface ring-1 ring-line shadow-sm rounded-xl p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-xs text-muted mt-1">
                    {countsFor(p.id).confirmed} connection{countsFor(p.id).confirmed !== 1 ? "s" : ""} • {p._count.scans} scan{p._count.scans !== 1 ? "s" : ""}
                    {countsFor(p.id).pending > 0 && (
                      <span className="font-medium text-amber-600"> • {countsFor(p.id).pending} pending</span>
                    )}
                  </p>
                </div>
                <Link
                  href={`/profiles/${p.id}/connections`}
                  className="text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 px-3 py-2 rounded-lg transition-colors"
                >
                  View details
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
