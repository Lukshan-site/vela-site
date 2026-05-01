"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import clsx from "clsx";

type Props = { videoId: string; initialFavorited: boolean; signedIn: boolean; };

export function FavoriteButton({ videoId, initialFavorited, signedIn }: Props) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  async function toggle() {
    if (!signedIn) { router.push("/login"); return; }
    const next = !favorited;
    setFavorited(next);
    startTransition(async () => {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) { setFavorited(!next); router.push("/login"); return; }
      const { error } = next
        ? await supabase.from("favorites").insert({ user_id: userId, video_id: videoId })
        : await supabase.from("favorites").delete().eq("user_id", userId).eq("video_id", videoId);
      if (error) { setFavorited(!next); }
    });
  }

  return (
    <button onClick={toggle} disabled={pending}
      className={clsx(
        "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition border",
        favorited ? "bg-gold/15 border-gold/40 text-gold" : "bg-surface border-border hover:border-neutral-500 text-neutral-200",
      )}
      aria-pressed={favorited}>
      <Star size={18} fill={favorited ? "currentColor" : "none"} className={favorited ? "animate-pop" : ""} />
      <span>{favorited ? "Saved" : "Save"}</span>
    </button>
  );
}
