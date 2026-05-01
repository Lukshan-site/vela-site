export const runtime = "edge";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/nav-bar";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PublicProfile({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase.from("profiles").select("*").eq("username", username).single<Profile>();
  if (!profile) notFound();

  const [{ count: likeCount }, { count: favCount }, recentComments] = await Promise.all([
    supabase.from("likes").select("video_id", { count: "exact", head: true }).eq("user_id", profile.id),
    supabase.from("favorites").select("video_id", { count: "exact", head: true }).eq("user_id", profile.id),
    supabase.from("comments")
      .select("id, body, created_at, video_id, video:videos!comments_video_id_fkey(id, title)")
      .eq("user_id", profile.id).order("created_at", { ascending: false }).limit(10),
  ]);

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-start gap-5">
        <Avatar profile={profile} size={84} />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold">{profile.display_name || profile.username}</h1>
          <p className="text-sm text-muted">@{profile.username}</p>
          {profile.bio && <p className="mt-2 text-sm text-neutral-300 whitespace-pre-wrap">{profile.bio}</p>}
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full bg-surface px-3 py-1">❤ {likeCount ?? 0} Liked</span>
            <span className="rounded-full bg-surface px-3 py-1">⭐ {favCount ?? 0} Saved</span>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Recent Comments</h2>
        {recentComments.data && recentComments.data.length > 0 ? (
          <ul className="space-y-3">
            {recentComments.data.map((c) => {
              const video = Array.isArray(c.video) ? c.video[0] : c.video;
              return (
                <li key={c.id} className="rounded-lg bg-surface border border-border p-4">
                  <p className="text-sm text-neutral-200 whitespace-pre-wrap">{c.body}</p>
                  <div className="mt-2 text-xs text-muted">
                    on{" "}
                    <Link href={`/videos/${c.video_id}`} className="text-accent hover:underline">
                      {video?.title ?? "video"}
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="text-sm text-muted">No comments yet.</div>
        )}
      </div>
    </div>
  );
}
