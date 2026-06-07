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
    },
  });

  return (
    <main className="min-h-screen bg-[#f6fbf8] text-slate-900 px-4 py-8">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-1">Feed</h1>
        <p className="text-sm text-slate-500 mb-6">
          Posts from your network — {network.length} connection{network.length !== 1 ? "s" : ""}.
        </p>

        <Composer />

        {posts.length === 0 ? (
          <p className="text-slate-500 text-sm mt-8 text-center">
            Nothing here yet. Share an update above, or connect with more people (scan their card!) to fill your feed.
          </p>
        ) : (
          <div className="mt-6 space-y-3">
            {posts.map((post) => {
              const card = post.author.profiles.find((pr) => pr.isOwner) ?? post.author.profiles[0];
              return (
                <PostCard
                  key={post.id}
                  post={post}
                  author={{
                    username: post.author.username,
                    name: card?.name ?? null,
                    headshotUrl: card?.headshotUrl ?? null,
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
