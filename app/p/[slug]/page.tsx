// Public profile page — the destination when someone scans a QR code.
// WHY: This page is intentionally public (no auth) so anyone with the QR link can view it.
// EFFECT: Renders the chosen card template + palette via <ProfileCard>, wrapped in the
//         scroll-reveal greeting. Also logs a Scan record on every visit.

import { notFound } from "next/navigation";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { prisma } from "@/lib/db";
import { getAppUrl } from "@/lib/app-url";
import ScanIntro from "@/components/ScanIntro";
import ProfileCard from "@/components/ProfileCard";

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

  // QR for the digital flip-card back — encodes this profile's public URL.
  const appUrl = await getAppUrl();
  const qrDataUrl = await QRCode.toDataURL(`${appUrl}/p/${profile.slug}`, {
    width: 240,
    margin: 1,
    color: { dark: "#0f172a", light: "#ffffff" },
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f0faf5] via-[#f6fbf8] to-[#eef7f1] text-slate-900 flex flex-col items-center px-4 py-8 sm:py-12">
      <ScanIntro firstName={firstName}>
        <ProfileCard
          template={profile.template}
          colorScheme={profile.colorScheme}
          profile={{
            id: profile.id,
            slug: profile.slug,
            name: profile.name,
            headline: profile.headline,
            headshotUrl: profile.headshotUrl,
            phone: profile.phone,
            email: profile.email,
            linkedinUrl: profile.linkedinUrl,
            githubUrl: profile.githubUrl,
            pdfUrl: profile.pdfUrl,
            about: profile.about,
          }}
          links={links}
          firstName={firstName}
          otherCards={otherCards}
          qrDataUrl={qrDataUrl}
        />
      </ScanIntro>
    </main>
  );
}
