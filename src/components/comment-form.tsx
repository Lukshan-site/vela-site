"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function CommentForm({
  videoId,
  signedIn,
}: {
  videoId: string;
  signedIn: boolean;
}) {
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (!signedIn) {
    return (
      <div className="rounded-md bg-surface border border-border p-4 text-sm text-muted">
        <a href="/login" className="text-accent hover:underline">Sign in</a> to leave a comment.
      </div>
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) { router.push("/login"); return; }
      const { error } = await supabase
        .from("comments")
        .insert({ video_id: videoId, user_id: userId, body: trimmed });
      if (error) { setError(error.message); return; }
      setBody("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder="Write a comment..."
        className="w-full rounded-md bg-surface border border-border px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/30 outline-none transition resize-y"
      />
      {error && <div className="text-xs text-accent">{error}</div>}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending || !body.trim()}
          className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-white hover:brightness-110 transition disabled:opacity-50"
        >
          {pending ? "Posting..." : "Post comment"}
        </button>
      </div>
    </form>
  );
}
