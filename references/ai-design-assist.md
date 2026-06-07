# AI Design Assist (+ voice)

"Design with AI" in the card editor: a local **Ollama** model picks a
template/palette/font from the person's info, applies it to the live preview, and
**ElevenLabs** speaks the one-line explanation.

## Pieces
- `lib/ai.ts` — `suggestDesign()` → POST `${OLLAMA_BASE_URL}/api/chat` (format: json,
  stream: false). Output is coerced through the card-design validators, so a bad
  model response can't produce an invalid design. 25s timeout.
- `lib/tts.ts` — `synthesizeSpeech()` → ElevenLabs `text-to-speech/{voice}` → MP3.
- `app/api/ai/design` + `app/api/ai/speak` — auth-gated routes (503 if the AI/TTS
  isn't reachable/configured, so the UI degrades gracefully).
- `components/AiDesignAssist.tsx` — the editor widget (in ProfileForm's Card style).

## Environment variables (NOT committed)
Add to `.env.local` for local dev, and to Vercel for prod:

```
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434     # see reachability note
OLLAMA_MODEL=llama3.2:3b
ELEVENLABS_API_KEY=...                      # secret
ELEVENLABS_VOICE_ID=...
```

## ⚠️ Reachability — this is the important bit
- **Ollama is local.** `OLLAMA_BASE_URL=http://localhost:11434` only works when the
  app runs **on the same machine as Ollama** (i.e. `npm run dev`). On **Vercel**,
  `localhost` is Vercel's own server, not yours — so the design suggestion will 503
  in prod **until** `OLLAMA_BASE_URL` points at a **publicly reachable** Ollama (a
  tunnel like `cloudflared`/`ngrok`, or a hosted Ollama). Run Ollama with
  `OLLAMA_HOST=0.0.0.0` + a tunnel, then set the prod `OLLAMA_BASE_URL` to the tunnel URL.
- **ElevenLabs is a public API**, so **voice works on prod** once the env vars are set
  in Vercel — independent of the Ollama situation.

## Security
The ElevenLabs key must live only in env vars (`.env*` is gitignored) + Vercel —
never in the repo or in chat. If it's ever exposed, rotate it in the ElevenLabs dashboard.
