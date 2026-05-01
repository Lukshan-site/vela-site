export const runtime = "edge";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth";
import { thumbnailUrl } from "@/lib/drive";
import { DeleteVideoButton } from "./delete-video-button";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/");

  const supabase = await createClient();
  const { data: videos } = await supabase
    .from("videos").select("id, drive_file_id, title, created_at").order("created_at", { ascending: false });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Admin</h1>
          <p className="text-muted text-sm mt-1">Manage your videos.</p>
        </div>
        <Link href="/admin/new"
          className="flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:brightness-110 transition">
          <Plus size={16} /> Add video
        </Link>
      </div>

      <div className="rounded-xl bg-surface border border-border overflow-hidden">
        {videos && videos.length > 0 ? (
          <ul className="divide-y divide-border">
            {videos.map((v) => (
              <li key={v.id} className="flex items-center gap-4 p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumbnailUrl(v.drive_file_id, 200)} alt="" width={120} height={68}
                  className="rounded bg-surface2 object-cover" />
                <div className="flex-1 min-w-0">
                  <Link href={`/videos/${v.id}`}
                    className="font-medium hover:text-accent transition flex items-center gap-1">
                    {v.title}
                    <ExternalLink size={12} className="opacity-60" />
                  </Link>
                  <p className="text-xs text-muted mt-0.5">{new Date(v.created_at).toLocaleString()}</p>
                </div>
                <DeleteVideoButton id={v.id} title={v.title} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-10 text-center text-muted text-sm">
            No videos yet.{" "}
            <Link href="/admin/new" className="text-accent hover:underline">Add the first one</Link>.
          </div>
        )}
      </div>
    </div>
  );
}
