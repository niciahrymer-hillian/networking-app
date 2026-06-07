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
import ShareToggle from "./ShareToggle";

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
    template: profile.template,
    colorScheme: profile.colorScheme,
    font: profile.font,
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f0faf5] via-white to-[#eef7f1] dark:from-[#0b1220] dark:via-[#0b1220] dark:to-[#0b1220] text-foreground">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <Link href="/dashboard" className="text-sm text-emerald-700 dark:text-emerald-300 hover:text-emerald-600 transition-colors">
          ← Dashboard
        </Link>
        <h1 className="mt-4 mb-8 text-2xl font-bold tracking-tight">Edit — {profile.name}</h1>

        <ProfileForm initial={initial} />

        {/* QR + secondary-card settings, below the editor */}
        <div id="qr" className="mt-8 max-w-2xl scroll-mt-24 rounded-3xl bg-surface p-6 sm:p-8 shadow-sm ring-1 ring-line">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-body">Public profile link & QR code</p>
            <SetOwnerButton id={profile.id} isOwner={profile.isOwner} />
          </div>
          <p className="text-xs text-muted font-mono bg-elevated ring-1 ring-line px-3 py-2 rounded-lg mb-4 break-all">
            {appUrl}/p/{profile.slug}
          </p>
          <QRSection slug={profile.slug} name={profile.name} appUrl={appUrl} />

          {/* Per-card privacy: allow network connections to share this QR */}
          <ShareToggle id={profile.id} allowed={profile.allowConnectionQrShare} />

          {/* Link this profile as a secondary card of another (two-career support) */}
          <SetSecondaryButton
            id={profile.id}
            parentProfileId={profile.parentProfileId ?? null}
            parentName={parentProfile?.name ?? null}
            otherProfiles={otherProfiles}
          />
        </div>
      </div>
    </main>
  );
}
