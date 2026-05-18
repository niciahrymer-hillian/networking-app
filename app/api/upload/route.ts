// POST /api/upload — accepts a multipart form file and saves it to UPLOAD_DIR.
// WHY: Using UPLOAD_DIR (defaulting to public/uploads in dev, /data/uploads in prod) means
//      files can live on a Railway persistent volume and survive redeploys.
// EFFECT: Returns a URL path (/api/uploads/<uuid>.<ext>) to store in the profile record.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

// Allowed MIME types — restrict to images and PDFs only
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
  if (!(await requireAuth()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file)
    return NextResponse.json({ error: "No file provided" }, { status: 400 });

  // Validate type and size before writing — prevents storing dangerous file types
  if (!ALLOWED_TYPES.has(file.type))
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });

  if (file.size > MAX_BYTES)
    return NextResponse.json(
      { error: "File too large (max 10 MB)" },
      { status: 400 }
    );

  // Use UUID filename to avoid collisions and prevent path traversal via original name
  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "bin";
  const filename = `${uuidv4()}.${ext}`;
  // UPLOAD_DIR can be pointed at a Railway volume (/data/uploads) for persistence across redeploys
  const uploadDir = process.env.UPLOAD_DIR ?? join(process.cwd(), "public", "uploads");

  await mkdir(uploadDir, { recursive: true });
  await writeFile(join(uploadDir, filename), Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({ url: `/api/uploads/${filename}` });
}
