// /feed — the connections feed: posts from your network + your own.

import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Composer from "./Composer";
import PostCard from "@/components/PostCard";

export const dynamic = "force-dynamic";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const session = await requireAuth();
  if (!session?.userId) redirect("/login");

  // Optional hashtag filter (clicked from a post). Normalized like stored tags.
  const { tag: rawTag } = await searchParams;
  const tag = rawTag?.trim().toLowerCase().replace(/^#/, "") || null;

  // My network (mutual edges) + me.
  const network = await prisma.userConnection.findMany({
    where: { userId: session.userId },
    select: { connectedUserId: true },
  });
  const authorIds = [session.userId, ...network.map((n) => n.connectedUserId)];

  // Visiting the feed clears the "new posts" badge. Fire-and-forget.
  prisma.user
    .update({ where: { id: session.userId }, data: { feedLastSeenAt: new Date() } })
    .catch(() => {});

  const posts = await prisma.post.findMany({
    // Tag search stays within your network + own posts (same privacy scope as the
    // feed). tags is a JSON array string; matching the quoted token avoids partial
    // hits (e.g. "design" won't match "designsystems").
    where: { authorId: { in: authorIds }, ...(tag ? { tags: { contains: `"${tag}"` } } : {}) },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      author: {
        select: {
          username: true,
          name: true,
          avatarUrl: true,
          profiles: {
            select: { name: true, headshotUrl: true, isOwner: true },
            orderBy: { createdAt: "asc" },
          },
        },
      },
      reactions: { select: { emoji: true, userId: true } },
      _count: { select: { comments: true } },
    },
  });

  // Summarize reactions per post (counts by emoji) + the viewer's own reaction.
  const reactionInfo = (rs: { emoji: string; userId: string }[]) => {
    const byEmoji = new Map<string, number>();
    let mine: string | null = null;
    for (const r of rs) {
      byEmoji.set(r.emoji, (byEmoji.get(r.emoji) ?? 0) + 1);
      if (r.userId === session.userId) mine = r.emoji;
    }
    const counts = [...byEmoji.entries()].map(([emoji, count]) => ({ emoji, count })).sort((a, b) => b.count - a.count);
    return { counts, mine };
  };

  return (
    <main className="min-h-screen bg-background text-foreground px-4 py-8">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-1">Feed</h1>
        {tag ? (
          <p className="text-sm text-muted mb-6 flex items-center gap-2">
            <span>Posts tagged <span className="font-semibold text-emerald-700 dark:text-emerald-300">#{tag}</span></span>
            <Link href="/feed" className="text-xs underline hover:text-foreground">clear</Link>
          </p>
        ) : (
          <p className="text-sm text-muted mb-6">
            Posts from your network — {network.length} connection{network.length !== 1 ? "s" : ""}.
          </p>
        )}

        {!tag && <Composer />}

        {posts.length === 0 ? (
          <p className="text-muted text-sm mt-8 text-center">
            {tag
              ? <>No posts tagged <span className="font-medium">#{tag}</span> from your network yet. <Link href="/feed" className="underline">Back to feed</Link>.</>
              : "Nothing here yet. Share an update above, or connect with more people (scan their card!) to fill your feed."}
          </p>
        ) : (
          <div className="mt-6 space-y-3">
            {posts.map((post) => {
              const card = post.author.profiles.find((pr) => pr.isOwner) ?? post.author.profiles[0];
              const { counts, mine } = reactionInfo(post.reactions);
              return (
                <PostCard
                  key={post.id}
                  post={post}
                  author={{
                    username: post.author.username,
                    name: post.author.name ?? card?.name ?? null,
                    headshotUrl: post.author.avatarUrl ?? card?.headshotUrl ?? null,
                  }}
                  reactions={counts}
                  viewerReaction={mine}
                  commentCount={post._count.comments}
                />
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
