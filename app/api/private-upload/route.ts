// POST /api/private-upload
// Accepts a business card photo from the public connection form.
// WHY: Stores the file OUTSIDE /public/ so it can never be served statically —
//      only the authenticated admin file route can read it.
// EFFECT: Returns a UUID filename that gets stored in Connection.cardFilename.

import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

// Allowed MIME types and file size cap
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic"];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

// Resolve private upload directory — can be overridden via env var for Railway
const UPLOAD_DIR =
  process.env.PRIVATE_UPLOAD_DIR ?? join(process.cwd(), "data", "private-uploads");

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const filename = `${randomUUID()}.${ext}`;
  const dest = join(UPLOAD_DIR, filename);

  // Ensure the directory exists (first run or new deployment)
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(dest, Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({ filename });
}
