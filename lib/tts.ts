// Text-to-speech via ElevenLabs (env-driven). Returns MP3 audio bytes.
// Unlike the local Ollama call, ElevenLabs is a public API, so this works from
// Vercel prod too (given the env vars are set).

export async function synthesizeSpeech(text: string): Promise<ArrayBuffer> {
  const key = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  if (!key || !voiceId) throw new Error("Speech isn't configured (set ELEVENLABS_API_KEY + ELEVENLABS_VOICE_ID).");

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": key,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: text.slice(0, 800),
      model_id: "eleven_turbo_v2_5",
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`TTS failed (${res.status}): ${body.slice(0, 120)}`);
  }
  return res.arrayBuffer();
}
