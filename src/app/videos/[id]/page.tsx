export const runtime = "edge";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VideoPlayer } from "@/components/video-player";
import { LikeButton } from "@/components/like-button";
import { FavoriteButton } from "@/components/favorite-button";
import { CommentForm } from "@/components/comment-form";
import { CommentList } from "@/components/comment-list";
import type { Comment } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: video } = await supabase.from("videos").select("*").eq("id", id).single();
  if (!video) notFound();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  const [likesCountRes, likedRes, favoritedRes, commentsRes] = await Promise.all([
    supabase.from("likes").select("video_id", { count: "exact", head: true }).eq("video_id", id),
    user
      ? supabase.from("likes").select("video_id").eq("video_id", id).eq("user_id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    user
      ? supabase.from("favorites").select("video_id").eq("video_id", id).eq("user_id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("comments")
      .select("id, video_id, user_id, body, created_at, profile:profiles!comments_user_id_fkey(username, display_name, avatar_url)")
      .eq("video_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const likeCount = likesCountRes.count ?? 0;
  const initialLiked = Boolean(likedRes.data);
  const initialFavorited = Boolean(favoritedRes.data);
  const comments = (commentsRes.data ?? []).map((c) => ({
    ...c,
    profile: Array.isArray(c.profile) ? c.profile[0] : c.profile,
  })) as Comment[];

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-5">
        <VideoPlayer driveFileId={video.drive_file_id} />

        <div>
          <h1 className="text-xl sm:text-2xl font-semibold leading-tight">{video.title}</h1>
          {video.description && (
            <p className="text-sm text-neutral-300 mt-2 whitespace-pre-wrap">{video.description}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <LikeButton videoId={video.id} initialLiked={initialLiked} initialCount={likeCount} signedIn={Boolean(user)} />
          <FavoriteButton videoId={video.id} initialFavorited={initialFavorited} signedIn={Boolean(user)} />
        </div>
      </div>

      <aside className="space-y-4">
        <h2 className="text-sm font-semibold text-neutral-200">Comments ({comments.length})</h2>
        <CommentForm videoId={video.id} signedIn={Boolean(user)} />
        <CommentList comments={comments} currentUserId={user?.id ?? null} />
      </aside>
    </div>
  );
}
