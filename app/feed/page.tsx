// /feed — the connections feed: posts from your network + your own.

import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Composer from "./Composer";
import PostCard from "@/components/PostCard";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const session = await requireAuth();
  if (!session?.userId) redirect("/login");

  // My network (mutual edges) + me.
  const network = await prisma.userConnection.findMany({
    where: { userId: session.userId },
    select: { connectedUserId: true },
  });
  const authorIds = [session.userId, ...network.map((n) => n.connectedUserId)];

  const posts = await prisma.post.findMany({
    where: { authorId: { in: authorIds } },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      author: {
        select: {
          username: true,
          profiles: {
            select: { name: true, headshotUrl: true, isOwner: true },
            orderBy: { createdAt: "asc" },
          },
        },
      },
      reactions: { select: { emoji: true, userId: true } },
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
        <p className="text-sm text-muted mb-6">
          Posts from your network — {network.length} connection{network.length !== 1 ? "s" : ""}.
        </p>

        <Composer />

        {posts.length === 0 ? (
          <p className="text-muted text-sm mt-8 text-center">
            Nothing here yet. Share an update above, or connect with more people (scan their card!) to fill your feed.
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
                    name: card?.name ?? null,
                    headshotUrl: card?.headshotUrl ?? null,
                  }}
                  reactions={counts}
                  viewerReaction={mine}
                />
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
