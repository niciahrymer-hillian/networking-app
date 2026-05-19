"use client";
// Share button — shows a QR code modal for a profile's public URL.
// WHY: Lets the profile owner pull up their QR instantly from the dashboard
//      without navigating to the edit page.

import { useState } from "react";
import dynamic from "next/dynamic";

// QRCodeDisplay uses canvas — load client-side only
const QRCodeDisplay = dynamic(() => import("./QRCodeDisplay"), { ssr: false });

interface Props {
  slug: string;
  name: string;
  appUrl?: string;
}

export default function ShareQRButton({ slug, name, appUrl }: Props) {
  const [open, setOpen] = useState(false);

  const baseUrl = appUrl || (typeof window !== "undefined" ? window.location.origin : "");
  const url = `${baseUrl}/p/${slug}`;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
      >
        Share QR
      </button>

      {open && (
        // Backdrop
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => setOpen(false)}
        >
          {/* Modal — stop click propagation so clicking inside doesn't close it */}
          <div
            className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-4 w-full max-w-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold text-white">{name}</h2>
            <QRCodeDisplay url={url} profileName={name} />
            <p className="text-xs text-white/40 text-center break-all">{url}</p>
            <button
              onClick={() => setOpen(false)}
              className="text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
