// POST /api/upload — accepts a multipart form file.
// WHY: Using SUPABASE_URL when set (production/Vercel) uploads to Supabase Storage so files
//      persist across deploys. Falls back to local disk when running without Supabase (dev).
// EFFECT: Returns a URL to store in the profile record. In production this is a Supabase CDN URL;
//         in dev it is /api/uploads/<filename> served from the local UPLOAD_DIR.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  // Feed media
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/ogg",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);
// NOTE: Vercel caps the request body at ~4.5 MB, so larger files (esp. video)
// need a future direct-to-storage upload. Images + short clips are fine.
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
  if (!(await requireAuth()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file)
    return NextResponse.json({ error: "No file provided" }, { status: 400 });

  if (!ALLOWED_TYPES.has(file.type))
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });

  if (file.size > MAX_BYTES)
    return NextResponse.json(
      { error: "File too large (max 10 MB)" },
      { status: 400 }
    );

  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "bin";
  const filename = `${uuidv4()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  // Production: upload to Supabase Storage public bucket
  if (process.env.SUPABASE_URL) {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { error } = await supabase.storage
      .from("uploads")
      .upload(filename, buffer, { contentType: file.type, upsert: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const { data: { publicUrl } } = supabase.storage.from("uploads").getPublicUrl(filename);
    return NextResponse.json({ url: publicUrl });
  }

  // Production without Supabase configured: fail loudly. Writing to local disk on
  // Vercel "succeeds" but the file lives on an ephemeral filesystem and is gone by
  // the next request — so the upload silently disappears. A clear error is better.
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        error:
          "File storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the deployment environment and create a public 'uploads' Storage bucket.",
      },
      { status: 503 }
    );
  }

  // Dev fallback: save to local UPLOAD_DIR and serve via /api/uploads/
  const uploadDir = process.env.UPLOAD_DIR ?? join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(join(uploadDir, filename), buffer);
  return NextResponse.json({ url: `/api/uploads/${filename}` });
}
