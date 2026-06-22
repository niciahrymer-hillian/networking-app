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

  const [recentConnections, recentScans, scanTotal, connectionTotal, pendingTotal, networkTotal, recentReactions, recentComments] = await Promise.all([
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
    // Engagement on YOUR posts (from others) — reactions + comments.
    prisma.reaction.findMany({
      where: { post: { authorId: session.userId }, userId: { not: session.userId } },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: { id: true, emoji: true, createdAt: true, postId: true, user: { select: { username: true } } },
    }),
    prisma.comment.findMany({
      where: { post: { authorId: session.userId }, authorId: { not: session.userId } },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: { id: true, body: true, createdAt: true, postId: true, author: { select: { username: true } } },
    }),
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

  const trunc = (s: string, n = 60) => (s.length > n ? s.slice(0, n).trimEnd() + "…" : s);
  type Event = { id: string; emoji: string; text: string; sub?: string; href: string; createdAt: Date };
  const events: Event[] = [
    ...recentConnections.map((c) => ({
      id: `connection-${c.id}`,
      // Confirm-to-connect: a pending submission is a request until the owner acts.
      emoji: c.status === "confirmed" ? "🤝" : "🔗",
      text: `${c.status === "confirmed" ? "New connection" : "New connection request"} from ${c.emailEnc ? decrypt(c.emailEnc) : c.linkedinEnc ? decrypt(c.linkedinEnc) : c.githubEnc ? decrypt(c.githubEnc) : "Someone"}`,
      sub: `on “${c.profile.name}”`,
      href: `/profiles/${c.profile.id}/connections`,
      createdAt: c.createdAt,
    })),
    ...recentScans.map((s) => ({
      id: `scan-${s.id}`,
      emoji: "👀",
      text: `Card viewed by ${(s.viewerUserId && viewerName.get(s.viewerUserId)) || deviceFromUA(s.userAgent)}`,
      sub: `on “${s.profile.name}”`,
      href: `/profiles/${s.profile.id}/connections`,
      createdAt: s.createdAt,
    })),
    ...recentReactions.map((r) => ({
      id: `reaction-${r.id}`,
      emoji: r.emoji,
      text: `@${r.user.username} reacted to your post`,
      href: `/posts/${r.postId}`,
      createdAt: r.createdAt,
    })),
    ...recentComments.map((c) => ({
      id: `comment-${c.id}`,
      emoji: "💬",
      text: `@${c.author.username} commented: “${trunc(c.body)}”`,
      href: `/posts/${c.postId}`,
      createdAt: c.createdAt,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <main className="min-h-screen bg-background text-foreground px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Activity</h1>
            <p className="text-sm text-muted mt-1">Connections, scans, and reactions &amp; comments on your posts.</p>
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
              <Link key={event.id} href={event.href} className="bg-surface ring-1 ring-line shadow-sm rounded-xl px-4 py-3 flex items-center justify-between gap-3 hover:bg-elevated transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    <span className="mr-1">{event.emoji}</span>{event.text}
                  </p>
                  {event.sub && <p className="text-xs text-muted mt-1 truncate">{event.sub}</p>}
                </div>
                <p className="text-xs text-muted shrink-0">{new Date(event.createdAt).toLocaleString()}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
