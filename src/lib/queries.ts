import { createClient } from "@/lib/supabase/server";
import type { Video } from "@/lib/types";

export async function fetchVideosWithCounts(
  videoIds?: string[],
  opts: { limit?: number; categorySlug?: string } = {},
) {
  const supabase = await createClient();
  const limit = opts.limit ?? 60;

  let query = supabase
    .from("videos")
    .select("id, drive_file_id, title, description, created_by, category_id, created_at, category:categories(id,name,slug)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (videoIds && videoIds.length) {
    query = query.in("id", videoIds);
  }

  if (opts.categorySlug) {
    // Filter by category slug via join
    const supabaseInner = await createClient();
    const { data: cat } = await supabaseInner
      .from("categories").select("id").eq("slug", opts.categorySlug).single();
    if (cat) query = query.eq("category_id", cat.id);
    else return [];
  }

  const { data: videos, error } = await query;
  if (error || !videos) return [];
  if (videos.length === 0) return [];

  const ids = videos.map((v) => v.id);
  const [likesRes, commentsRes] = await Promise.all([
    supabase.from("likes").select("video_id").in("video_id", ids),
    supabase.from("comments").select("video_id").in("video_id", ids),
  ]);

  const likeCounts = new Map<string, number>();
  (likesRes.data ?? []).forEach((row: { video_id: string }) =>
    likeCounts.set(row.video_id, (likeCounts.get(row.video_id) ?? 0) + 1),
  );
  const commentCounts = new Map<string, number>();
  (commentsRes.data ?? []).forEach((row: { video_id: string }) =>
    commentCounts.set(row.video_id, (commentCounts.get(row.video_id) ?? 0) + 1),
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return videos.map((v: any) => ({
    ...v,
    category: Array.isArray(v.category) ? v.category[0] ?? null : v.category ?? null,
    like_count: likeCounts.get(v.id) ?? 0,
    comment_count: commentCounts.get(v.id) ?? 0,
  }));
}

export async function fetchAllCategories() {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("*").order("name");
  return data ?? [];
}
