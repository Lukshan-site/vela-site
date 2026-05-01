export const runtime = "edge";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchVideosWithCounts } from "@/lib/queries";
import { VideoGrid } from "@/components/video-grid";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const { data: rows } = await supabase
    .from("favorites").select("video_id, created_at").eq("user_id", user.id).order("created_at", { ascending: false });

  const videoIds = (rows ?? []).map((r) => r.video_id);
  const videos = videoIds.length ? await fetchVideosWithCounts(videoIds, { limit: 200 }) : [];
  const order = new Map(videoIds.map((id, i) => [id, i]));
  videos.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Saved Videos</h1>
        <p className="text-muted text-sm mt-1">Your favorite videos, all in one place.</p>
      </div>
      <VideoGrid videos={videos} empty="No saved videos yet. Hit the Save button on any video!" />
    </div>
  );
}
