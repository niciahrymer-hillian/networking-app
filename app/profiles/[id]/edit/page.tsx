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
    template: profile.template,
    colorScheme: profile.colorScheme,
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f0faf5] via-white to-[#eef7f1] text-slate-900">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <Link href="/dashboard" className="text-sm text-emerald-700 hover:text-emerald-600 transition-colors">
          ← Dashboard
        </Link>
        <h1 className="mt-4 mb-8 text-2xl font-bold tracking-tight">Edit — {profile.name}</h1>

        <ProfileForm initial={initial} />

        {/* QR + secondary-card settings, below the editor */}
        <div className="mt-8 max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-sm ring-1 ring-emerald-900/5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-600">Public profile link & QR code</p>
            <SetOwnerButton id={profile.id} isOwner={profile.isOwner} />
          </div>
          <p className="text-xs text-slate-500 font-mono bg-slate-50 ring-1 ring-slate-100 px-3 py-2 rounded-lg mb-4 break-all">
            {appUrl}/p/{profile.slug}
          </p>
          <QRSection slug={profile.slug} name={profile.name} appUrl={appUrl} />

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
