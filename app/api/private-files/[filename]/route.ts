// GET /api/private-files/[filename]
// Serves a private business-card photo to the authenticated admin.
// WHY: In production (Supabase), generates a short-lived signed URL and redirects.
//      In dev, reads from local disk. Either way the file is never publicly accessible.
// SECURITY: Filename is sanitised to prevent path traversal.

import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join, basename } from "path";
import { existsSync } from "fs";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { createClient } from "@supabase/supabase-js";

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isLoggedIn)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const safe = basename((await params).filename);

  // Production: generate a 1-hour signed URL from Supabase private bucket
  if (process.env.SUPABASE_URL) {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data, error } = await supabase.storage
      .from("private-uploads")
      .createSignedUrl(safe, 3600);
    if (error || !data)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.redirect(data.signedUrl);
  }

  // Dev fallback: read from local private directory
  const uploadDir = process.env.PRIVATE_UPLOAD_DIR ?? join(process.cwd(), "data", "private-uploads");
  const filePath = join(uploadDir, safe);
  if (!existsSync(filePath))
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ext = safe.split(".").pop()?.toLowerCase() ?? "jpg";
  const buffer = await readFile(filePath);
  return new NextResponse(buffer, {
    headers: { "Content-Type": MIME[ext] ?? "application/octet-stream" },
  });
}
