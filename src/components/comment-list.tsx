"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "./nav-bar";
import type { Comment } from "@/lib/types";

export function CommentList({
  comments,
  currentUserId,
}: {
  comments: Comment[];
  currentUserId: string | null;
}) {
  if (comments.length === 0) {
    return (
      <div className="text-sm text-muted py-6 text-center">
        No comments yet. Be the first!
      </div>
    );
  }
  return (
    <ul className="space-y-4">
      {comments.map((c) => (
        <CommentItem key={c.id} comment={c} currentUserId={currentUserId} />
      ))}
    </ul>
  );
}

function CommentItem({
  comment,
  currentUserId,
}: {
  comment: Comment;
  currentUserId: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [removed, setRemoved] = useState(false);
  const router = useRouter();
  const isOwner = currentUserId === comment.user_id;

  function onDelete() {
    if (!confirm("Delete this comment?")) return;
    setRemoved(true);
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.from("comments").delete().eq("id", comment.id);
      if (error) { setRemoved(false); return; }
      router.refresh();
    });
  }

  if (removed) return null;

  const profile = comment.profile;
  const username = profile?.username ?? "user";
  const display = profile?.display_name || username;

  return (
    <li className="flex gap-3">
      <Link href={`/u/${username}`} className="shrink-0">
        <Avatar
          profile={{ username, display_name: profile?.display_name ?? null, avatar_url: profile?.avatar_url ?? null }}
          size={36}
        />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link href={`/u/${username}`} className="text-sm font-medium hover:underline">{display}</Link>
          <span className="text-xs text-muted">{formatDate(comment.created_at)}</span>
          {isOwner && (
            <button onClick={onDelete} disabled={pending}
              className="ml-auto text-muted hover:text-accent transition" title="Delete">
              <Trash2 size={14} />
            </button>
          )}
        </div>
        <p className="text-sm text-neutral-200 whitespace-pre-wrap break-words mt-0.5">{comment.body}</p>
      </div>
    </li>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const min = Math.round(diffMs / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h`;
  const days = Math.round(hr / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString();
}
