import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = await requireAuth();
  if (!session?.userId) redirect("/login");

  const [recentConnections, recentScans] = await Promise.all([
    prisma.connection.findMany({
      where: { profile: { userId: session.userId } },
      include: { profile: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.scan.findMany({
      where: { profile: { userId: session.userId } },
      include: { profile: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const events = [
    ...recentConnections.map((c) => ({
      id: `connection-${c.id}`,
      // Confirm-to-connect: a pending submission is a request until the owner acts.
      type: c.status === "confirmed" ? "New connection" : "New connection request",
      profileId: c.profile.id,
      profileName: c.profile.name,
      createdAt: c.createdAt,
    })),
    ...recentScans.map((s) => ({
      id: `scan-${s.id}`,
      type: "Profile scanned",
      profileId: s.profile.id,
      profileName: s.profile.name,
      createdAt: s.createdAt,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <main className="min-h-screen bg-[#f6fbf8] text-slate-900 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Activity</h1>
            <p className="text-sm text-slate-500 mt-1">Recent connections and scans across your cards.</p>
          </div>
          <Link href="/scan-log" className="text-sm font-medium text-emerald-700 hover:text-emerald-600 shrink-0">
            Full scan log →
          </Link>
        </div>

        {events.length === 0 ? (
          <p className="text-slate-500">No activity yet.</p>
        ) : (
          <div className="space-y-2">
            {events.map((event) => (
              <div key={event.id} className="bg-white ring-1 ring-emerald-900/5 shadow-sm rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{event.type}</p>
                  <p className="text-xs text-slate-500 mt-1">{event.profileName}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-slate-400">{new Date(event.createdAt).toLocaleString()}</p>
                  <Link href={`/profiles/${event.profileId}/connections`} className="text-xs font-medium text-emerald-700 hover:text-emerald-600">
                    Open
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
