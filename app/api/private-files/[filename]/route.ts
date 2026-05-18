// GET /api/private-files/[filename]
// Streams a private business-card photo to the authenticated admin.
// WHY: Files are stored outside /public/ — this is the only way to serve them.
//      Auth check ensures only logged-in admins can download them.
// SECURITY: Filename is sanitised (basename only) to prevent path traversal.

import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join, basename } from "path";
import { existsSync } from "fs";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";

const UPLOAD_DIR =
  process.env.PRIVATE_UPLOAD_DIR ?? join(process.cwd(), "data", "private-uploads");

// Basic MIME type map — we only store common image formats
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
  // Require an active admin session
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Sanitise: strip any path components so callers can't traverse the filesystem
  const safe = basename((await params).filename);
  const filePath = join(UPLOAD_DIR, safe);

  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ext = safe.split(".").pop()?.toLowerCase() ?? "jpg";
  const mime = MIME[ext] ?? "application/octet-stream";

  const buffer = await readFile(filePath);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": mime,
      "Content-Disposition": `inline; filename="${safe}"`,
      // Prevent browser from caching private images
      "Cache-Control": "no-store",
    },
  });
}
