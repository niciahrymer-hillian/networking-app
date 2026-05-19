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
      _count: { select: { connections: true, scans: true } },
    },
  });

  return (
    <main className="min-h-screen bg-[#0f0f1a] text-white px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">My Connections</h1>
          <p className="text-sm text-white/50 mt-1">Per-card connection and scan totals.</p>
        </div>

        {profiles.length === 0 ? (
          <p className="text-white/50">No profiles yet. Create your first one to start collecting connections.</p>
        ) : (
          <div className="grid gap-3">
            {profiles.map((p) => (
              <div key={p.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-xs text-white/50 mt-1">
                    {p._count.connections} connection{p._count.connections !== 1 ? "s" : ""} • {p._count.scans} scan{p._count.scans !== 1 ? "s" : ""}
                  </p>
                </div>
                <Link
                  href={`/profiles/${p.id}/connections`}
                  className="text-xs bg-indigo-600 hover:bg-indigo-500 px-3 py-2 rounded-lg transition-colors"
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
