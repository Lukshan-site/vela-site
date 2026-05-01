"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import clsx from "clsx";

type Props = {
  videoId: string;
  initialLiked: boolean;
  initialCount: number;
  signedIn: boolean;
};

export function LikeButton({ videoId, initialLiked, initialCount, signedIn }: Props) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  async function toggle() {
    if (!signedIn) { router.push("/login"); return; }
    const next = !liked;
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));
    startTransition(async () => {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) { setLiked(!next); setCount((c) => c - (next ? 1 : -1)); router.push("/login"); return; }
      const { error } = next
        ? await supabase.from("likes").insert({ user_id: userId, video_id: videoId })
        : await supabase.from("likes").delete().eq("user_id", userId).eq("video_id", videoId);
      if (error) { setLiked(!next); setCount((c) => c - (next ? 1 : -1)); }
    });
  }

  return (
    <button onClick={toggle} disabled={pending}
      className={clsx(
        "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition border",
        liked ? "bg-accent/15 border-accent/40 text-accent" : "bg-surface border-border hover:border-neutral-500 text-neutral-200",
      )}
      aria-pressed={liked}>
      <Heart size={18} fill={liked ? "currentColor" : "none"} className={liked ? "animate-pop" : ""} />
      <span>{liked ? "Liked" : "Like"}</span>
      <span className="text-xs opacity-70">{count}</span>
    </button>
  );
}
