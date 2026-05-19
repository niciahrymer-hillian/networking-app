"use client";
// QR code section shown at the bottom of the edit page.
// Client component because QRCodeDisplay uses canvas (browser-only).

import QRCodeDisplay from "@/components/QRCodeDisplay";

export default function QRSection({ slug, name, appUrl }: { slug: string; name: string; appUrl: string }) {
  return <QRCodeDisplay url={`${appUrl}/p/${slug}`} profileName={name} actionLabel="Regenerate fresh QR code" />;
}
