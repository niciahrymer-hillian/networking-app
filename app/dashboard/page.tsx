// Dashboard — lists all profiles and provides management actions.
// Protected by middleware; only reachable when logged in.
//
// Tiles (profile cards + widgets like Recent Activity) are rendered on the server
// and handed to <DashboardTiles>, a client component that owns drag-and-drop
// reordering. Tile order persists per-user (User.dashboardLayout).

import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DeleteButton from "../DeleteButton";
import ShareQRButton from "@/components/ShareQRButton";
import { getAppUrl } from "@/lib/app-url";
import DashboardTiles, { type Tile } from "./DashboardTiles";
import ConnectionActions from "../profiles/[id]/connections/ConnectionActions";
import PymkList from "@/components/PymkList";
import { decrypt } from "@/lib/crypto";

export const dynamic = "force-dynamic"; // always fetch fresh profiles

// Compact relative time for the activity feed.
function timeAgo(d: Date | string): string {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString();
}

export default async function Dashboard() {
  const session = await requireAuth();
  if (!session?.userId) redirect("/login");

  const appUrl = await getAppUrl();

  const profiles = await prisma.profile.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { scans: true } },
      secondaryProfiles: { select: { id: true } },
    },
  });

  // Confirm-to-connect: count confirmed (network) and pending (requests) per card.
  // A single groupBy avoids N per-profile queries.
  const statusGroups = await prisma.connection.groupBy({
    by: ["profileId", "status"],
    where: { profile: { userId: session.userId } },
    _count: { _all: true },
  });
  const connectionCounts = new Map<string, { confirmed: number; pending: number }>();
  for (const g of statusGroups) {
    const entry = connectionCounts.get(g.profileId) ?? { confirmed: 0, pending: 0 };
    if (g.status === "confirmed") entry.confirmed = g._count._all;
    else if (g.status === "pending") entry.pending = g._count._all;
    connectionCounts.set(g.profileId, entry);
  }
  const countsFor = (profileId: string) =>
    connectionCounts.get(profileId) ?? { confirmed: 0, pending: 0 };

  const ownerProfile = profiles.find((p) => p.isOwner);
  // Top-level cards = profiles that are NOT secondary to another
  const topLevel = profiles.filter((p) => !p.parentProfileId);

  // === Recent activity feed: latest scans + connection submissions across all cards. ===
  const [recentScans, recentConnections] = await Promise.all([
    prisma.scan.findMany({
      where: { profile: { userId: session.userId } },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { id: true, createdAt: true, profile: { select: { name: true } } },
    }),
    prisma.connection.findMany({
      where: { profile: { userId: session.userId } },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { id: true, createdAt: true, status: true, profile: { select: { name: true } } },
    }),
  ]);

  // === Member-to-member network — powers notifications + "People you may know". ===
  const ownerSelect = {
    id: true,
    username: true,
    profiles: {
      where: { isOwner: true },
      select: { name: true, headshotUrl: true, headline: true, slug: true },
      take: 1,
    },
  } as const;

  const network = await prisma.userConnection.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    include: { connectedUser: { select: ownerSelect } },
  });
  const networkIds = network.map((n) => n.connectedUserId);

  const [networkPosts, pendingRaw, secondDegree] = await Promise.all([
    // New posts from people in your network (notification-style events).
    networkIds.length
      ? prisma.post.findMany({
          where: { authorId: { in: networkIds } },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, createdAt: true, author: { select: { username: true } } },
        })
      : Promise.resolve([]),
    // Pending connection requests across all of this user's cards (decrypted for display).
    prisma.connection.findMany({
      where: { profile: { userId: session.userId }, status: "pending" },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, emailEnc: true, linkedinEnc: true, githubEnc: true, createdAt: true, profile: { select: { name: true } } },
    }),
    // Friends-of-friends (2nd degree) that aren't already in your network.
    networkIds.length
      ? prisma.userConnection.findMany({
          where: { userId: { in: networkIds }, connectedUserId: { notIn: [session.userId, ...networkIds] } },
          include: { connectedUser: { select: ownerSelect } },
        })
      : Promise.resolve([]),
  ]);

  // Pending requests — decrypt the best available identifier for a human label.
  const pendingReqs = pendingRaw.map((c) => ({
    id: c.id,
    label: c.emailEnc ? decrypt(c.emailEnc) : c.linkedinEnc ? decrypt(c.linkedinEnc) : c.githubEnc ? decrypt(c.githubEnc) : null,
    cardName: c.profile.name,
    createdAt: c.createdAt,
  }));

  // People you may know — rank candidates by number of mutual connections.
  const pymkMap = new Map<string, { user: (typeof secondDegree)[number]["connectedUser"]; mutuals: number }>();
  for (const s of secondDegree) {
    const entry = pymkMap.get(s.connectedUserId) ?? { user: s.connectedUser, mutuals: 0 };
    entry.mutuals += 1;
    pymkMap.set(s.connectedUserId, entry);
  }
  const pymk = [...pymkMap.values()].sort((a, b) => b.mutuals - a.mutuals).slice(0, 4);

  type Activity = { id: string; when: Date; text: string; emoji: string; href?: string };
  const activity: Activity[] = [
    ...recentScans.map((s) => ({
      id: `s-${s.id}`,
      when: s.createdAt,
      emoji: "👀",
      text: `Your "${s.profile.name}" card was viewed`,
    })),
    ...recentConnections.map((c) => ({
      id: `c-${c.id}`,
      when: c.createdAt,
      emoji: c.status === "confirmed" ? "✅" : c.status === "declined" ? "🚫" : "🔗",
      text:
        c.status === "confirmed"
          ? `New connection on "${c.profile.name}"`
          : c.status === "declined"
          ? `Declined request on "${c.profile.name}"`
          : `New connection request on "${c.profile.name}"`,
    })),
    // Notifications: new posts from your network — link to the post permalink.
    ...networkPosts.map((p) => ({
      id: `p-${p.id}`,
      when: p.createdAt,
      emoji: "📝",
      text: `@${p.author.username} shared a new post`,
      href: `/posts/${p.id}`,
    })),
    // Notifications: people who joined your network — link to their profile.
    ...network.slice(0, 6).map((n) => ({
      id: `n-${n.id}`,
      when: n.createdAt,
      emoji: "🌐",
      text: `@${n.connectedUser.username} is now in your network`,
      href: `/u/${n.connectedUser.username}`,
    })),
  ]
    .sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime())
    .slice(0, 8);

  const totalPending = [...connectionCounts.values()].reduce((n, c) => n + c.pending, 0);

  // Saved tile order (JSON array of ids); reconciled client-side against live tiles.
  let savedOrder: string[] = [];
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { dashboardLayout: true },
    });
    const parsed = user?.dashboardLayout ? JSON.parse(user.dashboardLayout) : [];
    if (Array.isArray(parsed)) savedOrder = parsed.filter((x): x is string => typeof x === "string");
  } catch {
    savedOrder = [];
  }

  // --- Tile: Recent Activity widget ---
  const activityTile = (
    <div className="flex h-full flex-col rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-line">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-semibold">Recent activity</p>
        {totalPending > 0 && (
          <span className="rounded-full bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300 ring-1 ring-amber-200">
            {totalPending} pending
          </span>
        )}
      </div>
      {activity.length === 0 ? (
        <p className="text-sm text-muted">No activity yet. Share your QR to get scans and connections.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {activity.map((a) => (
            <li key={a.id} className="flex items-start gap-2.5 text-sm">
              <span className="shrink-0">{a.emoji}</span>
              {a.href ? (
                <Link href={a.href} className="min-w-0 flex-1 text-body hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline transition-colors">
                  {a.text}
                </Link>
              ) : (
                <span className="min-w-0 flex-1 text-body">{a.text}</span>
              )}
              <span className="shrink-0 text-xs text-muted">{timeAgo(a.when)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  // --- Tile: Pending requests widget (Confirm/Decline inline) ---
  const pendingTile = (
    <div className="flex h-full flex-col rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-line">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-semibold">Pending requests</p>
        {pendingReqs.length > 0 && (
          <span className="rounded-full bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300 ring-1 ring-amber-200">
            {pendingReqs.length}
          </span>
        )}
      </div>
      {pendingReqs.length === 0 ? (
        <p className="text-sm text-muted">No pending requests. Share your QR to collect new connections.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {pendingReqs.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm text-body">{r.label ?? "New request"}</p>
                <p className="text-xs text-muted">on “{r.cardName}” · {timeAgo(r.createdAt)}</p>
              </div>
              <ConnectionActions id={r.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  // --- Tile: People you may know (friends-of-friends) ---
  const pymkTile = (
    <div className="flex h-full flex-col rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-line">
      <p className="mb-3 font-semibold">People you may know</p>
      {pymk.length === 0 ? (
        <p className="text-sm text-muted">Connect with more people and we’ll suggest mutuals here.</p>
      ) : (
        <PymkList
          people={pymk.map(({ user, mutuals }) => ({
            id: user.id,
            username: user.username,
            name: user.profiles[0]?.name ?? `@${user.username}`,
            headshotUrl: user.profiles[0]?.headshotUrl ?? null,
            mutuals,
          }))}
        />
      )}
    </div>
  );

  // --- Tile: Profile strength / completeness ---
  const completenessItems = ownerProfile
    ? [
        { label: "Photo", done: !!ownerProfile.headshotUrl },
        { label: "Headline", done: !!ownerProfile.headline },
        { label: "About", done: !!ownerProfile.about },
        { label: "LinkedIn", done: !!ownerProfile.linkedinUrl },
        { label: "GitHub", done: !!ownerProfile.githubUrl },
        { label: "Phone", done: !!ownerProfile.phone },
      ]
    : [];
  const completenessDone = completenessItems.filter((i) => i.done).length;
  const completenessPct = completenessItems.length
    ? Math.round((completenessDone / completenessItems.length) * 100)
    : 0;
  const completenessTile = ownerProfile ? (
    <div className="flex h-full flex-col rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-line">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-semibold">Profile strength</p>
        <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{completenessPct}%</span>
      </div>
      <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-elevated">
        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${completenessPct}%` }} />
      </div>
      <ul className="grid grid-cols-2 gap-1.5 text-sm">
        {completenessItems.map((i) => (
          <li key={i.label} className={i.done ? "text-body" : "text-muted"}>
            <span className={i.done ? "text-emerald-600 dark:text-emerald-400" : "text-muted"}>{i.done ? "✓" : "○"}</span> {i.label}
          </li>
        ))}
      </ul>
      {completenessDone < completenessItems.length && (
        <Link
          href={`/profiles/${ownerProfile.id}/edit`}
          className="mt-3 text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:text-emerald-600"
        >
          Complete your profile →
        </Link>
      )}
    </div>
  ) : null;

  // --- Tile: one profile card (+ its nested secondary cards) ---
  const renderCardTile = (p: (typeof topLevel)[number]) => {
    const secondaries = profiles.filter((s) => s.parentProfileId === p.id);
    return (
      <div className="flex flex-col gap-2">
        <div
          className={`bg-surface rounded-2xl p-4 flex flex-col gap-3 shadow-sm transition-shadow hover:shadow-md ${
            p.isOwner ? "ring-2 ring-emerald-400" : "ring-1 ring-line"
          }`}
        >
          {/* Headshot + name */}
          <div className="flex items-center gap-3">
            {p.headshotUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.headshotUrl}
                alt={p.name}
                className="rounded-full object-cover w-12 h-12 ring-1 ring-line"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-xl font-bold text-emerald-700 dark:text-emerald-300">
                {p.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold truncate">{p.name}</p>
                {p.isOwner && (
                  <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/20 px-1.5 py-0.5 rounded shrink-0">
                    My card
                  </span>
                )}
              </div>
              {p.headline && <p className="text-xs text-muted truncate">{p.headline}</p>}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap mt-auto pt-2 border-t border-line">
            <Link
              href={`/p/${p.slug}`}
              target="_blank"
              className="text-xs border border-line bg-surface hover:bg-elevated text-body px-3 py-1.5 rounded-lg transition-colors"
            >
              View public
            </Link>
            <Link
              href={`/profiles/${p.id}/edit`}
              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              Edit
            </Link>
            <Link
              href={`/profiles/${p.id}/edit#qr`}
              className="text-xs border border-line bg-surface hover:bg-elevated text-body px-3 py-1.5 rounded-lg transition-colors"
            >
              Regenerate QR
            </Link>
            <Link
              href={`/profiles/${p.id}/connections`}
              className="text-xs border border-line bg-surface hover:bg-elevated text-body px-3 py-1.5 rounded-lg transition-colors"
            >
              {countsFor(p.id).confirmed > 0
                ? `${countsFor(p.id).confirmed} / ${p._count.scans} connected`
                : p._count.scans > 0
                ? `${p._count.scans} scan${p._count.scans !== 1 ? "s" : ""}`
                : "Connections"}
            </Link>
            {countsFor(p.id).pending > 0 && (
              <Link
                href={`/profiles/${p.id}/connections`}
                className="text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                {countsFor(p.id).pending} pending
              </Link>
            )}
            <ShareQRButton slug={p.slug} name={p.name} appUrl={appUrl} />
            <DeleteButton id={p.id} name={p.name} />
          </div>
        </div>

        {/* Secondary cards — indented beneath the parent */}
        {secondaries.map((s) => (
          <div
            key={s.id}
            className="ml-6 bg-surface ring-1 ring-line shadow-sm rounded-xl p-3 flex flex-col gap-2"
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/30 px-1.5 py-0.5 rounded font-medium shrink-0">
                2nd card
              </span>
              <p className="text-sm font-medium truncate">{s.name}</p>
            </div>
            {s.headline && <p className="text-xs text-muted truncate">{s.headline}</p>}
            <div className="flex gap-2 flex-wrap">
              <Link href={`/p/${s.slug}`} target="_blank" className="text-xs border border-line bg-surface hover:bg-elevated text-body px-2 py-1 rounded-lg transition-colors">View</Link>
              <Link href={`/profiles/${s.id}/edit`} className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-2 py-1 rounded-lg transition-colors">Edit</Link>
              <ShareQRButton slug={s.slug} name={s.name} appUrl={appUrl} />
              {countsFor(s.id).pending > 0 && (
                <Link href={`/profiles/${s.id}/connections`} className="text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 hover:bg-amber-100 px-2 py-1 rounded-lg transition-colors">
                  {countsFor(s.id).pending} pending
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Widgets first by default; user can drag any of them anywhere.
  const tiles: Tile[] = [
    { id: "widget:recent-activity", node: activityTile },
    { id: "widget:pending-requests", node: pendingTile },
    { id: "widget:people-you-may-know", node: pymkTile },
    ...(completenessTile ? [{ id: "widget:profile-completeness", node: completenessTile }] : []),
    ...topLevel.map((p) => ({ id: `card:${p.id}`, node: renderCardTile(p) })),
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Page toolbar — AppNav (in layout) handles brand + global nav + auth */}
      {ownerProfile && (
        <div className="px-4 py-2 max-w-5xl mx-auto w-full flex justify-end">
          <Link
            href={`/p/${ownerProfile.slug}`}
            target="_blank"
            className="text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            ✦ View my card
          </Link>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Welcome banner — slim */}
        <div className="mb-8 flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3.5 text-center text-white shadow-lg shadow-emerald-900/10">
          <span className="text-xl">🤝</span>
          <h2 className="text-base font-bold tracking-tight">Welcome to the Network</h2>
          <span className="hidden sm:inline text-white/70 text-sm">· manage cards, track connections, share your QR</span>
        </div>

        {profiles.length === 0 ? (
          <div className="text-center py-24 text-muted">
            <p className="text-5xl mb-4">👋</p>
            <p className="text-lg text-body">No cards yet.</p>
            <p className="text-sm mt-3">
              <Link href="/profiles/new" className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-500">
                Create your first card
              </Link>
            </p>
          </div>
        ) : (
          <DashboardTiles tiles={tiles} initialOrder={savedOrder} />
        )}
      </div>
    </main>
  );
}
