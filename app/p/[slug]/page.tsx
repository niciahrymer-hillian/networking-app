// Public profile page — the destination when someone scans a QR code.
// WHY: This page is intentionally public (no auth) so anyone with the QR link can view it.
// EFFECT: Blinq-style bright card. Shows the person's details with prominent action
//         buttons (Save Contact / Call / Email / socials), then a "connect back" form.
//         Also logs a Scan record on every visit so the owner can see total reach.

import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import BusinessCardClient from "@/components/BusinessCardClient";
import ScanIntro from "@/components/ScanIntro";
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
  const firstName = profile.name.split(" ")[0];
  const otherCards = [
    ...profile.secondaryProfiles,
    ...(profile.parentProfile ? [profile.parentProfile] : []),
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f0faf5] via-[#f6fbf8] to-[#eef7f1] text-slate-900 flex flex-col items-center px-4 py-8 sm:py-12">
      <ScanIntro firstName={firstName}>
      <div className="w-full max-w-md flex flex-col gap-5">
        {/* Card */}
        <section className="animate-fade-up rounded-3xl bg-white shadow-xl shadow-emerald-900/5 ring-1 ring-emerald-900/5 overflow-hidden">
          {/* Cover band */}
          <div className="h-28 bg-gradient-to-r from-emerald-500 to-teal-500" />

          <div className="px-6 pb-6 -mt-12 flex flex-col items-center text-center">
            {profile.headshotUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.headshotUrl}
                alt={profile.name}
                className="w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-md bg-white"
              />
            ) : (
              <div className="w-24 h-24 rounded-full ring-4 ring-white shadow-md bg-emerald-100 flex items-center justify-center text-3xl font-bold text-emerald-700">
                {profile.name.charAt(0).toUpperCase()}
              </div>
            )}

            <h1 className="mt-3 text-2xl font-bold tracking-tight">{profile.name}</h1>
            {profile.headline && (
              <p className="mt-1 text-sm text-slate-500 leading-snug">{profile.headline}</p>
            )}

            {/* Primary action — Save to Contacts (vCard) */}
            <a
              href={`/p/${profile.slug}/vcard`}
              download
              className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 transition-all duration-300 hover:bg-emerald-500 hover:shadow-md active:scale-[0.98]"
            >
              <span>＋</span> Save contact
            </a>

            {/* Secondary actions */}
            {(profile.phone || profile.email || profile.linkedinUrl || profile.githubUrl || links[0]) && (
              <div className="mt-3 grid grid-cols-2 gap-2 w-full">
                {profile.phone && <ActionButton href={`tel:${profile.phone}`} emoji="📞" label="Call" />}
                {profile.email && <ActionButton href={`mailto:${profile.email}`} emoji="✉️" label="Email" />}
                {profile.linkedinUrl && <ActionButton href={profile.linkedinUrl} emoji="🔗" label="LinkedIn" external />}
                {profile.githubUrl && <ActionButton href={profile.githubUrl} emoji="🐙" label="GitHub" external />}
                {links[0] && <ActionButton href={links[0].url} emoji="🌐" label={links[0].label || "Website"} external />}
              </div>
            )}
          </div>
        </section>

        {/* About */}
        {profile.about && (
          <section className="animate-fade-up [animation-delay:80ms] rounded-3xl bg-white shadow-sm ring-1 ring-emerald-900/5 px-6 py-5">
            <p className="text-xs font-semibold text-emerald-700/70 uppercase tracking-wider mb-2">About</p>
            <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{profile.about}</p>
          </section>
        )}

        {/* Extra links (beyond the first, which is in the action row) */}
        {links.length > 1 && (
          <section className="animate-fade-up [animation-delay:120ms] rounded-3xl bg-white shadow-sm ring-1 ring-emerald-900/5 px-6 py-5 flex flex-col gap-2">
            <p className="text-xs font-semibold text-emerald-700/70 uppercase tracking-wider mb-1">More links</p>
            {links.slice(1).map((l, i) => (
              <LinkRow key={i} href={l.url} label={l.label || l.url} />
            ))}
          </section>
        )}

        {/* Business card */}
        {profile.pdfUrl && (
          <section className="animate-fade-up [animation-delay:160ms] rounded-3xl bg-white shadow-sm ring-1 ring-emerald-900/5 px-6 py-5">
            <p className="text-xs font-semibold text-emerald-700/70 uppercase tracking-wider mb-4">Business card</p>
            <BusinessCardClient pdfUrl={profile.pdfUrl} />
          </section>
        )}

        {/* Connect back */}
        <section className="animate-fade-up [animation-delay:200ms] rounded-3xl bg-white shadow-sm ring-1 ring-emerald-900/5 px-6 py-6">
          <p className="text-xs font-semibold text-emerald-700/70 uppercase tracking-wider mb-1">Let&apos;s connect</p>
          <p className="text-sm text-slate-500 mb-5">
            Share your details so {firstName} can follow up.
          </p>
          <ConnectForm profileId={profile.id} profileName={firstName} />
        </section>

        {/* Other cards */}
        {otherCards.length > 0 && (
          <section className="animate-fade-up [animation-delay:240ms] rounded-3xl bg-white shadow-sm ring-1 ring-emerald-900/5 px-6 py-5">
            <p className="text-xs font-semibold text-emerald-700/70 uppercase tracking-wider mb-3">Also see my other card</p>
            <div className="flex flex-col gap-2">
              {otherCards.map((c) => (
                <a
                  key={c.slug}
                  href={`/p/${c.slug}`}
                  className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 px-4 py-3 transition-colors hover:bg-emerald-50 group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{c.name}</p>
                    {c.headline && <p className="text-xs text-slate-500 truncate">{c.headline}</p>}
                  </div>
                  <span className="text-emerald-600 text-xs shrink-0 transition-transform group-hover:translate-x-0.5">View →</span>
                </a>
              ))}
            </div>
          </section>
        )}

      </div>
      </ScanIntro>
    </main>
  );
}

function ActionButton({
  href,
  emoji,
  label,
  external,
}: {
  href: string;
  emoji: string;
  label: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-emerald-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition-all duration-300 hover:border-emerald-300 hover:bg-emerald-50 active:scale-[0.98]"
    >
      <span>{emoji}</span>
      <span className="truncate">{label}</span>
    </a>
  );
}

function LinkRow({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-sm text-emerald-700 hover:text-emerald-600 transition-colors truncate"
    >
      <span>🌐</span>
      <span className="truncate">{label}</span>
    </a>
  );
}
