// AI card-design suggestion via Groq (OpenAI-compatible chat completions, env-driven).
// WHY: a hosted Llama model picks a template/palette/font from the person's info.
// NOTE: Groq is a public HTTPS API, so this works the same in local dev AND on
//       Vercel prod — unlike the previous localhost Ollama setup, which couldn't
//       be reached from Vercel's servers.

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
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  const baseUrl = process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1";
  if (!apiKey) throw new Error("AI isn't configured (set GROQ_API_KEY).");

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
  let content: string;
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`AI request failed (${res.status})${detail ? `: ${detail.slice(0, 140)}` : ""}`);
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    content = data.choices?.[0]?.message?.content ?? "{}";
  } finally {
    clearTimeout(timeout);
  }

  // The model returns JSON as a string; parse defensively and coerce every field
  // to a known value (the validators default on anything invalid).
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(content);
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
