// POST /api/private-upload
// Accepts a business card photo from the public connection form.
// WHY: In production, stores in a private Supabase bucket — never publicly accessible.
//      In dev, stores outside /public/ so it can't be served statically.
// EFFECT: Returns a UUID filename stored in Connection.cardFilename.

import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic"];
const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File))
    return NextResponse.json({ error: "No file provided" }, { status: 400 });

  if (!ALLOWED_TYPES.includes(file.type))
    return NextResponse.json({ error: "File type not allowed" }, { status: 400 });

  if (file.size > MAX_BYTES)
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const filename = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  // Production: upload to private Supabase bucket (no public URL)
  if (process.env.SUPABASE_URL) {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { error } = await supabase.storage
      .from("private-uploads")
      .upload(filename, buffer, { contentType: file.type, upsert: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ filename });
  }

  // Dev fallback: save to local private directory
  const uploadDir = process.env.PRIVATE_UPLOAD_DIR ?? join(process.cwd(), "data", "private-uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(join(uploadDir, filename), buffer);
  return NextResponse.json({ filename });
}
