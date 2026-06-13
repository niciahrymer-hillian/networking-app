// /u/[username] — a member's profile: a split view of their QR card (read-only,
// since it's someone else's account) on one side and a feed of their posts on the other.
// WHY: Clicking a post author in the feed leads here. The card mirrors the owner's
//      chosen template/palette but exposes no edit controls. A "Share QR" button
//      appears only when the owner allowed it AND the viewer is one of their connections.

import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { prisma } from "@/lib/db";
import { getAppUrl } from "@/lib/app-url";
import { getSession } from "@/lib/auth";
import ProfileCard from "@/components/ProfileCard";
import PostCard from "@/components/PostCard";

export const dynamic = "force-dynamic";

type Link = { label: string; url: string };

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      profiles: { orderBy: { createdAt: "asc" } },
      posts: { orderBy: { createdAt: "desc" }, take: 100 },
    },
  });
  if (!user) notFound();

  // The card to display = their designated "my card", else their first profile.
  const card = user.profiles.find((p) => p.isOwner) ?? user.profiles[0] ?? null;

  // Viewer context.
  const session = await getSession();
  const viewerId = session.userId ?? null;
  const isSelf = !!viewerId && viewerId === user.id;
  const isConnection =
    !isSelf && !!viewerId
      ? (await prisma.userConnection.count({
          where: { userId: viewerId, connectedUserId: user.id },
        })) > 0
      : false;

  // Share QR is gated by the owner's per-card setting AND the viewer being in their network (or themselves).
  const canShareQr = !!card?.allowConnectionQrShare && (isConnection || isSelf);

  const appUrl = await getAppUrl();
  const displayName = card?.name ?? `@${user.username}`;

  const qrDataUrl = card
    ? await QRCode.toDataURL(`${appUrl}/p/${card.slug}`, {
        width: 240,
        margin: 1,
        color: { dark: "#0f172a", light: "#ffffff" },
      })
    : undefined;
  const links: Link[] = card?.links ? JSON.parse(card.links) : [];

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f0faf5] via-[#f6fbf8] to-[#eef7f1] dark:from-[#0b1220] dark:via-[#0b1220] dark:to-[#0b1220] text-foreground px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-5xl lg:grid lg:grid-cols-[minmax(0,26rem)_1fr] lg:items-start lg:gap-8">
        {/* Left — read-only QR card */}
        <div className="flex flex-col items-center lg:sticky lg:top-24">
          {card ? (
            <ProfileCard
              template={card.template}
              cardTemplate={card.cardTemplate}
              colorScheme={card.colorScheme}
              font={card.font}
              profile={{
                id: card.id,
                slug: card.slug,
                name: card.name,
                headline: card.headline,
                headshotUrl: card.headshotUrl,
                phone: card.phone,
                email: card.email,
                linkedinUrl: card.linkedinUrl,
                githubUrl: card.githubUrl,
                pdfUrl: card.pdfUrl,
                about: card.about,
              }}
              links={links}
              firstName={card.name.split(" ")[0]}
              otherCards={[]}
              qrDataUrl={qrDataUrl}
              hideConnect
              shareQr={canShareQr}
              appUrl={appUrl}
            />
          ) : (
            <div className="w-full max-w-md rounded-3xl bg-surface p-8 text-center shadow-sm ring-1 ring-line">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <h1 className="mt-3 text-xl font-bold text-foreground">@{user.username}</h1>
              <p className="mt-1 text-sm text-muted">This member hasn&apos;t set up a card yet.</p>
            </div>
          )}
        </div>

        {/* Right — their posts */}
        <div className="mt-8 lg:mt-0">
          <h2 className="mb-4 text-lg font-bold tracking-tight">{displayName}&apos;s posts</h2>
          {user.posts.length === 0 ? (
            <p className="rounded-2xl bg-surface px-4 py-8 text-center text-sm text-muted ring-1 ring-line">
              No posts yet.
            </p>
          ) : (
            <div className="space-y-3">
              {user.posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
