// POST /api/auth/logout — destroys the session cookie.

import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  const session = await getIronSession<SessionData>(
    request,
    response,
    sessionOptions
  );
  // Clears the encrypted cookie — user must re-login
  session.destroy();
  return response;
}
