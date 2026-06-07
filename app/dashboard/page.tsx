// Dashboard — lists all profiles and provides management actions.
// Protected by middleware; only reachable when logged in.

import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DeleteButton from "../DeleteButton";
import ShareQRButton from "@/components/ShareQRButton";
import { getAppUrl } from "@/lib/app-url";

export const dynamic = "force-dynamic"; // always fetch fresh profiles

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
  // Quick lookup: secondaryId → parent profile object
  const secondaryOf = new Map(
    profiles.filter((p) => p.parentProfileId).map((p) => [p.id, p.parentProfileId!])
  );

  return (
    <main className="min-h-screen bg-[#f6fbf8] text-slate-900">
      {/* Page toolbar — AppNav (in layout) handles brand + global nav + auth */}
      {ownerProfile && (
        <div className="px-4 py-2 max-w-5xl mx-auto w-full flex justify-end">
          <Link
            href={`/p/${ownerProfile.slug}`}
            target="_blank"
            className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            ✦ View my card
          </Link>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Welcome banner */}
        <div className="mb-8 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-7 text-center text-white shadow-xl shadow-emerald-900/10">
          <p className="text-3xl mb-2">🤝</p>
          <h2 className="text-xl font-bold tracking-tight">Welcome To the Network!</h2>
          <p className="text-white/80 text-sm mt-1">Manage your cards, track connections, and share your QR.</p>
        </div>

        {profiles.length === 0 ? (
          <div className="text-center py-24 text-slate-400">
            <p className="text-5xl mb-4">👋</p>
            <p className="text-lg text-slate-600">No cards yet.</p>
            <p className="text-sm mt-3">
              <Link href="/profiles/new" className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-500">
                Create your first card
              </Link>
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topLevel.map((p) => {
              // Find secondary cards that point to this profile
              const secondaries = profiles.filter((s) => s.parentProfileId === p.id);
              return (
              <div key={p.id} className="flex flex-col gap-2">
              <div
                className={`bg-white rounded-2xl p-4 flex flex-col gap-3 shadow-sm transition-shadow hover:shadow-md ${
                  p.isOwner ? "ring-2 ring-emerald-400" : "ring-1 ring-emerald-900/5"
                }`}
              >
                {/* Headshot + name */}
                <div className="flex items-center gap-3">
                  {p.headshotUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.headshotUrl}
                      alt={p.name}
                      className="rounded-full object-cover w-12 h-12 ring-1 ring-emerald-900/10"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-xl font-bold text-emerald-700">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{p.name}</p>
                      {p.isOwner && (
                        <span className="text-[10px] font-medium text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded shrink-0">
                          My card
                        </span>
                      )}
                    </div>
                    {p.headline && (
                      <p className="text-xs text-slate-500 truncate">
                        {p.headline}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 flex-wrap mt-auto pt-2 border-t border-slate-100">
                  <Link
                    href={`/p/${p.slug}`}
                    target="_blank"
                    className="text-xs border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg transition-colors"
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
                    className="text-xs border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Regenerate QR
                  </Link>
                  <Link
                    href={`/profiles/${p.id}/connections`}
                    className="text-xs border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg transition-colors"
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
                      className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors"
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
                  className="ml-6 bg-white ring-1 ring-emerald-900/5 shadow-sm rounded-xl p-3 flex flex-col gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded font-medium shrink-0">
                      2nd card
                    </span>
                    <p className="text-sm font-medium truncate">{s.name}</p>
                  </div>
                  {s.headline && (
                    <p className="text-xs text-slate-500 truncate">{s.headline}</p>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    <Link href={`/p/${s.slug}`} target="_blank" className="text-xs border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-2 py-1 rounded-lg transition-colors">View</Link>
                    <Link href={`/profiles/${s.id}/edit`} className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-2 py-1 rounded-lg transition-colors">Edit</Link>
                    <ShareQRButton slug={s.slug} name={s.name} appUrl={appUrl} />
                    {countsFor(s.id).pending > 0 && (
                      <Link href={`/profiles/${s.id}/connections`} className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 px-2 py-1 rounded-lg transition-colors">
                        {countsFor(s.id).pending} pending
                      </Link>
                    )}
                  </div>
                </div>
              ))}
              </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
