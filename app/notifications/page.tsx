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
    <main className="min-h-screen bg-[#0f0f1a] text-white px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Notifications</h1>
        <p className="text-sm text-white/50 mb-6">Recent activity for your cards.</p>

        {events.length === 0 ? (
          <p className="text-white/50">No activity yet.</p>
        ) : (
          <div className="space-y-2">
            {events.map((event) => (
              <div key={event.id} className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{event.type}</p>
                  <p className="text-xs text-white/50 mt-1">{event.profileName}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-white/50">{new Date(event.createdAt).toLocaleString()}</p>
                  <Link href={`/profiles/${event.profileId}/connections`} className="text-xs text-indigo-400 hover:text-indigo-300">
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
