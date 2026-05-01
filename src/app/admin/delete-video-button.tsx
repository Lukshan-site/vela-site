"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function DeleteVideoButton({ id, title }: { id: string; title: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onDelete() {
    if (!confirm(`Delete "${title}"?`)) return;
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.from("videos").delete().eq("id", id);
      if (error) { alert(error.message); return; }
      router.refresh();
    });
  }

  return (
    <button onClick={onDelete} disabled={pending}
      className="rounded-md p-2 text-muted hover:text-accent hover:bg-accent/10 transition" aria-label="Delete">
      <Trash2 size={16} />
    </button>
  );
}
