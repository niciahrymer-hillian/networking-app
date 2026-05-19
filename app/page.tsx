// Dashboard — lists all profiles and provides management actions.
// Protected by middleware; only reachable when logged in.

import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DeleteButton from "./DeleteButton";
import ShareQRButton from "@/components/ShareQRButton";

export const dynamic = "force-dynamic"; // always fetch fresh profiles

export default async function Dashboard() {
  const session = await requireAuth();
  if (!session?.userId) redirect("/login");

  const profiles = await prisma.profile.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { connections: true, scans: true } },
      secondaryProfiles: { select: { id: true } },
    },
  });

  const ownerProfile = profiles.find((p) => p.isOwner);
  // Top-level cards = profiles that are NOT secondary to another
  const topLevel = profiles.filter((p) => !p.parentProfileId);
  // Quick lookup: secondaryId → parent profile object
  const secondaryOf = new Map(
    profiles.filter((p) => p.parentProfileId).map((p) => [p.id, p.parentProfileId!])
  );

  return (
    <main className="min-h-screen bg-[#0f0f1a] text-white">
      {/* Page toolbar — AppNav (in layout) handles brand + global nav + auth */}
      {ownerProfile && (
        <div className="border-b border-white/10 px-4 py-2 max-w-5xl mx-auto w-full flex justify-end">
          <Link
            href={`/p/${ownerProfile.slug}`}
            target="_blank"
            className="text-xs font-medium text-indigo-300 bg-indigo-900/40 border border-indigo-500/30 hover:bg-indigo-800/50 px-3 py-1.5 rounded-lg transition-colors"
          >
            ✦ View my card
          </Link>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Welcome banner */}
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-indigo-900/60 to-purple-900/40 border border-indigo-500/20 px-6 py-5 text-center">
          <p className="text-3xl mb-2">🤝</p>
          <h2 className="text-xl font-bold text-white tracking-tight">Welcome To the Network!</h2>
          <p className="text-white/50 text-sm mt-1">Manage your cards, track connections, and share your QR.</p>
        </div>

        {profiles.length === 0 ? (
          <div className="text-center py-24 text-white/40">
            <p className="text-5xl mb-4">👋</p>
            <p className="text-lg">No profiles yet.</p>
            <p className="text-sm mt-1">
              <Link href="/profiles/new" className="text-indigo-400 underline">
                Add your first contact
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
                className={`bg-white/5 border rounded-2xl p-4 flex flex-col gap-3 hover:border-indigo-500/40 transition-colors ${
                  p.isOwner ? "border-indigo-500/40" : "border-white/10"
                }`}
              >
                {/* Headshot + name */}
                <div className="flex items-center gap-3">
                  {p.headshotUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.headshotUrl}
                      alt={p.name}
                      className="rounded-full object-cover w-12 h-12 border border-white/10"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-indigo-800/50 flex items-center justify-center text-xl font-bold text-indigo-300">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{p.name}</p>
                      {p.isOwner && (
                        <span className="text-[10px] font-medium text-indigo-400 bg-indigo-900/50 px-1.5 py-0.5 rounded shrink-0">
                          My card
                        </span>
                      )}
                    </div>
                    {p.headline && (
                      <p className="text-xs text-white/50 truncate">
                        {p.headline}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 flex-wrap mt-auto pt-2 border-t border-white/10">
                  <Link
                    href={`/p/${p.slug}`}
                    target="_blank"
                    className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    View public
                  </Link>
                  <Link
                    href={`/profiles/${p.id}/edit`}
                    className="text-xs bg-indigo-700/50 hover:bg-indigo-600/60 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/profiles/${p.id}/connections`}
                    className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {p._count.connections > 0
                      ? `${p._count.connections} / ${p._count.scans} connected`
                      : p._count.scans > 0
                      ? `${p._count.scans} scan${p._count.scans !== 1 ? "s" : ""}`
                      : "Connections"}
                  </Link>
                  <ShareQRButton slug={p.slug} name={p.name} />
                  <DeleteButton id={p.id} name={p.name} />
                </div>
              </div>

              {/* Secondary cards — indented beneath the parent */}
              {secondaries.map((s) => (
                <div
                  key={s.id}
                  className="ml-6 bg-white/3 border border-white/10 rounded-xl p-3 flex flex-col gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-purple-400 bg-purple-900/40 border border-purple-500/30 px-1.5 py-0.5 rounded font-medium shrink-0">
                      2nd card
                    </span>
                    <p className="text-sm font-medium truncate">{s.name}</p>
                  </div>
                  {s.headline && (
                    <p className="text-xs text-white/40 truncate">{s.headline}</p>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    <Link href={`/p/${s.slug}`} target="_blank" className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded-lg transition-colors">View</Link>
                    <Link href={`/profiles/${s.id}/edit`} className="text-xs bg-indigo-700/40 hover:bg-indigo-600/50 px-2 py-1 rounded-lg transition-colors">Edit</Link>
                    <ShareQRButton slug={s.slug} name={s.name} />
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
