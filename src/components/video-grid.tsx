import { VideoCard } from "./video-card";
import type { Video } from "@/lib/types";

export function VideoGrid({
  videos,
  empty,
}: {
  videos: (Video & { like_count?: number; comment_count?: number })[];
  empty?: React.ReactNode;
}) {
  if (videos.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 bg-surface/40 py-16 text-center text-muted">
        {empty || "No videos yet."}
      </div>
    );
  }
  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {videos.map((v) => (
        <VideoCard key={v.id} video={v} />
      ))}
    </div>
  );
}
