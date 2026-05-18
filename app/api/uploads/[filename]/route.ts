// GET /api/uploads/[filename] — streams a file from UPLOAD_DIR.
// WHY: Serving uploads through this API route means the actual files can live anywhere
//      (local dev: public/uploads, Railway prod: /data/uploads volume) and the URL
//      path stays consistent — no DB record updates needed when switching environments.
// EFFECT: Reads the file from disk and streams it with the correct Content-Type header.
//         Returns 404 if the file doesn't exist, 400 if the filename looks unsafe.

import { NextRequest, NextResponse } from "next/server";
import { existsSync } from "fs";
import { join, basename } from "path";

// Minimal extension → MIME type map (only types the upload API accepts)
const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  pdf: "application/pdf",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // Only allow plain filenames — no path separators or dots that could escape the directory
  if (!/^[\w\-]+\.[a-z0-9]{2,5}$/.test(filename)) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  const uploadDir = process.env.UPLOAD_DIR ?? join(process.cwd(), "public", "uploads");
  const filePath = join(uploadDir, basename(filename));

  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const contentType = MIME[ext] ?? "application/octet-stream";

  // Read file and return as a streamed response
  const { readFile } = await import("fs/promises");
  const buffer = await readFile(filePath);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      // Cache for 1 year — filenames are UUIDs so they never collide
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
