// GET /p/[slug]/vcard — returns the profile as a downloadable vCard (.vcf).
// WHY: This is the Blinq-style "Save to Contacts" action. Tapping it on a phone
//      opens the OS "Add Contact" sheet, so the scanner saves the person in one tap.
// EFFECT: Public (the /p/ prefix is whitelisted in proxy.ts). No DB writes.

import { prisma } from "@/lib/db";

// Escape per RFC 6350: backslash, comma, semicolon, and newlines.
function esc(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\n/g, "\\n");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const profile = await prisma.profile.findUnique({ where: { slug } });

  if (!profile) {
    return new Response("Not found", { status: 404 });
  }

  // Split the full name into family/given for the structured N field.
  const parts = profile.name.trim().split(/\s+/);
  const given = parts.shift() ?? "";
  const family = parts.join(" ");

  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${esc(family)};${esc(given)};;;`,
    `FN:${esc(profile.name)}`,
  ];
  if (profile.headline) lines.push(`TITLE:${esc(profile.headline)}`);
  if (profile.email) lines.push(`EMAIL;TYPE=INTERNET:${esc(profile.email)}`);
  if (profile.phone) lines.push(`TEL;TYPE=CELL:${esc(profile.phone)}`);
  if (profile.linkedinUrl) lines.push(`URL:${esc(profile.linkedinUrl)}`);
  if (profile.githubUrl) lines.push(`URL:${esc(profile.githubUrl)}`);
  if (profile.about) lines.push(`NOTE:${esc(profile.about)}`);
  lines.push("END:VCARD");

  const vcf = lines.join("\r\n");
  const filename = `${profile.name.replace(/\s+/g, "-").toLowerCase()}.vcf`;

  return new Response(vcf, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
