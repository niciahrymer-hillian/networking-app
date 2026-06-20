// /posts/[id] — single-post permalink. Notifications ("@x shared a new post") link
// here. Privacy: visible only if the author is you or someone in your network — the
// same scope as the feed, so this never exposes a non-connection's post.
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import PostCard from "@/components/PostCard";

export const dynamic = "force-dynamic";

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth();
  if (!session?.userId) redirect("/login");

  const { id } = await params;
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          name: true,
          avatarUrl: true,
          profiles: { select: { name: true, headshotUrl: true, isOwner: true }, orderBy: { createdAt: "asc" } },
        },
      },
      reactions: { select: { emoji: true, userId: true } },
      _count: { select: { comments: true } },
    },
  });
  if (!post) notFound();

  // Author must be you or in your network.
  if (post.author.id !== session.userId) {
    const edge = await prisma.userConnection.findFirst({
      where: { userId: session.userId, connectedUserId: post.author.id },
      select: { id: true },
    });
    if (!edge) notFound();
  }

  const byEmoji = new Map<string, number>();
  let mine: string | null = null;
  for (const r of post.reactions) {
    byEmoji.set(r.emoji, (byEmoji.get(r.emoji) ?? 0) + 1);
    if (r.userId === session.userId) mine = r.emoji;
  }
  const counts = [...byEmoji.entries()].map(([emoji, count]) => ({ emoji, count })).sort((a, b) => b.count - a.count);
  const card = post.author.profiles.find((pr) => pr.isOwner) ?? post.author.profiles[0];

  return (
    <main className="min-h-screen bg-background text-foreground px-4 py-8">
      <div className="max-w-xl mx-auto">
        <Link href="/feed" className="text-sm text-emerald-700 dark:text-emerald-300 hover:text-emerald-600 transition-colors">← Feed</Link>
        <div className="mt-4">
          <PostCard
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
        </div>
      </div>
    </main>
  );
}
