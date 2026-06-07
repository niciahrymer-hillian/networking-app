// Card designer config — the templates (layouts) and color palettes a profile
// card can use. Kept in one place so the public card, the (future) live editor,
// and validation all share the same source of truth.

export type Template = "classic" | "minimal" | "bold" | "split";
export type ColorScheme = "emerald" | "indigo" | "rose" | "amber" | "violet" | "slate";

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
};

export const TEMPLATES: { key: Template; label: string; desc: string }[] = [
  { key: "classic", label: "Classic", desc: "Cover band, centered photo" },
  { key: "minimal", label: "Minimal", desc: "Clean, left-aligned, no band" },
  { key: "bold", label: "Bold", desc: "Big color header" },
  { key: "split", label: "Split", desc: "Color panel beside details" },
];

// Coerce possibly-unknown stored values back into a valid choice (defaults).
export function getPalette(scheme: string | null | undefined): Palette {
  return PALETTES[(scheme as ColorScheme)] ?? PALETTES.emerald;
}

export function getTemplate(template: string | null | undefined): Template {
  const valid: Template[] = ["classic", "minimal", "bold", "split"];
  return valid.includes(template as Template) ? (template as Template) : "classic";
}

export function getColorScheme(scheme: string | null | undefined): ColorScheme {
  return (scheme as ColorScheme) in PALETTES ? (scheme as ColorScheme) : "emerald";
}
