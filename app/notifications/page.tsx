import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/crypto";

export const dynamic = "force-dynamic";

// Best-effort human label for who submitted a connection (only their contact
// fields are stored — encrypted). Scans are anonymous, so we surface a device hint.
function deviceFromUA(ua: string | null): string {
  if (!ua) return "Anonymous visitor";
  if (/iphone|android|mobile/i.test(ua)) return "Someone on mobile";
  if (/mac|windows|linux/i.test(ua)) return "Someone on desktop";
  return "Anonymous visitor";
}

export default async function NotificationsPage() {
  const session = await requireAuth();
  if (!session?.userId) redirect("/login");

  const [recentConnections, recentScans, scanTotal, connectionTotal, pendingTotal, networkTotal] = await Promise.all([
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
    prisma.scan.count({ where: { profile: { userId: session.userId } } }),
    prisma.connection.count({ where: { profile: { userId: session.userId }, status: "confirmed" } }),
    prisma.connection.count({ where: { profile: { userId: session.userId }, status: "pending" } }),
    prisma.userConnection.count({ where: { userId: session.userId } }),
  ]);

  // Resolve usernames for scans that recorded a logged-in viewer → "viewed by @user".
  const viewerIds = [...new Set(recentScans.map((s) => s.viewerUserId).filter((v): v is string => !!v))];
  const viewers = viewerIds.length
    ? await prisma.user.findMany({ where: { id: { in: viewerIds } }, select: { id: true, username: true } })
    : [];
  const viewerName = new Map(viewers.map((u) => [u.id, `@${u.username}`]));

  // Stats overview — at-a-glance totals across all of this user's cards.
  const stats = [
    { label: "Scans", value: scanTotal, emoji: "👀" },
    { label: "Connections", value: connectionTotal, emoji: "🤝" },
    { label: "Pending", value: pendingTotal, emoji: "⏳" },
    { label: "Network", value: networkTotal, emoji: "🌐" },
  ];

  const events = [
    ...recentConnections.map((c) => ({
      id: `connection-${c.id}`,
      // Confirm-to-connect: a pending submission is a request until the owner acts.
      emoji: c.status === "confirmed" ? "🤝" : "🔗",
      type: c.status === "confirmed" ? "New connection" : "New connection request",
      prep: "from",
      // Who: the best identifier they shared (decrypted), else anonymous.
      who: c.emailEnc ? decrypt(c.emailEnc) : c.linkedinEnc ? decrypt(c.linkedinEnc) : c.githubEnc ? decrypt(c.githubEnc) : "Someone",
      profileId: c.profile.id,
      profileName: c.profile.name,
      createdAt: c.createdAt,
    })),
    ...recentScans.map((s) => ({
      id: `scan-${s.id}`,
      emoji: "👀",
      type: "Card viewed",
      prep: "by",
      who: (s.viewerUserId && viewerName.get(s.viewerUserId)) || deviceFromUA(s.userAgent),
      profileId: s.profile.id,
      profileName: s.profile.name,
      createdAt: s.createdAt,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <main className="min-h-screen bg-background text-foreground px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Activity</h1>
            <p className="text-sm text-muted mt-1">Recent connections and scans across your cards.</p>
          </div>
          <Link href="/scan-log" className="text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:text-emerald-600 shrink-0">
            Full scan log →
          </Link>
        </div>

        {/* Stats overview */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-line">
              <p className="text-2xl">{s.emoji}</p>
              <p className="mt-1 text-2xl font-bold tracking-tight">{s.value}</p>
              <p className="text-sm text-muted">{s.label}</p>
            </div>
          ))}
        </div>

        {events.length === 0 ? (
          <p className="text-muted">No activity yet.</p>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="bg-surface ring-1 ring-line shadow-sm rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    <span className="mr-1">{event.emoji}</span>{event.type} {event.prep} <span className="text-body font-normal">{event.who}</span>
                  </p>
                  <p className="text-xs text-muted mt-1">on “{event.profileName}”</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted">{new Date(event.createdAt).toLocaleString()}</p>
                  <Link href={`/profiles/${event.profileId}/connections`} className="text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:text-emerald-600">
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
