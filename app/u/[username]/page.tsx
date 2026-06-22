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
      posts: {
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          reactions: { select: { emoji: true, userId: true } },
          _count: { select: { comments: true } },
        },
      },
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

  // The whole profile (all cards + posts) is visible to connections (and self).
  // Everyone else sees the primary card + an invitation to connect.
  const canSeeFull = isSelf || isConnection;

  // Account-level identity (prefer the account's own name/avatar; else the primary card).
  const accountName = user.name ?? card?.name ?? `@${user.username}`;
  const accountAvatar = user.avatarUrl ?? card?.headshotUrl ?? null;
  const otherCards = user.profiles.filter((p) => p.id !== card?.id);

  // Structured résumé (account-level JSON), shown to connections.
  const parseArr = <T,>(s: string | null): T[] => { try { const v = JSON.parse(s ?? "[]"); return Array.isArray(v) ? (v as T[]) : []; } catch { return []; } };
  const experience = parseArr<{ role?: string; org?: string; period?: string; summary?: string }>(user.experience);
  const education = parseArr<{ school?: string; credential?: string; period?: string }>(user.education);
  const skills = parseArr<string>(user.skills);
  const hasResume = experience.length > 0 || education.length > 0 || skills.length > 0;

  // Share QR is gated by the owner's per-card setting AND the viewer being in their network (or themselves).
  const canShareQr = !!card?.allowConnectionQrShare && canSeeFull;

  const appUrl = await getAppUrl();
  const qrDataUrl = card
    ? await QRCode.toDataURL(`${appUrl}/p/${card.slug}`, { width: 240, margin: 1, color: { dark: "#0f172a", light: "#ffffff" } })
    : undefined;
  const links: Link[] = card?.links ? JSON.parse(card.links) : [];

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f0faf5] via-[#f6fbf8] to-[#eef7f1] dark:from-[#0b1220] dark:via-[#0b1220] dark:to-[#0b1220] text-foreground px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        {/* Account header — identity for the whole account (not a single card) */}
        <div className="mb-6 flex items-center gap-4">
          {accountAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={accountAvatar} alt={accountName} className="h-16 w-16 rounded-full object-cover ring-1 ring-line" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-2xl font-bold text-emerald-700 dark:text-emerald-300">
              {accountName.replace(/^@/, "").charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold tracking-tight">{accountName}</h1>
            <p className="text-sm text-muted">@{user.username}{user.profiles.length > 1 ? ` · ${user.profiles.length} cards` : ""}</p>
            {user.openToWork && (
              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-500/30">
                🟢 Open to work
              </span>
            )}
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-[minmax(0,26rem)_1fr] lg:items-start lg:gap-8">
          {/* Left — primary card (+ links to other cards when viewable) */}
          <div className="flex flex-col items-center gap-3 lg:sticky lg:top-24">
            {card ? (
              <ProfileCard
                template={card.template}
                cardTemplate={card.cardTemplate}
                colorScheme={card.colorScheme}
                font={card.font}
                profile={{
                  id: card.id, slug: card.slug, name: card.name, headline: card.headline,
                  headshotUrl: card.headshotUrl, phone: card.phone, email: card.email,
                  linkedinUrl: card.linkedinUrl, githubUrl: card.githubUrl, pdfUrl: card.pdfUrl, about: card.about,
                }}
                links={links}
                firstName={card.name.split(" ")[0]}
                otherCards={canSeeFull ? otherCards.map((c) => ({ slug: c.slug, name: c.name, headline: c.headline })) : []}
                qrDataUrl={qrDataUrl}
                hideConnect
                shareQr={canShareQr}
                appUrl={appUrl}
              />
            ) : (
              <div className="w-full max-w-md rounded-3xl bg-surface p-8 text-center shadow-sm ring-1 ring-line">
                <p className="text-sm text-muted">This member hasn&apos;t set up a card yet.</p>
              </div>
            )}
          </div>

          {/* Right — full profile (posts) for connections; an invite otherwise */}
          <div className="mt-8 lg:mt-0">
            {canSeeFull ? (
              <>
                {hasResume && (
                  <div className="mb-8 space-y-4">
                    {experience.length > 0 && (
                      <section className="rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-line">
                        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Experience</h2>
                        <div className="space-y-4">
                          {experience.map((e, i) => (
                            <div key={i}>
                              <p className="text-sm font-semibold">{e.role}{e.org && <span className="font-normal text-muted"> · {e.org}</span>}</p>
                              {e.period && <p className="text-xs text-muted">{e.period}</p>}
                              {e.summary && <p className="mt-1 text-sm text-body whitespace-pre-wrap leading-relaxed">{e.summary}</p>}
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                    {education.length > 0 && (
                      <section className="rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-line">
                        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Education</h2>
                        <div className="space-y-3">
                          {education.map((e, i) => (
                            <div key={i}>
                              <p className="text-sm font-semibold">{e.school}</p>
                              <p className="text-xs text-muted">{[e.credential, e.period].filter(Boolean).join(" · ")}</p>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                    {skills.length > 0 && (
                      <section className="rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-line">
                        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Skills</h2>
                        <div className="flex flex-wrap gap-1.5">
                          {skills.map((s) => (
                            <span key={s} className="rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">{s}</span>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                )}
                <h2 className="mb-4 text-lg font-bold tracking-tight">{accountName.replace(/^@/, "")}&apos;s posts</h2>
                {user.posts.length === 0 ? (
                  <p className="rounded-2xl bg-surface px-4 py-8 text-center text-sm text-muted ring-1 ring-line">No posts yet.</p>
                ) : (
                  <div className="space-y-3">
                    {user.posts.map((post) => {
                      const byEmoji = new Map<string, number>();
                      let mine: string | null = null;
                      for (const r of post.reactions) {
                        byEmoji.set(r.emoji, (byEmoji.get(r.emoji) ?? 0) + 1);
                        if (r.userId === viewerId) mine = r.emoji;
                      }
                      const counts = [...byEmoji.entries()].map(([emoji, count]) => ({ emoji, count })).sort((a, b) => b.count - a.count);
                      return <PostCard key={post.id} post={post} reactions={counts} viewerReaction={mine} commentCount={post._count.comments} />;
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-2xl bg-surface p-8 text-center shadow-sm ring-1 ring-line">
                <p className="text-4xl">🔒</p>
                <h2 className="mt-3 text-lg font-bold tracking-tight">Connect to see the full profile</h2>
                <p className="mt-2 text-sm text-muted">
                  {accountName.replace(/^@/, "")}&apos;s other cards and posts are visible to their connections. Scan their card to connect.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
