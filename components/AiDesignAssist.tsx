"use client";
// "Design with AI" — asks a Groq-hosted model for a template/palette/font from
// the person's info, applies it to the form (live preview updates), and speaks the
// explanation via ElevenLabs. Speech is best-effort; design works without it.

import { useRef, useState } from "react";

export default function AiDesignAssist({
  name,
  headline,
  about,
  onApply,
}: {
  name: string;
  headline: string;
  about: string;
  onApply: (d: { template: string; colorScheme: string; font: string }) => void;
}) {
  const [vibe, setVibe] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function speak(text: string) {
    try {
      const res = await fetch("/api/ai/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) return; // speech is optional
      const url = URL.createObjectURL(await res.blob());
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play().catch(() => {});
      }
    } catch {
      /* ignore — speech is a bonus */
    }
  }

  async function suggest() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/ai/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, headline, about, vibe }),
      });
      if (!res.ok) {
        const { error: e } = await res.json().catch(() => ({}));
        throw new Error(e ?? "AI is unavailable");
      }
      const d = await res.json();
      onApply({ template: d.template, colorScheme: d.colorScheme, font: d.font });
      setMessage(d.message);
      speak(d.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI is unavailable");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-violet-200 dark:border-violet-500/30 bg-violet-50/50 p-3">
      <p className="text-sm font-medium text-body mb-2">✨ Design with AI</p>
      <div className="flex gap-2">
        <input
          value={vibe}
          onChange={(e) => setVibe(e.target.value)}
          placeholder="Describe your vibe (e.g. bold & creative)"
          className="flex-1 bg-surface border border-line-strong rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-violet-400"
        />
        <button
          type="button"
          onClick={suggest}
          disabled={busy}
          className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
        >
          {busy ? "Thinking…" : "Suggest"}
        </button>
      </div>
      {message && (
        <div className="mt-2 flex items-start gap-2">
          <p className="text-sm text-body flex-1">{message}</p>
          <button type="button" onClick={() => speak(message)} className="text-xs font-medium text-violet-700 dark:text-violet-300 shrink-0">
            🔊 Replay
          </button>
        </div>
      )}
      {error && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
