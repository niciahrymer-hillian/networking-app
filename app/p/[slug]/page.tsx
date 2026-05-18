// Public profile page — the destination when someone scans a QR code.
// WHY: This page is intentionally public (no auth) so anyone with the QR link can view it.
// EFFECT: Shows the person's full profile with a "nice to meet you" welcome message.
//         Also logs a Scan record on every visit so the owner can see total reach.
//         Inline connect form lets visitors sign up without a second page load.

import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import BusinessCardClient from "@/components/BusinessCardClient";
import ConnectForm from "./connect/ConnectForm";

type Link = { label: string; url: string };

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await prisma.profile.findUnique({
    where: { slug },
    include: {
      secondaryProfiles: { select: { slug: true, name: true, headline: true } },
      parentProfile: { select: { slug: true, name: true, headline: true } },
    },
  });

  if (!profile) notFound();

  // Log the scan — fire-and-forget so a DB hiccup never breaks the page load
  const reqHeaders = await headers();
  prisma.scan
    .create({
      data: {
        profileId: profile.id,
        userAgent: reqHeaders.get("user-agent") ?? undefined,
      },
    })
    .catch(() => {});

  const links: Link[] = profile.links ? JSON.parse(profile.links) : [];

  return (
    <main className="min-h-screen bg-[#0f0f1a] text-white flex flex-col items-center px-4 py-10">
      {/* Welcome banner */}
      <div className="w-full max-w-lg mb-8 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl px-6 py-4 text-center">
        <p className="text-2xl mb-1">👋</p>
        <p className="text-indigo-200 font-medium">Nice to meet you!</p>
        <p className="text-white/50 text-sm mt-1">Great to connect — here's {profile.name.split(" ")[0]}'s profile.</p>
      </div>

      <div className="w-full max-w-lg flex flex-col gap-6">
        {/* Profile header */}
        <div className="flex items-center gap-4">
          {profile.headshotUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.headshotUrl}
              alt={profile.name}
              className="w-20 h-20 rounded-full object-cover border-2 border-indigo-500/50 flex-shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-indigo-800/60 flex items-center justify-center text-3xl font-bold text-indigo-300 flex-shrink-0">
              {profile.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{profile.name}</h1>
            {profile.headline && (
              <p className="text-white/60 text-sm mt-0.5">{profile.headline}</p>
            )}
          </div>
        </div>

        {/* Contact info */}
        {(profile.email || profile.phone) && (
          <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 flex flex-col gap-2">
            {profile.email && (
              <a href={`mailto:${profile.email}`} className="flex items-center gap-2 text-sm text-indigo-300 hover:text-indigo-200 transition-colors">
                <span>✉️</span> {profile.email}
              </a>
            )}
            {profile.phone && (
              <a href={`tel:${profile.phone}`} className="flex items-center gap-2 text-sm text-indigo-300 hover:text-indigo-200 transition-colors">
                <span>📞</span> {profile.phone}
              </a>
            )}
          </div>
        )}

        {/* About */}
        {profile.about && (
          <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">About</p>
            <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">{profile.about}</p>
          </div>
        )}

        {/* Links */}
        {(profile.linkedinUrl || profile.githubUrl || links.length > 0) && (
          <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 flex flex-col gap-2">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1">Links</p>
            {profile.linkedinUrl && (
              <LinkRow href={profile.linkedinUrl} emoji="🔗" label="LinkedIn" />
            )}
            {profile.githubUrl && (
              <LinkRow href={profile.githubUrl} emoji="🐙" label="GitHub" />
            )}
            {links.map((l, i) => (
              <LinkRow key={i} href={l.url} emoji="🌐" label={l.label || l.url} />
            ))}
          </div>
        )}

        {/* Business card */}
        {profile.pdfUrl && (
          <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-5">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">Business card</p>
            <BusinessCardClient pdfUrl={profile.pdfUrl} />
          </div>
        )}

        {/* Connect CTA — inline form so visitors sign up without a second page load */}
        <div className="bg-white/5 border border-indigo-500/30 rounded-2xl px-5 py-6">
          <p className="text-xs font-semibold text-indigo-300/70 uppercase tracking-wider mb-1">
            Let&apos;s connect
          </p>
          <p className="text-sm text-white/50 mb-5">
            Share your details so {profile.name.split(" ")[0]} can follow up.
          </p>
          <ConnectForm profileId={profile.id} profileName={profile.name.split(" ")[0]} dark />
        </div>

        {/* Linked cards — shown when this person has two careers */}
        {(profile.secondaryProfiles.length > 0 || profile.parentProfile) && (
          <div className="bg-white/5 border border-purple-500/20 rounded-2xl px-5 py-4">
            <p className="text-xs font-semibold text-purple-300/70 uppercase tracking-wider mb-3">
              Also see my other card
            </p>
            <div className="flex flex-col gap-2">
              {/* If this is a primary, show its secondary cards */}
              {profile.secondaryProfiles.map((s) => (
                <a
                  key={s.slug}
                  href={`/p/${s.slug}`}
                  className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-3 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white group-hover:text-indigo-200 transition-colors truncate">{s.name}</p>
                    {s.headline && <p className="text-xs text-white/40 truncate">{s.headline}</p>}
                  </div>
                  <span className="text-white/30 group-hover:text-indigo-400 transition-colors text-xs shrink-0">View →</span>
                </a>
              ))}
              {/* If this is a secondary, show the parent card */}
              {profile.parentProfile && (
                <a
                  href={`/p/${profile.parentProfile.slug}`}
                  className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-3 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white group-hover:text-indigo-200 transition-colors truncate">{profile.parentProfile.name}</p>
                    {profile.parentProfile.headline && <p className="text-xs text-white/40 truncate">{profile.parentProfile.headline}</p>}
                  </div>
                  <span className="text-white/30 group-hover:text-indigo-400 transition-colors text-xs shrink-0">View →</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function LinkRow({ href, emoji, label }: { href: string; emoji: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-sm text-indigo-300 hover:text-indigo-200 transition-colors truncate"
    >
      <span>{emoji}</span>
      <span className="truncate">{label}</span>
    </a>
  );
}
