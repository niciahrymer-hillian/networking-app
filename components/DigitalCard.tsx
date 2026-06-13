"use client";
// DigitalCard — the flippable digital business card. Front = one of many
// templates (see BUSINESS_TEMPLATES); back = QR to the public profile. The front
// is chosen in the editor (Profile.cardTemplate) or derived from the profile
// template. Aspect ratio 1.7 mirrors a real business card.

import { useState } from "react";
import type { BusinessVariant } from "@/lib/card-design";

interface Props {
  variant?: BusinessVariant;
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
  variant = "banded", name, headline, headshotUrl, email, phone, accent, bandFrom, bandTo, soft, onSoft, qrDataUrl,
}: Props) {
  const [flipped, setFlipped] = useState(false);
  const initial = name.charAt(0).toUpperCase();
  // Two-letter monogram: first + last word initial, else first two letters.
  const parts = name.trim().split(/\s+/);
  const initials = (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : name.slice(0, 2)).toUpperCase();

  const band = `linear-gradient(135deg, ${bandFrom}, ${bandTo})`;

  const avatarEl = (sizeCls: string, ring: string, fbBg: string, fbColor: string) =>
    headshotUrl ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={headshotUrl} alt={name} className={`${sizeCls} rounded-full object-cover shadow shrink-0 ${ring}`} />
    ) : (
      <div className={`${sizeCls} rounded-full flex items-center justify-center font-bold shrink-0 ${ring}`} style={{ background: fbBg, color: fbColor }}>
        {initial}
      </div>
    );

  const contact = (cls: string, align = "") =>
    (email || phone) ? (
      <div className={`mt-1 space-y-0.5 ${align}`}>
        {email && <p className={`text-[11px] truncate ${cls}`}>✉️ {email}</p>}
        {phone && <p className={`text-[11px] truncate ${cls}`}>📞 {phone}</p>}
      </div>
    ) : null;

  const flip = (color: string) => (
    <div className="px-4 pb-2 text-[10px] font-medium uppercase tracking-wider" style={{ color }}>Tap to flip ⟳</div>
  );

  const fronts: Record<BusinessVariant, React.ReactNode> = {
    banded: (
      <div className={`${face} bg-white flex flex-col`}>
        <div className="h-2" style={{ background: `linear-gradient(to right, ${bandFrom}, ${bandTo})` }} />
        <div className="flex-1 px-4 py-3 flex items-center gap-3">
          {avatarEl("w-14 h-14 text-xl", "ring-2 ring-white", soft, onSoft)}
          <div className="min-w-0">
            <p className="font-bold text-slate-900 truncate">{name}</p>
            {headline && <p className="text-xs text-slate-500 truncate">{headline}</p>}
            {contact("text-slate-500")}
          </div>
        </div>
        {flip(accent)}
      </div>
    ),
    filled: (
      <div className={`${face} flex flex-col`} style={{ background: band }}>
        <div className="flex-1 px-4 py-3 flex items-center gap-3">
          {avatarEl("w-14 h-14 text-xl", "ring-2 ring-white/70", "rgba(255,255,255,0.2)", "#fff")}
          <div className="min-w-0 text-white">
            <p className="font-bold truncate">{name}</p>
            {headline && <p className="text-xs text-white/85 truncate">{headline}</p>}
            {contact("text-white/85")}
          </div>
        </div>
        <div className="px-4 pb-2 text-[10px] font-medium uppercase tracking-wider text-white/80">Tap to flip ⟳</div>
      </div>
    ),
    outline: (
      <div className={`${face} bg-white flex`} style={{ boxShadow: "none", border: `1.5px solid ${accent}` }}>
        <div className="w-1 self-stretch" style={{ background: accent }} />
        <div className="flex flex-1 flex-col">
          <div className="flex-1 px-4 py-3 flex items-center gap-3">
            {avatarEl("w-14 h-14 text-xl", "ring-1 ring-black/10", soft, onSoft)}
            <div className="min-w-0">
              <p className="font-bold truncate" style={{ color: accent }}>{name}</p>
              {headline && <p className="text-xs text-slate-500 truncate">{headline}</p>}
              {contact("text-slate-500")}
            </div>
          </div>
          {flip(accent)}
        </div>
      </div>
    ),
    split: (
      <div className={`${face} bg-white flex`}>
        <div className="w-2/5 flex items-center justify-center p-3" style={{ background: `linear-gradient(160deg, ${bandFrom}, ${bandTo})` }}>
          {avatarEl("w-14 h-14 text-xl", "ring-2 ring-white/80", "rgba(255,255,255,0.2)", "#fff")}
        </div>
        <div className="flex-1 min-w-0 px-4 py-3 flex flex-col justify-center">
          <p className="font-bold text-slate-900 truncate">{name}</p>
          {headline && <p className="text-xs text-slate-500 truncate">{headline}</p>}
          {contact("text-slate-500")}
          <p className="mt-1.5 text-[10px] font-medium uppercase tracking-wider" style={{ color: accent }}>Tap to flip ⟳</p>
        </div>
      </div>
    ),
    mono: (
      <div className={`${face} bg-white flex flex-col justify-center px-5 py-4`}>
        <p className="font-bold text-lg text-slate-900 truncate">{name}</p>
        <div className="my-1.5 h-0.5 w-10 rounded-full" style={{ background: accent }} />
        {headline && <p className="text-xs text-slate-500 truncate">{headline}</p>}
        {contact("text-slate-500")}
        <p className="mt-2 text-[10px] font-medium uppercase tracking-wider" style={{ color: accent }}>Tap to flip ⟳</p>
      </div>
    ),
    monogram: (
      <div className={`${face} bg-white flex items-center gap-3 px-4`}>
        <div className="flex items-center justify-center w-16 h-16 rounded-full shrink-0 text-2xl font-bold" style={{ background: soft, color: onSoft }}>
          {initials}
        </div>
        <div className="h-12 w-px shrink-0" style={{ background: accent, opacity: 0.45 }} />
        <div className="min-w-0">
          <p className="font-bold text-slate-900 truncate">{name}</p>
          {headline && <p className="text-xs text-slate-500 truncate">{headline}</p>}
          {contact("text-slate-500")}
        </div>
      </div>
    ),
    duo: (
      <div className={`${face} bg-white flex flex-col`}>
        <div className="px-4 py-3 flex items-center gap-2.5" style={{ background: band }}>
          {avatarEl("w-10 h-10 text-sm", "ring-2 ring-white/70", "rgba(255,255,255,0.2)", "#fff")}
          <div className="min-w-0 text-white">
            <p className="font-bold text-sm truncate">{name}</p>
            {headline && <p className="text-[11px] text-white/85 truncate">{headline}</p>}
          </div>
        </div>
        <div className="flex-1 px-4 py-2 flex flex-col justify-center">
          {contact("text-slate-500")}
          <p className="mt-1 text-[10px] font-medium uppercase tracking-wider" style={{ color: accent }}>Tap to flip ⟳</p>
        </div>
      </div>
    ),
    framed: (
      <div className={`${face} bg-white p-2.5`}>
        <div className="h-full rounded-xl flex flex-col items-center justify-center text-center px-3" style={{ border: `1.5px solid ${accent}` }}>
          <p className="text-xs uppercase tracking-[0.25em] font-semibold text-slate-900 truncate max-w-full">{name}</p>
          <div className="my-1.5 h-px w-10" style={{ background: accent }} />
          {headline && <p className="text-[10px] uppercase tracking-widest text-slate-500 truncate max-w-full">{headline}</p>}
          {contact("text-slate-500")}
        </div>
      </div>
    ),
    corner: (
      <div className={`${face} bg-white flex flex-col justify-center px-4`}>
        <div className="absolute -top-8 -left-8 h-20 w-20 rotate-45" style={{ background: band }} />
        <div className="absolute -bottom-8 -right-8 h-16 w-16 rotate-45 opacity-10" style={{ background: accent }} />
        <div className="relative">
          <p className="font-bold text-slate-900 truncate">{name}</p>
          {headline && <p className="text-xs text-slate-500 truncate">{headline}</p>}
          {contact("text-slate-500")}
        </div>
      </div>
    ),
    wave: (
      <div className={`${face} bg-white flex items-center`}>
        <div className="self-stretch w-2/5 flex items-center justify-center rounded-r-[2.5rem]" style={{ background: `linear-gradient(160deg, ${bandFrom}, ${bandTo})` }}>
          {avatarEl("w-12 h-12 text-lg", "ring-2 ring-white/80", "rgba(255,255,255,0.2)", "#fff")}
        </div>
        <div className="flex-1 min-w-0 px-4">
          <p className="font-bold text-slate-900 truncate">{name}</p>
          {headline && <p className="text-xs text-slate-500 truncate">{headline}</p>}
          {contact("text-slate-500")}
        </div>
      </div>
    ),
    initials: (
      <div className={`${face} bg-white flex flex-col items-center justify-center px-3`}>
        <div className="flex items-center gap-2">
          <span className="text-4xl font-bold text-slate-900">{initials[0]}</span>
          <span className="h-9 w-px" style={{ background: accent }} />
          <span className="text-4xl font-bold" style={{ color: accent }}>{initials[1] ?? ""}</span>
        </div>
        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-600 truncate max-w-full">{name}</p>
        {headline && <p className="text-[10px] text-slate-400 truncate max-w-full">{headline}</p>}
      </div>
    ),
    corporate: (
      <div className={`${face} bg-white flex flex-col`}>
        <div className="h-1.5" style={{ background: accent }} />
        <div className="flex-1 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {avatarEl("w-12 h-12 text-lg", "ring-1 ring-black/10", soft, onSoft)}
            <div className="min-w-0">
              <p className="font-bold text-slate-900 truncate">{name}</p>
              {headline && <p className="text-[11px] uppercase tracking-wide text-slate-500 truncate">{headline}</p>}
            </div>
          </div>
          {contact("text-slate-500", "text-right shrink-0 max-w-[52%]")}
        </div>
        {flip(accent)}
      </div>
    ),
    wordmark: (
      <div className={`${face} bg-white flex flex-col justify-center px-5 py-4`}>
        <p className="text-3xl font-extrabold uppercase tracking-tight leading-none text-slate-900 truncate">{name}</p>
        {headline && <p className="mt-2 text-[10px] uppercase tracking-widest truncate" style={{ color: accent }}>{headline}</p>}
        {contact("text-slate-500")}
      </div>
    ),
    portrait: (
      <div className={`${face} bg-white flex`}>
        <div className="w-2/5 self-stretch flex items-center justify-center p-2" style={{ background: `linear-gradient(160deg, ${bandFrom}, ${bandTo})` }}>
          {avatarEl("w-16 h-16 text-xl", "ring-2 ring-white/80", "rgba(255,255,255,0.2)", "#fff")}
        </div>
        <div className="flex-1 min-w-0 px-3 py-3 flex flex-col justify-center">
          <p className="font-bold truncate" style={{ color: accent }}>{name}</p>
          {headline && <p className="text-[11px] uppercase tracking-wide text-slate-500 truncate">{headline}</p>}
          {contact("text-slate-500")}
        </div>
      </div>
    ),
    elegant: (
      <div className={`${face} bg-white flex flex-col items-center justify-center text-center px-5`}>
        <div className="h-px w-12 mb-2" style={{ background: accent }} />
        <p className="text-base uppercase tracking-[0.2em] text-slate-900 truncate max-w-full" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>{name}</p>
        {headline && <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-slate-500 truncate max-w-full">{headline}</p>}
        <div className="h-px w-12 mt-2" style={{ background: accent }} />
        {contact("text-slate-500")}
      </div>
    ),
  };

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
          {fronts[variant] ?? fronts.banded}

          {/* BACK */}
          <div
            className={`${face} [transform:rotateY(180deg)] flex flex-col items-center justify-center gap-2 p-4`}
            style={{ background: band }}
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
