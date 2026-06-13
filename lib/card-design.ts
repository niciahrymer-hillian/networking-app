// Card designer config — the templates (layouts) and color palettes a profile
// card can use. Kept in one place so the public card, the (future) live editor,
// and validation all share the same source of truth.

export type Template =
  | "classic" | "minimal" | "bold" | "split" | "spotlight" | "sidebar"
  | "monogram" | "framed" | "corner" | "wave";
export type ColorScheme =
  | "emerald" | "indigo" | "rose" | "amber" | "violet" | "slate"
  | "sage" | "cream" | "executive" | "modern" | "creative" | "luxury"
  | "noir" | "blush" | "burgundy" | "mocha"
  | "marine" | "forest" | "taupe"
  | "teal" | "sky" | "plum" | "coral" | "lavender";
export type Font = "sans" | "serif" | "rounded" | "mono" | "elegant" | "slab" | "humanist";

// The flippable business card front style. Either picked explicitly
// (Profile.cardTemplate) or derived from the profile template as a default.
export type BusinessVariant =
  | "banded" | "filled" | "outline" | "split" | "mono"
  | "monogram" | "framed" | "corner" | "wave" | "duo"
  | "initials" | "corporate" | "wordmark" | "portrait" | "elegant";

export interface Palette {
  label: string;
  accent: string;     // primary buttons, links, accents
  accentHover: string;
  soft: string;       // tinted backgrounds (avatar fallback, section chips)
  bandFrom: string;   // cover-band gradient start
  bandTo: string;     // cover-band gradient end
  onSoft: string;     // text/icon color that reads on `soft`
}

export const PALETTES: Record<ColorScheme, Palette> = {
  emerald: { label: "Emerald", accent: "#059669", accentHover: "#10b981", soft: "#ecfdf5", bandFrom: "#10b981", bandTo: "#14b8a6", onSoft: "#047857" },
  indigo:  { label: "Indigo",  accent: "#4f46e5", accentHover: "#6366f1", soft: "#eef2ff", bandFrom: "#6366f1", bandTo: "#8b5cf6", onSoft: "#4338ca" },
  rose:    { label: "Rose",    accent: "#e11d48", accentHover: "#f43f5e", soft: "#fff1f2", bandFrom: "#f43f5e", bandTo: "#fb7185", onSoft: "#be123c" },
  amber:   { label: "Amber",   accent: "#d97706", accentHover: "#f59e0b", soft: "#fffbeb", bandFrom: "#f59e0b", bandTo: "#fbbf24", onSoft: "#b45309" },
  violet:  { label: "Violet",  accent: "#7c3aed", accentHover: "#8b5cf6", soft: "#f5f3ff", bandFrom: "#8b5cf6", bandTo: "#a78bfa", onSoft: "#6d28d9" },
  slate:   { label: "Slate",   accent: "#334155", accentHover: "#475569", soft: "#f8fafc", bandFrom: "#475569", bandTo: "#64748b", onSoft: "#334155" },

  // Earthy / neutral
  sage:    { label: "Sage",    accent: "#5f7256", accentHover: "#6f8466", soft: "#eef1ea", bandFrom: "#6f8466", bandTo: "#9aae88", onSoft: "#44523a" },
  cream:   { label: "Cream",   accent: "#9c7a4f", accentHover: "#b08c63", soft: "#faf5ec", bandFrom: "#9c7a4f", bandTo: "#c9ae83", onSoft: "#6f5638" },

  // Professional schemes (primary + accent → gradient; bg tint → soft; text → onSoft)
  executive: { label: "Executive", accent: "#0B1F3A", accentHover: "#1F3B5C", soft: "#f4f1e2", bandFrom: "#0B1F3A", bandTo: "#c8a028", onSoft: "#1F3B5C" }, // Navy & Gold
  modern:    { label: "Modern",    accent: "#D1511A", accentHover: "#e0632c", soft: "#e6e9ef", bandFrom: "#2B2F36", bandTo: "#D1511A", onSoft: "#2B2F36" }, // Charcoal & Orange
  creative:  { label: "Creative",  accent: "#0B9AED", accentHover: "#2aa9f0", soft: "#eaf6fe", bandFrom: "#0B9AED", bandTo: "#F69A84", onSoft: "#0b6fad" }, // Blue & Coral
  luxury:    { label: "Luxury",    accent: "#000000", accentHover: "#2a2a2a", soft: "#f4eee6", bandFrom: "#1a1a1a", bandTo: "#8C541C", onSoft: "#6b4a1c" }, // Black & Copper

  // Pulled from the Canva references (see docs/inspiration.md)
  noir:     { label: "Noir",     accent: "#111827", accentHover: "#1f2937", soft: "#f3f4f6", bandFrom: "#1f2937", bandTo: "#4b5563", onSoft: "#111827" }, // Black & white monochrome
  blush:    { label: "Blush",    accent: "#c2607a", accentHover: "#d17a91", soft: "#fdf2f4", bandFrom: "#c2607a", bandTo: "#e0a0b0", onSoft: "#9d4259" }, // Soft pink aesthetic
  burgundy: { label: "Burgundy", accent: "#7a1f2b", accentHover: "#8f2a38", soft: "#f7eee6", bandFrom: "#5e1722", bandTo: "#b8902f", onSoft: "#7a1f2b" }, // Wine & gold
  mocha:    { label: "Mocha",    accent: "#6f4e37", accentHover: "#8a6347", soft: "#f5efe8", bandFrom: "#6f4e37", bandTo: "#a98467", onSoft: "#5b4130" }, // Warm brown & tan
  marine:   { label: "Marine",   accent: "#1e3a5f", accentHover: "#2c5282", soft: "#eef2f7", bandFrom: "#1e3a5f", bandTo: "#4a7ba6", onSoft: "#1e3a5f" }, // Navy & steel blue
  forest:   { label: "Forest",   accent: "#2f5d3f", accentHover: "#3d7350", soft: "#eef3ee", bandFrom: "#2f5d3f", bandTo: "#6b9a78", onSoft: "#274c34" }, // Deep green
  taupe:    { label: "Taupe",    accent: "#8a7355", accentHover: "#9d8567", soft: "#f6f1ea", bandFrom: "#8a7355", bandTo: "#b8a589", onSoft: "#6b5640" }, // Warm taupe

  // Hue-balancing additions (teal, light blue, magenta, warm coral, soft purple)
  teal:     { label: "Teal",     accent: "#0d9488", accentHover: "#14b8a6", soft: "#effbf8", bandFrom: "#0d9488", bandTo: "#2dd4bf", onSoft: "#0f766e" },
  sky:      { label: "Sky",      accent: "#0284c7", accentHover: "#0ea5e9", soft: "#eff8ff", bandFrom: "#0284c7", bandTo: "#38bdf8", onSoft: "#075985" },
  plum:     { label: "Plum",     accent: "#86326a", accentHover: "#9d3a7c", soft: "#fbf0f7", bandFrom: "#6b1f55", bandTo: "#b14a8f", onSoft: "#6b1f55" },
  coral:    { label: "Coral",    accent: "#e2674f", accentHover: "#ee7c63", soft: "#fff2ee", bandFrom: "#e2674f", bandTo: "#f4a08a", onSoft: "#b23a22" },
  lavender: { label: "Lavender", accent: "#6d5fd4", accentHover: "#8071e0", soft: "#f1effd", bandFrom: "#7c6ce0", bandTo: "#a99cf0", onSoft: "#574bb0" },
};

// Font choices use system stacks + the already-loaded Geist vars, so no extra
// web-font requests. `css` goes straight into fontFamily on the card root.
export const FONTS: Record<Font, { label: string; css: string }> = {
  sans: { label: "Sans", css: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif" },
  serif: { label: "Serif", css: "Georgia, 'Times New Roman', serif" },
  rounded: { label: "Rounded", css: "ui-rounded, 'SF Pro Rounded', 'Segoe UI', system-ui, sans-serif" },
  mono: { label: "Mono", css: "var(--font-geist-mono), ui-monospace, monospace" },
  // More professional system-stack choices (no extra web-font requests).
  elegant: { label: "Elegant", css: "'Didot', 'Bodoni MT', 'Playfair Display', 'Hoefler Text', Garamond, serif" },
  slab: { label: "Slab", css: "'Rockwell', 'Roboto Slab', 'Courier New', Georgia, serif" },
  humanist: { label: "Humanist", css: "'Avenir Next', Avenir, 'Segoe UI', 'Helvetica Neue', system-ui, sans-serif" },
};

export const TEMPLATES: { key: Template; label: string; desc: string }[] = [
  { key: "classic", label: "Classic", desc: "Cover band, centered photo" },
  { key: "minimal", label: "Minimal", desc: "Clean, left-aligned, no band" },
  { key: "bold", label: "Bold", desc: "Big color header" },
  { key: "split", label: "Split", desc: "Color panel beside details" },
  { key: "spotlight", label: "Spotlight", desc: "Tall hero cover, large photo" },
  { key: "sidebar", label: "Sidebar", desc: "Accent rail, compact header" },
  { key: "monogram", label: "Monogram", desc: "Initial badge on a tinted panel" },
  { key: "framed", label: "Framed", desc: "Elegant border, letterspaced name" },
  { key: "corner", label: "Corner", desc: "Diagonal corner accent" },
  { key: "wave", label: "Wave", desc: "Curved color divider" },
];

// Coerce possibly-unknown stored values back into a valid choice (defaults).
export function getPalette(scheme: string | null | undefined): Palette {
  return PALETTES[(scheme as ColorScheme)] ?? PALETTES.emerald;
}

export function getTemplate(template: string | null | undefined): Template {
  const valid: Template[] = ["classic", "minimal", "bold", "split", "spotlight", "sidebar", "monogram", "framed", "corner", "wave"];
  return valid.includes(template as Template) ? (template as Template) : "classic";
}

// Business-card front gallery — drives the editor's "Business card style" picker.
export const BUSINESS_TEMPLATES: { key: BusinessVariant; label: string; desc: string }[] = [
  { key: "banded", label: "Banded", desc: "White with a gradient top band" },
  { key: "filled", label: "Filled", desc: "Full-color front, white text" },
  { key: "outline", label: "Outline", desc: "Bordered with an accent rule" },
  { key: "split", label: "Split", desc: "Color photo panel + details" },
  { key: "mono", label: "Mono", desc: "Minimal, text-only" },
  { key: "monogram", label: "Monogram", desc: "Initial badge + divider" },
  { key: "duo", label: "Duo", desc: "Two-tone color bands" },
  { key: "framed", label: "Framed", desc: "Elegant border, centered name" },
  { key: "corner", label: "Corner", desc: "Diagonal corner accent" },
  { key: "wave", label: "Wave", desc: "Curved color strip" },
  { key: "initials", label: "Initials", desc: "Big initials with a divider" },
  { key: "corporate", label: "Corporate", desc: "Top rule + contact list" },
  { key: "wordmark", label: "Wordmark", desc: "Oversized name type" },
  { key: "portrait", label: "Portrait", desc: "Photo panel + contact list" },
  { key: "elegant", label: "Elegant", desc: "Centered serif, hairline rules" },
];

const BUSINESS_KEYS = new Set(BUSINESS_TEMPLATES.map((t) => t.key));

// For persistence: keep an explicit valid pick, else null (= derive from template).
export function normalizeCardTemplate(v: string | null | undefined): string | null {
  return v && BUSINESS_KEYS.has(v as BusinessVariant) ? v : null;
}

// Resolve which business-card front to render: an explicit pick wins; otherwise
// fall back to the style derived from the profile template.
export function getCardTemplate(
  cardTemplate: string | null | undefined,
  profileTemplate: string | null | undefined
): BusinessVariant {
  if (cardTemplate && BUSINESS_KEYS.has(cardTemplate as BusinessVariant)) return cardTemplate as BusinessVariant;
  return getBusinessVariant(profileTemplate);
}

// Pick the business-card front style that best matches a profile template (default).
export function getBusinessVariant(template: string | null | undefined): BusinessVariant {
  switch (getTemplate(template)) {
    case "bold":
    case "spotlight": return "filled"; // full-color front, white text
    case "minimal": return "mono";     // clean, text-only with accent rule
    case "sidebar": return "outline";  // light card, accent border
    case "split": return "split";      // color photo panel beside details
    case "monogram": return "mono";    // initials-forward, text business card
    case "framed": return "outline";   // bordered, elegant
    case "corner": return "split";     // shares the angled-color motif
    case "wave": return "filled";      // friendly full-color front
    default: return "banded";          // classic — white with a gradient top band
  }
}

export function getColorScheme(scheme: string | null | undefined): ColorScheme {
  return (scheme as ColorScheme) in PALETTES ? (scheme as ColorScheme) : "emerald";
}

export function getFont(font: string | null | undefined): Font {
  return (font as Font) in FONTS ? (font as Font) : "sans";
}
