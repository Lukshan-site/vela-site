export const runtime = "edge";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { Avatar } from "@/components/nav-bar";
import { ProfileEditForm } from "./profile-edit-form";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const [likes, favorites, comments] = await Promise.all([
    supabase.from("likes").select("video_id", { count: "exact", head: true }).eq("user_id", profile.id),
    supabase.from("favorites").select("video_id", { count: "exact", head: true }).eq("user_id", profile.id),
    supabase.from("comments").select("id", { count: "exact", head: true }).eq("user_id", profile.id),
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
            <Link href="/liked" className="rounded-full bg-surface px-3 py-1 hover:bg-surface2 transition">
              ❤ {likes.count ?? 0} Liked
            </Link>
            <Link href="/favorites" className="rounded-full bg-surface px-3 py-1 hover:bg-surface2 transition">
              ⭐ {favorites.count ?? 0} Saved
            </Link>
            <span className="rounded-full bg-surface px-3 py-1 text-muted">
              💬 {comments.count ?? 0} Comments
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-surface border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Edit Profile</h2>
        <ProfileEditForm profile={profile} />
      </div>
    </div>
  );
}
