import Link from "next/link";
import { Heart, MessageCircle } from "lucide-react";
import { thumbnailUrl } from "@/lib/drive";
import type { Video } from "@/lib/types";

type Props = {
  video: Video & { like_count?: number; comment_count?: number };
};

export function VideoCard({ video }: Props) {
  const cat = video.category;
  return (
    <Link
      href={`/videos/${video.id}`}
      className="group block rounded-lg overflow-hidden bg-surface border border-border/60 hover:border-border transition"
    >
      <div className="relative aspect-video bg-surface2 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnailUrl(video.drive_file_id, 640)}
          alt={video.title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-300"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
        {cat && (
          <span className="absolute top-2 left-2 rounded-full bg-black/60 backdrop-blur px-2 py-0.5 text-xs font-medium text-white">
            {cat.name}
          </span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition" />
      </div>
      <div className="p-3">
        <h3 className="font-medium text-sm line-clamp-2 leading-snug group-hover:text-white text-neutral-200">
          {video.title}
        </h3>
        {(video.like_count !== undefined || video.comment_count !== undefined) && (
          <div className="mt-2 flex items-center gap-3 text-xs text-muted">
            {video.like_count !== undefined && (
              <span className="flex items-center gap-1"><Heart size={12} /> {video.like_count}</span>
            )}
            {video.comment_count !== undefined && (
              <span className="flex items-center gap-1"><MessageCircle size={12} /> {video.comment_count}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
