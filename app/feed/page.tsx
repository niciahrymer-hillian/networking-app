// /feed — the connections feed: posts from your network + your own.

import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Composer from "./Composer";

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
            select: { name: true, slug: true, headshotUrl: true, isOwner: true },
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
              const displayName = card?.name ?? `@${post.author.username}`;
              return (
                <article key={post.id} className="bg-white ring-1 ring-emerald-900/5 shadow-sm rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    {card?.headshotUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={card.headshotUrl} alt={displayName} className="w-9 h-9 rounded-full object-cover ring-1 ring-emerald-900/10" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">
                        {displayName.charAt(card ? 0 : 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      {card ? (
                        <Link href={`/p/${card.slug}`} className="text-sm font-semibold text-slate-900 hover:text-emerald-700">
                          {card.name}
                        </Link>
                      ) : (
                        <span className="text-sm font-semibold text-slate-900">@{post.author.username}</span>
                      )}
                      <p className="text-xs text-slate-400">{new Date(post.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{post.content}</p>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
