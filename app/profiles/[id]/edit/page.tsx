// Edit profile page — fetches the existing profile and pre-populates the form.

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import ProfileForm, { ProfileFormData } from "@/components/ProfileForm";
import QRSection from "./QRSection";
import { getAppUrl } from "@/lib/app-url";
import SetOwnerButton from "./SetOwnerButton";
import SetSecondaryButton from "./SetSecondaryButton";

export default async function EditProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth();
  if (!session?.userId) notFound();

  const { id } = await params;
  const profile = await prisma.profile.findFirst({ where: { id, userId: session.userId } });

  if (!profile) notFound();

  const appUrl = await getAppUrl();

  // Fetch other profiles to populate the secondary-card link dropdown
  const otherProfiles = await prisma.profile.findMany({
    where: { id: { not: id }, userId: session.userId },
    select: { id: true, name: true, headline: true },
    orderBy: { createdAt: "desc" },
  });

  // If this profile already has a parent, fetch the parent's name for display
  const parentProfile = profile.parentProfileId
    ? await prisma.profile.findFirst({
        where: { id: profile.parentProfileId, userId: session.userId },
        select: { name: true },
      })
    : null;

  // Parse the JSON links string back into an array before passing to the form
  const initial: ProfileFormData = {
    id: profile.id,
    name: profile.name,
    email: profile.email ?? "",
    phone: profile.phone ?? "",
    headline: profile.headline ?? "",
    about: profile.about ?? "",
    headshotUrl: profile.headshotUrl ?? "",
    pdfUrl: profile.pdfUrl ?? "",
    linkedinUrl: profile.linkedinUrl ?? "",
    githubUrl: profile.githubUrl ?? "",
    links: profile.links ? JSON.parse(profile.links) : [],
  };

  return (
    <main className="min-h-screen bg-[#0f0f1a] text-white">
      <header className="border-b border-white/10 px-4 py-4 max-w-2xl mx-auto flex items-center gap-3">
        <Link href="/" className="text-white/40 hover:text-white/70 transition-colors text-sm">
          ← Dashboard
        </Link>
        <span className="text-white/20">/</span>
        <h1 className="text-lg font-semibold">Edit — {profile.name}</h1>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <ProfileForm initial={initial} />

        {/* QR code preview for the public link */}
        <div className="mt-10 pt-8 border-t border-white/10">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-white/60">Public profile link & QR code</p>
            <SetOwnerButton id={profile.id} isOwner={profile.isOwner} />
          </div>
          <p className="text-xs text-white/40 font-mono bg-white/5 px-3 py-2 rounded-lg mb-4 break-all">
            {appUrl}/p/{profile.slug}
          </p>
          <QRSection slug={profile.slug} name={profile.name} appUrl={appUrl} />
        </div>

        {/* Link this profile as a secondary card of another (two-career support) */}
        <SetSecondaryButton
          id={profile.id}
          parentProfileId={profile.parentProfileId ?? null}
          parentName={parentProfile?.name ?? null}
          otherProfiles={otherProfiles}
        />
      </div>
    </main>
  );
}
