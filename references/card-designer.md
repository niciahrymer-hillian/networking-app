# Card Designer

How a profile's public card is themed, edited live, and turned into a shareable
flip card. Status: **A + B + D + 3D flip shipped.** (Phase C "more templates" and
an AI design assist are still backlog.)

## Data model
`Profile.template` and `Profile.colorScheme` (both `String`, defaults `classic` /
`emerald`). Defaults mean existing cards are unchanged and the Turso ALTER is safe
(same `@default` trick as Phase 2). Values are always coerced through
[`lib/card-design.ts`](../lib/card-design.ts) so a bad value can't break rendering.

## Config — `lib/card-design.ts`
- **`TEMPLATES`** (layouts): `classic` (cover band, centered photo), `minimal`
  (clean, left-aligned), `bold` (big color header), `split` (color panel beside details).
- **`PALETTES`**: `emerald` (default), `indigo`, `rose`, `amber`, `violet`, `slate` —
  each with `accent`, `accentHover`, `soft`, `onSoft`, `bandFrom`, `bandTo` hex values.
- **`getTemplate()` / `getColorScheme()`**: validate/coerce to a known value or the
  default. Used by the POST/PUT profile routes and the renderer. Tested in
  `tests/card-design.test.ts` + `tests/api-profiles-put.test.ts`.

## Rendering — `components/ProfileCard.tsx`
Single source of truth for the card's look. Renders the header per `template` and
applies the palette via **CSS custom properties** on the root (`--accent`,
`--band-from`, …) so colors are fully dynamic while hover still works through
`bg-[var(--accent-hover)]` arbitrary utilities (verified Tailwind generates them).
Used by both the public page (server-rendered) and the editor preview (client).
Props of note:
- `preview` — editor mode: renders the visual card but skips the interactive connect form.
- `qrDataUrl` — server-generated QR for the digital flip-card back (absent in preview).

## Live editor (Phase B) — `components/ProfileForm.tsx`
The edit/new pages are a 2-column layout: form controls on the left, a **sticky
live `ProfileCard` preview** on the right fed by the form's React state. Typing a
field, picking a template/palette, or finishing a headshot upload re-renders the
preview instantly — no save needed (Save just persists what's shown). On mobile the
preview stacks above the form. The pages (`app/profiles/new`, `app/profiles/[id]/edit`)
no longer wrap the form in a card — `ProfileForm` provides its own layout; the edit
page's QR + secondary-card settings sit in their own card below (`id="qr"`).

## Flip business card
- **Uploaded PDF** → `components/BusinessCard.tsx`: both pages render as the two faces
  of a card that does a smooth 3D `rotateY` flip (perspective + `preserve-3d` +
  `backface-visibility`). pdf.js worker loads from the unpkg CDN (candidate for
  local bundling later — see suggestions).
- **No PDF** → `components/DigitalCard.tsx` (Phase D): a generated 3D flip card built
  from the profile's own data + palette. Front = compact card (photo, name, headline,
  contact); back = the QR to the public profile + "Scan to connect." So every profile
  has a shareable flip card without uploading anything. The public page
  (`app/p/[slug]/page.tsx`) generates the QR server-side via `qrcode.toDataURL`.

## Still backlog
- **Phase C**: more templates/fonts.
- **AI assist**: generate a design from the user's info.
