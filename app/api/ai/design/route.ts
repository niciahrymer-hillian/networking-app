// POST /api/ai/design — suggest a card design (template/palette/font + message).
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { suggestDesign } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    headline?: string;
    about?: string;
    vibe?: string;
  };

  try {
    const suggestion = await suggestDesign(body);
    return NextResponse.json(suggestion);
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI is unavailable";
    // 503 — the AI server isn't reachable/configured (e.g. missing GROQ_API_KEY).
    return NextResponse.json(
      { error: `Couldn't reach the AI: ${message}` },
      { status: 503 }
    );
  }
}
