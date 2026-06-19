import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import ConnectionActions from "../profiles/[id]/connections/ConnectionActions";

export const dynamic = "force-dynamic";

export default async function MyConnectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ card?: string }>;
}) {
  const session = await requireAuth();
  if (!session?.userId) redirect("/login");
  const { card } = await searchParams;

  const profiles = await prisma.profile.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { scans: true } } },
  });

  // Account-level network: the people this user is mutually connected with
  // (UserConnection edges, created when a logged-in user connects via a card or
  // signs up through one). This is separate from per-card Connection requests
  // below — without it, network connections never appear on this page.
  const network = await prisma.userConnection.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    select: {
      createdAt: true,
      connectedUser: {
        select: {
          username: true,
          name: true,
          avatarUrl: true,
          profiles: {
            where: { isOwner: true },
            select: { name: true, headshotUrl: true },
            take: 1,
          },
        },
      },
    },
  });
  const networkMembers = network.map((n) => {
    const card = n.connectedUser.profiles[0];
    return {
      username: n.connectedUser.username,
      name: n.connectedUser.name ?? card?.name ?? n.connectedUser.username,
      avatarUrl: n.connectedUser.avatarUrl ?? card?.headshotUrl ?? null,
      createdAt: n.createdAt,
    };
  });

  // Confirm-to-connect: confirmed = network, pending = awaiting the owner's decision.
  const statusGroups = await prisma.connection.groupBy({
    by: ["profileId", "status"],
    where: { profile: { userId: session.userId } },
    _count: { _all: true },
  });
  const counts = new Map<string, { confirmed: number; pending: number }>();
  for (const g of statusGroups) {
    const entry = counts.get(g.profileId) ?? { confirmed: 0, pending: 0 };
    if (g.status === "confirmed") entry.confirmed = g._count._all;
    else if (g.status === "pending") entry.pending = g._count._all;
    counts.set(g.profileId, entry);
  }
  const countsFor = (id: string) => counts.get(id) ?? { confirmed: 0, pending: 0 };

  // Pending requests (decrypted) grouped per card, shown inline.
  const pendingRaw = await prisma.connection.findMany({
    where: { profile: { userId: session.userId }, status: "pending" },
    orderBy: { createdAt: "desc" },
    select: { id: true, emailEnc: true, linkedinEnc: true, githubEnc: true, createdAt: true, profileId: true },
  });
  const pendingByProfile = new Map<string, { id: string; label: string; createdAt: Date }[]>();
  for (const c of pendingRaw) {
    const label = c.emailEnc ? decrypt(c.emailEnc) : c.linkedinEnc ? decrypt(c.linkedinEnc) : c.githubEnc ? decrypt(c.githubEnc) : "New request";
    const list = pendingByProfile.get(c.profileId) ?? [];
    list.push({ id: c.id, label, createdAt: c.createdAt });
    pendingByProfile.set(c.profileId, list);
  }

  // Optional filter: only show one card's connections.
  const activeCard = card && profiles.some((p) => p.id === card) ? card : null;
  const shown = activeCard ? profiles.filter((p) => p.id === activeCard) : profiles;

  return (
    <main className="min-h-screen bg-background text-foreground px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">My Connections</h1>
          <p className="text-sm text-muted mt-1">Connection requests and network, per card.</p>
        </div>

        {/* Filter by card (only when there's more than one) */}
        {profiles.length > 1 && (
          <div className="mb-6 flex flex-wrap gap-2">
            <FilterChip href="/my-connections" active={!activeCard} label="All cards" />
            {profiles.map((p) => (
              <FilterChip
                key={p.id}
                href={`/my-connections?card=${p.id}`}
                active={activeCard === p.id}
                label={p.name}
                badge={countsFor(p.id).pending || undefined}
              />
            ))}
          </div>
        )}

        {/* Account network: mutual connections (other logged-in accounts) */}
        {networkMembers.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted mb-3">
              My Network ({networkMembers.length})
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {networkMembers.map((m) => (
                <Link
                  key={m.username}
                  href={`/u/${m.username}`}
                  className="flex items-center gap-3 rounded-xl bg-surface ring-1 ring-line px-3 py-2.5 hover:bg-elevated transition-colors"
                >
                  {m.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <span className="h-9 w-9 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 grid place-items-center text-sm font-semibold">
                      {m.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-body truncate">{m.name}</p>
                    <p className="text-xs text-muted truncate">@{m.username}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {profiles.length === 0 ? (
          <p className="text-muted">No profiles yet. Create your first one to start collecting connections.</p>
        ) : (
          <div className="grid gap-6">
            {shown.map((p) => {
              const pending = pendingByProfile.get(p.id) ?? [];
              return (
                <div key={p.id} className="bg-surface ring-1 ring-line shadow-sm rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-xs text-muted mt-1">
                        {countsFor(p.id).confirmed} connection{countsFor(p.id).confirmed !== 1 ? "s" : ""} • {p._count.scans} scan{p._count.scans !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <Link
                      href={`/profiles/${p.id}/connections`}
                      className="shrink-0 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 px-3 py-2 rounded-lg transition-colors"
                    >
                      View details
                    </Link>
                  </div>

                  {/* Pending requests shown immediately underneath */}
                  {pending.length > 0 && (
                    <div className="mt-4 border-t border-line pt-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-3">
                        Requests ({pending.length})
                      </p>
                      <div className="space-y-2">
                        {pending.map((r) => (
                          <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 px-3 py-2.5">
                            <div className="min-w-0">
                              <p className="text-sm text-body truncate">{r.label}</p>
                              <p className="text-xs text-muted">{new Date(r.createdAt).toLocaleDateString()}</p>
                            </div>
                            <ConnectionActions id={r.id} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

function FilterChip({ href, active, label, badge }: { href: string; active: boolean; label: string; badge?: number }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-emerald-600 text-white"
          : "bg-surface text-body ring-1 ring-line hover:bg-elevated"
      }`}
    >
      <span className="truncate max-w-[10rem]">{label}</span>
      {badge ? (
        <span className={`rounded-full px-1.5 text-xs ${active ? "bg-white/20" : "bg-amber-100 text-amber-700"}`}>{badge}</span>
      ) : null}
    </Link>
  );
}
