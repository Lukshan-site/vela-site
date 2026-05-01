import { embedUrl } from "@/lib/drive";

export function VideoPlayer({ driveFileId }: { driveFileId: string }) {
  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-border">
      <iframe
        src={embedUrl(driveFileId)}
        title="Video player"
        allow="autoplay; encrypted-media"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
}
