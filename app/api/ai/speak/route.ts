// POST /api/ai/speak — text -> MP3 speech via ElevenLabs.
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { synthesizeSpeech } from "@/lib/tts";

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { text } = (await req.json().catch(() => ({}))) as { text?: string };
  if (!text?.trim()) {
    return NextResponse.json({ error: "No text" }, { status: 400 });
  }

  try {
    const audio = await synthesizeSpeech(text.trim());
    return new NextResponse(audio, {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "TTS unavailable";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
