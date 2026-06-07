// ProfileCard — renders the public profile card from a chosen template (layout)
// + color palette. Single source of truth for the card's look, so the public
// page AND the future live editor preview render the exact same thing.
//
// Colors are applied via CSS custom properties on the root element, so the
// palette is fully dynamic (no Tailwind safelist needed) while still supporting
// hover states through `bg-[var(--accent-hover)]` arbitrary utilities.

import type { CSSProperties } from "react";
import BusinessCardClient from "@/components/BusinessCardClient";
import DigitalCard from "@/components/DigitalCard";
import ConnectForm from "@/app/p/[slug]/connect/ConnectForm";
import { getPalette, getTemplate, getFont, FONTS, type Template, type ColorScheme, type Font } from "@/lib/card-design";

type Link = { label: string; url: string };
type OtherCard = { slug: string; name: string; headline: string | null };

interface Props {
  template: Template | string;
  colorScheme: ColorScheme | string;
  font?: Font | string;
  profile: {
    id: string;
    slug: string;
    name: string;
    headline: string | null;
    headshotUrl: string | null;
    phone: string | null;
    email: string | null;
    linkedinUrl: string | null;
    githubUrl: string | null;
    pdfUrl: string | null;
    about: string | null;
  };
  links: Link[];
  firstName: string;
  otherCards: OtherCard[];
  preview?: boolean; // live-editor preview: render the visual card without the interactive connect form
  qrDataUrl?: string; // server-generated QR for the digital flip-card back
  ownerUserId?: string | null; // card owner's account (for network connect)
  viewerLoggedIn?: boolean;
  viewerIsOwner?: boolean;
}

export default function ProfileCard({ template, colorScheme, font, profile, links, firstName, otherCards, preview, qrDataUrl, ownerUserId, viewerLoggedIn, viewerIsOwner }: Props) {
  const t = getTemplate(template);
  const p = getPalette(colorScheme);

  // CSS vars consumed by the arbitrary utilities below; fontFamily themes the card.
  const vars = {
    "--accent": p.accent,
    "--accent-hover": p.accentHover,
    "--soft": p.soft,
    "--on-soft": p.onSoft,
    "--band-from": p.bandFrom,
    "--band-to": p.bandTo,
    fontFamily: FONTS[getFont(font)].css,
  } as CSSProperties;

  const initial = profile.name.charAt(0).toUpperCase();
  const hasActions = profile.phone || profile.email || profile.linkedinUrl || profile.githubUrl || links[0];

  const saveBtn = (extra = "") => (
    <a
      href={`/p/${profile.slug}/vcard`}
      download
      className={`inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:bg-[var(--accent-hover)] hover:shadow-md active:scale-[0.98] ${extra}`}
    >
      <span>＋</span> Save contact
    </a>
  );

  const actionGrid = hasActions ? (
    <div className="mt-3 grid grid-cols-2 gap-2 w-full">
      {profile.phone && <ActionButton href={`tel:${profile.phone}`} emoji="📞" label="Call" />}
      {profile.email && <ActionButton href={`mailto:${profile.email}`} emoji="✉️" label="Email" />}
      {profile.linkedinUrl && <ActionButton href={profile.linkedinUrl} emoji="🔗" label="LinkedIn" external />}
      {profile.githubUrl && <ActionButton href={profile.githubUrl} emoji="🐙" label="GitHub" external />}
      {links[0] && <ActionButton href={links[0].url} emoji="🌐" label={links[0].label || "Website"} external />}
    </div>
  ) : null;

  const avatar = (size: string, ring = "ring-4 ring-white") =>
    profile.headshotUrl ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={profile.headshotUrl} alt={profile.name} className={`${size} rounded-full object-cover ${ring} shadow-md bg-white`} />
    ) : (
      <div
        className={`${size} rounded-full ${ring} shadow-md flex items-center justify-center text-3xl font-bold`}
        style={{ backgroundColor: p.soft, color: p.onSoft }}
      >
        {initial}
      </div>
    );

  return (
    <div className="w-full max-w-md flex flex-col gap-5" style={vars}>
      {/* === Header (varies by template) === */}
      <section className="animate-fade-up rounded-3xl bg-white shadow-xl shadow-black/5 ring-1 ring-black/5 overflow-hidden">
        {t === "classic" && (
          <>
            <div className="h-28 bg-[linear-gradient(to_right,var(--band-from),var(--band-to))]" />
            <div className="px-6 pb-6 -mt-12 flex flex-col items-center text-center">
              {avatar("w-24 h-24")}
              <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{profile.name}</h1>
              {profile.headline && <p className="mt-1 text-sm text-slate-500 leading-snug">{profile.headline}</p>}
              {saveBtn("mt-5 w-full")}
              {actionGrid}
            </div>
          </>
        )}

        {t === "minimal" && (
          <div className="px-6 py-7">
            <div className="flex items-center gap-4">
              {avatar("w-16 h-16", "ring-1 ring-black/10")}
              <div className="min-w-0">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 truncate">{profile.name}</h1>
                {profile.headline && <p className="text-sm text-slate-500 leading-snug">{profile.headline}</p>}
              </div>
            </div>
            {saveBtn("mt-5 w-full")}
            {actionGrid}
          </div>
        )}

        {t === "bold" && (
          <>
            <div className="px-6 pt-10 pb-8 text-center bg-[linear-gradient(135deg,var(--band-from),var(--band-to))]">
              {avatar("w-24 h-24 mx-auto")}
              <h1 className="mt-3 text-2xl font-bold tracking-tight text-white">{profile.name}</h1>
              {profile.headline && <p className="mt-1 text-sm text-white/85 leading-snug">{profile.headline}</p>}
            </div>
            <div className="px-6 pb-6 pt-5 flex flex-col items-center">
              {saveBtn("w-full")}
              {actionGrid}
            </div>
          </>
        )}

        {t === "split" && (
          <div className="flex flex-col sm:flex-row">
            <div className="sm:w-2/5 px-5 py-7 flex flex-col items-center justify-center text-center bg-[linear-gradient(160deg,var(--band-from),var(--band-to))]">
              {avatar("w-20 h-20")}
            </div>
            <div className="flex-1 px-6 py-6 flex flex-col">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">{profile.name}</h1>
              {profile.headline && <p className="mt-1 text-sm text-slate-500 leading-snug">{profile.headline}</p>}
              {saveBtn("mt-4 w-full")}
              {actionGrid}
            </div>
          </div>
        )}
      </section>

      {/* === Shared body sections === */}
      {profile.about && (
        <Section delay="80ms" label="About">
          <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{profile.about}</p>
        </Section>
      )}

      {links.length > 1 && (
        <Section delay="120ms" label="More links">
          <div className="flex flex-col gap-2">
            {links.slice(1).map((l, i) => (
              <a
                key={i}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-[var(--accent)] hover:opacity-80 transition-opacity truncate"
              >
                <span>🌐</span>
                <span className="truncate">{l.label || l.url}</span>
              </a>
            ))}
          </div>
        </Section>
      )}

      <Section delay="160ms" label={profile.pdfUrl ? "Business card" : "My card"}>
        {profile.pdfUrl ? (
          <BusinessCardClient pdfUrl={profile.pdfUrl} />
        ) : (
          <DigitalCard
            name={profile.name}
            headline={profile.headline}
            headshotUrl={profile.headshotUrl}
            email={profile.email}
            phone={profile.phone}
            accent={p.accent}
            bandFrom={p.bandFrom}
            bandTo={p.bandTo}
            soft={p.soft}
            onSoft={p.onSoft}
            qrDataUrl={qrDataUrl}
          />
        )}
      </Section>

      <Section delay="200ms" label="Let's connect">
        {preview ? (
          <p className="text-xs text-slate-400 italic">Visitors connect with you here.</p>
        ) : (
          <ConnectForm
            profileId={profile.id}
            profileName={firstName}
            ownerUserId={ownerUserId ?? null}
            viewerLoggedIn={viewerLoggedIn}
            viewerIsOwner={viewerIsOwner}
          />
        )}
      </Section>

      {otherCards.length > 0 && (
        <Section delay="240ms" label="Also see my other card">
          <div className="flex flex-col gap-2">
            {otherCards.map((c) => (
              <a
                key={c.slug}
                href={`/p/${c.slug}`}
                className="flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors hover:brightness-95 group"
                style={{ borderColor: p.soft, backgroundColor: p.soft }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{c.name}</p>
                  {c.headline && <p className="text-xs text-slate-500 truncate">{c.headline}</p>}
                </div>
                <span className="text-[var(--accent)] text-xs shrink-0 transition-transform group-hover:translate-x-0.5">View →</span>
              </a>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ label, delay, children }: { label: string; delay: string; children: React.ReactNode }) {
  return (
    <section
      className="animate-fade-up rounded-3xl bg-white shadow-sm ring-1 ring-black/5 px-6 py-5"
      style={{ animationDelay: delay }}
    >
      <p className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-2 opacity-80">{label}</p>
      {children}
    </section>
  );
}

function ActionButton({ href, emoji, label, external }: { href: string; emoji: string; label: string; external?: boolean }) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="inline-flex items-center justify-center gap-1.5 rounded-2xl border bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition-all duration-300 hover:brightness-95 active:scale-[0.98]"
      style={{ borderColor: "color-mix(in srgb, var(--accent) 25%, white)" }}
    >
      <span>{emoji}</span>
      <span className="truncate">{label}</span>
    </a>
  );
}
