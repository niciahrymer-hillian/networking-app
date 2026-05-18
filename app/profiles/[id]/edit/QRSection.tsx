"use client";
// QR code section shown at the bottom of the edit page.
// Client component because QRCodeDisplay uses canvas (browser-only).

import QRCodeDisplay from "@/components/QRCodeDisplay";

export default function QRSection({ slug, name }: { slug: string; name: string }) {
  const appUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000";

  return <QRCodeDisplay url={`${appUrl}/p/${slug}`} profileName={name} />;
}
