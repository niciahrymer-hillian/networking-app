"use client";
// DigitalCard — a generated, 3D-flipping digital business card built from the
// profile's own data + palette (Phase D). Front = compact card (photo, name,
// headline, contact); back = QR to the public profile. Shown when the user
// hasn't uploaded a PDF business card, so every profile has a shareable flip card.

import { useState } from "react";

interface Props {
  name: string;
  headline: string | null;
  headshotUrl: string | null;
  email: string | null;
  phone: string | null;
  accent: string;
  bandFrom: string;
  bandTo: string;
  soft: string;
  onSoft: string;
  qrDataUrl?: string; // server-generated; absent in the editor preview
}

const face =
  "absolute inset-0 rounded-2xl overflow-hidden shadow-lg ring-1 ring-black/10 [backface-visibility:hidden]";

export default function DigitalCard({
  name, headline, headshotUrl, email, phone, accent, bandFrom, bandTo, soft, onSoft, qrDataUrl,
}: Props) {
  const [flipped, setFlipped] = useState(false);
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="[perspective:1400px] w-full max-w-[320px]">
        <div
          className="relative aspect-[1.7] cursor-pointer select-none transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] [transform-style:preserve-3d]"
          style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
          onClick={() => setFlipped((f) => !f)}
          title="Click to flip"
        >
          {/* FRONT */}
          <div className={`${face} bg-white flex flex-col`}>
            <div className="h-2" style={{ background: `linear-gradient(to right, ${bandFrom}, ${bandTo})` }} />
            <div className="flex-1 px-4 py-3 flex items-center gap-3">
              {headshotUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={headshotUrl} alt={name} className="w-14 h-14 rounded-full object-cover ring-2 ring-white shadow shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold shrink-0" style={{ background: soft, color: onSoft }}>
                  {initial}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-bold text-slate-900 truncate">{name}</p>
                {headline && <p className="text-xs text-slate-500 truncate">{headline}</p>}
                <div className="mt-1 space-y-0.5">
                  {email && <p className="text-[11px] text-slate-500 truncate">✉️ {email}</p>}
                  {phone && <p className="text-[11px] text-slate-500 truncate">📞 {phone}</p>}
                </div>
              </div>
            </div>
            <div className="px-4 pb-2 text-[10px] font-medium uppercase tracking-wider" style={{ color: accent }}>
              Tap to flip ⟳
            </div>
          </div>

          {/* BACK */}
          <div
            className={`${face} [transform:rotateY(180deg)] flex flex-col items-center justify-center gap-2 p-4`}
            style={{ background: `linear-gradient(135deg, ${bandFrom}, ${bandTo})` }}
          >
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="QR code" className="w-24 h-24 rounded-lg bg-white p-1.5" />
            ) : (
              <div className="w-24 h-24 rounded-lg bg-white/85 flex items-center justify-center text-xs text-slate-400">
                QR code
              </div>
            )}
            <p className="text-white text-sm font-semibold">Scan to connect</p>
            <p className="text-white/85 text-[11px] truncate max-w-full">{name}</p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
      >
        {flipped ? "← Show front" : "Flip to QR ⟳"}
      </button>
    </div>
  );
}
