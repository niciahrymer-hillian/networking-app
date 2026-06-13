"use client";
// DigitalCard — the flippable digital business card. Front = one of many
// templates (see BUSINESS_TEMPLATES); back = QR to the public profile. Aspect
// ratio 1.7 mirrors a real business card.
//
// Text fit: names/headlines wrap up to two lines (line-clamp) and break long
// words; emails wrap on any character; blocks are sized to fill the card rather
// than leave dead space — so fields use the room they have instead of truncating.

import { useState } from "react";
import type { BusinessVariant } from "@/lib/card-design";

interface Props {
  variant?: BusinessVariant;
  name: string;
  headline: string | null;
  headshotUrl: string | null;
  email: string | null;
  phone: string | null;
  linkedin?: string | null;
  github?: string | null;
  website?: string | null;
  accent: string;
  bandFrom: string;
  bandTo: string;
  soft: string;
  onSoft: string;
  qrDataUrl?: string; // server-generated; absent in the editor preview
}

const face =
  "absolute inset-0 rounded-2xl overflow-hidden shadow-lg ring-1 ring-black/10 [backface-visibility:hidden]";

// Shared fit-friendly text classes.
const NAME = "font-bold leading-tight break-words [overflow-wrap:anywhere] line-clamp-2";
const HEAD = "leading-snug break-words line-clamp-2";

export default function DigitalCard({
  variant = "banded", name, headline, headshotUrl, email, phone, linkedin, github, website, accent, bandFrom, bandTo, soft, onSoft, qrDataUrl,
}: Props) {
  const [flipped, setFlipped] = useState(false);
  const initial = name.charAt(0).toUpperCase();
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

  // All available contact links — shown on the card (wrap, never truncated).
  const strip = (u: string) => u.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
  const links = [
    email && { icon: "✉️", text: email },
    phone && { icon: "📞", text: phone },
    linkedin && { icon: "in", text: strip(linkedin) },
    github && { icon: "gh", text: strip(github) },
    website && { icon: "🌐", text: strip(website) },
  ].filter(Boolean) as { icon: string; text: string }[];
  const contact = (cls: string, align = "") =>
    links.length ? (
      <div className={`mt-1.5 space-y-0.5 min-w-0 ${align}`}>
        {links.map((l, i) => (
          <p key={i} className={`flex items-baseline gap-1 text-[11px] leading-tight break-all ${cls} ${align.includes("center") ? "justify-center" : align.includes("right") ? "justify-end" : ""}`}>
            <span className="shrink-0 text-[9px] opacity-70">{l.icon}</span>
            <span className="break-all">{l.text}</span>
          </p>
        ))}
      </div>
    ) : null;

  const fronts: Record<BusinessVariant, React.ReactNode> = {
    banded: (
      <div className={`${face} bg-white flex flex-col`}>
        <div className="h-2 shrink-0" style={{ background: `linear-gradient(to right, ${bandFrom}, ${bandTo})` }} />
        <div className="flex-1 min-h-0 px-4 py-3 flex items-center gap-3">
          {avatarEl("w-16 h-16 text-2xl", "ring-2 ring-white", soft, onSoft)}
          <div className="min-w-0 flex-1">
            <p className={`text-lg text-slate-900 ${NAME}`}>{name}</p>
            {headline && <p className={`text-xs text-slate-500 ${HEAD}`}>{headline}</p>}
            {contact("text-slate-500")}
          </div>
        </div>
      </div>
    ),
    filled: (
      <div className={`${face} flex flex-col`} style={{ background: band }}>
        <div className="flex-1 min-h-0 px-4 py-3 flex items-center gap-3">
          {avatarEl("w-16 h-16 text-2xl", "ring-2 ring-white/70", "rgba(255,255,255,0.2)", "#fff")}
          <div className="min-w-0 flex-1 text-white">
            <p className={`text-lg ${NAME}`}>{name}</p>
            {headline && <p className={`text-xs text-white/85 ${HEAD}`}>{headline}</p>}
            {contact("text-white/85")}
          </div>
        </div>
      </div>
    ),
    outline: (
      <div className={`${face} bg-white flex`} style={{ boxShadow: "none", border: `1.5px solid ${accent}` }}>
        <div className="w-1 self-stretch shrink-0" style={{ background: accent }} />
        <div className="flex flex-1 min-w-0 flex-col">
          <div className="flex-1 min-h-0 px-4 py-3 flex items-center gap-3">
            {avatarEl("w-16 h-16 text-2xl", "ring-1 ring-black/10", soft, onSoft)}
            <div className="min-w-0 flex-1">
              <p className={`text-lg ${NAME}`} style={{ color: accent }}>{name}</p>
              {headline && <p className={`text-xs text-slate-500 ${HEAD}`}>{headline}</p>}
              {contact("text-slate-500")}
            </div>
          </div>
          </div>
      </div>
    ),
    split: (
      <div className={`${face} bg-white flex`}>
        <div className="w-2/5 shrink-0 flex items-center justify-center p-2" style={{ background: `linear-gradient(160deg, ${bandFrom}, ${bandTo})` }}>
          {avatarEl("w-16 h-16 text-2xl", "ring-2 ring-white/80", "rgba(255,255,255,0.2)", "#fff")}
        </div>
        <div className="flex-1 min-w-0 px-4 py-3 flex flex-col justify-center">
          <p className={`text-lg text-slate-900 ${NAME}`}>{name}</p>
          {headline && <p className={`text-xs text-slate-500 ${HEAD}`}>{headline}</p>}
          {contact("text-slate-500")}
        </div>
      </div>
    ),
    mono: (
      <div className={`${face} bg-white flex flex-col justify-center px-5 py-4`}>
        <p className={`text-xl text-slate-900 ${NAME}`}>{name}</p>
        <div className="my-2 h-0.5 w-10 rounded-full shrink-0" style={{ background: accent }} />
        {headline && <p className={`text-sm text-slate-500 ${HEAD}`}>{headline}</p>}
        {contact("text-slate-500")}
      </div>
    ),
    monogram: (
      <div className={`${face} bg-white flex items-center gap-3 px-4 py-3`}>
        <div className="flex items-center justify-center w-20 h-20 rounded-full shrink-0 text-3xl font-bold" style={{ background: soft, color: onSoft }}>
          {initials}
        </div>
        <div className="h-14 w-px shrink-0" style={{ background: accent, opacity: 0.45 }} />
        <div className="min-w-0 flex-1">
          <p className={`text-lg text-slate-900 ${NAME}`}>{name}</p>
          {headline && <p className={`text-xs text-slate-500 ${HEAD}`}>{headline}</p>}
          {contact("text-slate-500")}
        </div>
      </div>
    ),
    duo: (
      <div className={`${face} bg-white flex flex-col`}>
        <div className="shrink-0 px-4 py-3 flex items-center gap-3" style={{ background: band }}>
          {avatarEl("w-12 h-12 text-lg", "ring-2 ring-white/70", "rgba(255,255,255,0.2)", "#fff")}
          <div className="min-w-0 flex-1 text-white">
            <p className={`text-base ${NAME}`}>{name}</p>
            {headline && <p className={`text-[11px] text-white/85 ${HEAD}`}>{headline}</p>}
          </div>
        </div>
        <div className="flex-1 min-h-0 px-4 py-2.5 flex flex-col justify-center">
          {contact("text-slate-500")}
        </div>
      </div>
    ),
    framed: (
      <div className={`${face} bg-white p-2.5`}>
        <div className="h-full rounded-xl flex flex-col items-center justify-center text-center px-4 py-3 overflow-hidden" style={{ border: `1.5px solid ${accent}` }}>
          <p className="text-sm uppercase tracking-[0.2em] font-semibold text-slate-900 break-words [overflow-wrap:anywhere] line-clamp-2">{name}</p>
          <div className="my-1.5 h-px w-10 shrink-0" style={{ background: accent }} />
          {headline && <p className="text-[10px] uppercase tracking-widest text-slate-500 break-words line-clamp-2">{headline}</p>}
          {contact("text-slate-500", "text-center")}
        </div>
      </div>
    ),
    corner: (
      <div className={`${face} bg-white flex flex-col justify-center px-5`}>
        <div className="absolute -top-8 -left-8 h-20 w-20 rotate-45" style={{ background: band }} />
        <div className="absolute -bottom-8 -right-8 h-16 w-16 rotate-45 opacity-10" style={{ background: accent }} />
        <div className="relative min-w-0">
          <p className={`text-lg text-slate-900 ${NAME}`}>{name}</p>
          {headline && <p className={`text-xs text-slate-500 ${HEAD}`}>{headline}</p>}
          {contact("text-slate-500")}
        </div>
      </div>
    ),
    wave: (
      <div className={`${face} bg-white flex items-center`}>
        <div className="self-stretch w-2/5 shrink-0 flex items-center justify-center rounded-r-[2.5rem]" style={{ background: `linear-gradient(160deg, ${bandFrom}, ${bandTo})` }}>
          {avatarEl("w-14 h-14 text-xl", "ring-2 ring-white/80", "rgba(255,255,255,0.2)", "#fff")}
        </div>
        <div className="flex-1 min-w-0 px-4 py-3">
          <p className={`text-lg text-slate-900 ${NAME}`}>{name}</p>
          {headline && <p className={`text-xs text-slate-500 ${HEAD}`}>{headline}</p>}
          {contact("text-slate-500")}
        </div>
      </div>
    ),
    initials: (
      <div className={`${face} bg-white flex flex-col items-center justify-center text-center px-4 py-3`}>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-4xl font-bold text-slate-900">{initials[0]}</span>
          <span className="h-9 w-px" style={{ background: accent }} />
          <span className="text-4xl font-bold" style={{ color: accent }}>{initials[1] ?? ""}</span>
        </div>
        <p className="mt-2 text-sm uppercase tracking-[0.18em] text-slate-700 break-words [overflow-wrap:anywhere] line-clamp-2">{name}</p>
        {headline && <p className="text-[10px] text-slate-400 break-words line-clamp-2">{headline}</p>}
      </div>
    ),
    corporate: (
      <div className={`${face} bg-white flex flex-col`}>
        <div className="h-1.5 shrink-0" style={{ background: accent }} />
        <div className="flex-1 min-h-0 px-4 py-3 flex flex-col justify-center gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {avatarEl("w-12 h-12 text-lg", "ring-1 ring-black/10", soft, onSoft)}
            <div className="min-w-0 flex-1">
              <p className={`text-base text-slate-900 ${NAME}`}>{name}</p>
              {headline && <p className={`text-[11px] uppercase tracking-wide text-slate-500 ${HEAD}`}>{headline}</p>}
            </div>
          </div>
          {contact("text-slate-500")}
        </div>
      </div>
    ),
    wordmark: (
      <div className={`${face} bg-white flex flex-col justify-center px-5 py-4`}>
        <p className="text-2xl font-extrabold uppercase tracking-tight leading-none text-slate-900 break-words [overflow-wrap:anywhere] line-clamp-3">{name}</p>
        {headline && <p className="mt-2 text-[10px] uppercase tracking-widest break-words line-clamp-2" style={{ color: accent }}>{headline}</p>}
        {contact("text-slate-500")}
      </div>
    ),
    portrait: (
      <div className={`${face} bg-white flex`}>
        <div className="w-2/5 shrink-0 self-stretch flex items-center justify-center p-2" style={{ background: `linear-gradient(160deg, ${bandFrom}, ${bandTo})` }}>
          {avatarEl("w-16 h-16 text-2xl", "ring-2 ring-white/80", "rgba(255,255,255,0.2)", "#fff")}
        </div>
        <div className="flex-1 min-w-0 px-4 py-3 flex flex-col justify-center">
          <p className={`text-lg ${NAME}`} style={{ color: accent }}>{name}</p>
          {headline && <p className={`text-[11px] uppercase tracking-wide text-slate-500 ${HEAD}`}>{headline}</p>}
          {contact("text-slate-500")}
        </div>
      </div>
    ),
    elegant: (
      <div className={`${face} bg-white flex flex-col items-center justify-center text-center px-5 py-4`}>
        <div className="h-px w-12 mb-2 shrink-0" style={{ background: accent }} />
        <p className="text-base uppercase tracking-[0.18em] text-slate-900 break-words [overflow-wrap:anywhere] line-clamp-2" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>{name}</p>
        {headline && <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-slate-500 break-words line-clamp-2">{headline}</p>}
        <div className="h-px w-12 mt-2 shrink-0" style={{ background: accent }} />
        {contact("text-slate-500", "text-center")}
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
            <p className="text-white/85 text-[11px] break-words [overflow-wrap:anywhere] line-clamp-1 max-w-full">{name}</p>
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
