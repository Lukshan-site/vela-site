import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "edge";

interface SyncBody {
  secret: string;
  fileId: string;
  title: string;
  folderName: string;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export async function POST(req: NextRequest) {
  // ── 1. Auth ──────────────────────────────────────────────────────────────
  let body: SyncBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { secret, fileId, title, folderName } = body;

  if (!secret || secret !== process.env.SYNC_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!fileId || !title || !folderName) {
    return NextResponse.json(
      { error: "Missing required fields: fileId, title, folderName" },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  // ── 2. Find or create the category ───────────────────────────────────────
  const slug = slugify(folderName);

  let categoryId: string | null = null;

  const { data: existingCat } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existingCat) {
    categoryId = existingCat.id;
  } else {
    // Create it automatically — name = folderName, slug = slugified
    const { data: newCat, error: catErr } = await supabase
      .from("categories")
      .insert({ name: folderName, slug })
      .select("id")
      .single();

    if (catErr || !newCat) {
      return NextResponse.json(
        { error: "Failed to create category", detail: catErr?.message },
        { status: 500 },
      );
    }
    categoryId = newCat.id;
  }

  // ── 3. Skip duplicates (same Drive file already synced) ──────────────────
  const { data: existing } = await supabase
    .from("videos")
    .select("id")
    .eq("drive_file_id", fileId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ success: true, videoId: existing.id, skipped: true });
  }

  // ── 4. Insert the video ───────────────────────────────────────────────────
  const { data: video, error: vidErr } = await supabase
    .from("videos")
    .insert({
      drive_file_id: fileId,
      title: title.trim(),
      description: null,
      created_by: null,
      category_id: categoryId,
    })
    .select("id")
    .single();

  if (vidErr || !video) {
    return NextResponse.json(
      { error: "Failed to insert video", detail: vidErr?.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, videoId: video.id, skipped: false });
}
