// GET /api/users/[username]/preview
// A privacy-safe teaser for non-connections (used by "People you may know" and the
// pending-request preview). Returns ONLY what helps someone decide to connect:
// identity, headline, a short bio, mutual connections (with names), top topics, and
// connection count. NEVER returns contact links, the feed/posts, or QR.
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const ownerProfile = {
  where: { isOwner: true },
  select: { name: true, headline: true, headshotUrl: true, about: true },
  take: 1,
} as const;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const session = await requireAuth();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { username } = await params;
  const target = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: { id: true, username: true, name: true, avatarUrl: true, profiles: ownerProfile },
  });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const card = target.profiles[0];

  // Mutual connections = people connected to BOTH me and the target.
  const [myNet, theirNet, connectionsCount, isConnected, posts] = await Promise.all([
    prisma.userConnection.findMany({ where: { userId: session.userId }, select: { connectedUserId: true } }),
    prisma.userConnection.findMany({ where: { userId: target.id }, select: { connectedUserId: true } }),
    prisma.userConnection.count({ where: { userId: target.id } }),
    prisma.userConnection.findFirst({ where: { userId: session.userId, connectedUserId: target.id }, select: { id: true } }),
    prisma.post.findMany({ where: { authorId: target.id }, select: { tags: true }, take: 50 }),
  ]);
  const myIds = new Set(myNet.map((n) => n.connectedUserId));
  const mutualIds = theirNet
    .map((n) => n.connectedUserId)
    .filter((id) => myIds.has(id) && id !== session.userId && id !== target.id);

  // Names for a few mutuals (account name → owner card name → @username).
  const mutualUsers = mutualIds.length
    ? await prisma.user.findMany({
        where: { id: { in: mutualIds.slice(0, 6) } },
        select: { username: true, name: true, profiles: { where: { isOwner: true }, select: { name: true }, take: 1 } },
      })
    : [];
  const mutualNames = mutualUsers.map((u) => u.name ?? u.profiles[0]?.name ?? `@${u.username}`);

  // Top topics = most-used hashtags across the target's posts (no post content exposed).
  const tagCounts = new Map<string, number>();
  for (const p of posts) {
    try {
      for (const t of (JSON.parse(p.tags ?? "[]") as string[]))
        tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
    } catch { /* ignore malformed tag JSON */ }
  }
  const topTopics = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([t]) => t);

  const about = card?.about?.trim();
  return NextResponse.json({
    username: target.username,
    name: target.name ?? card?.name ?? target.username,
    avatarUrl: target.avatarUrl ?? card?.headshotUrl ?? null,
    headline: card?.headline ?? null,
    about: about ? (about.length > 160 ? about.slice(0, 160).trimEnd() + "…" : about) : null,
    topTopics,
    mutuals: { count: mutualIds.length, names: mutualNames },
    connectionsCount,
    isConnected: !!isConnected,
  });
}
