// AI card-design suggestion via a local Ollama server (env-driven).
// WHY: a small local model picks a template/palette/font from the person's info.
// NOTE: OLLAMA_BASE_URL must be reachable from wherever the app RUNS. On Vercel
//       that means a public URL (tunnel) — `localhost` only works in local dev.

import { getTemplate, getColorScheme, getFont, TEMPLATES, PALETTES, FONTS } from "@/lib/card-design";

export interface DesignSuggestion {
  template: string;
  colorScheme: string;
  font: string;
  message: string;
}

export async function suggestDesign(input: {
  name?: string;
  headline?: string;
  about?: string;
  vibe?: string;
}): Promise<DesignSuggestion> {
  const baseUrl = process.env.OLLAMA_BASE_URL;
  const model = process.env.OLLAMA_MODEL || "llama3.2:3b";
  if (!baseUrl) throw new Error("AI isn't configured (set OLLAMA_BASE_URL).");

  const templates = TEMPLATES.map((t) => t.key).join(", ");
  const palettes = Object.keys(PALETTES).join(", ");
  const fonts = Object.keys(FONTS).join(", ");

  const system =
    `You are a brand designer for digital business cards. Choose a design that fits the person. ` +
    `Reply with ONLY a JSON object, no prose: ` +
    `{"template": one of [${templates}], "colorScheme": one of [${palettes}], "font": one of [${fonts}], ` +
    `"message": one friendly sentence (max 25 words) explaining the vibe}.`;
  const user =
    `Name: ${input.name || "(unknown)"}\n` +
    `Headline: ${input.headline || "(none)"}\n` +
    `About: ${input.about || "(none)"}\n` +
    `Desired vibe: ${input.vibe || "(none)"}`;

  // Don't let a slow/unreachable model hang the request.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  let data: { message?: { content?: string } };
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        stream: false,
        format: "json",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) throw new Error(`AI request failed (${res.status})`);
    data = await res.json();
  } finally {
    clearTimeout(timeout);
  }

  // The model returns JSON as a string; parse defensively and coerce every field
  // to a known value (the validators default on anything invalid).
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(data?.message?.content ?? "{}");
  } catch {
    parsed = {};
  }

  return {
    template: getTemplate(typeof parsed.template === "string" ? parsed.template : null),
    colorScheme: getColorScheme(typeof parsed.colorScheme === "string" ? parsed.colorScheme : null),
    font: getFont(typeof parsed.font === "string" ? parsed.font : null),
    message:
      typeof parsed.message === "string" && parsed.message.trim()
        ? parsed.message.trim().slice(0, 240)
        : "Here's a design that suits your vibe.",
  };
}
