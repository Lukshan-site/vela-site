"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

export function ProfileEditForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSaved(false);
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.from("profiles").update({
        display_name: displayName || null,
        bio: bio || null,
        avatar_url: avatarUrl || null,
      }).eq("id", profile.id);
      if (error) { setError(error.message); return; }
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 1800);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-xl">
      <Field label="Display name" value={displayName} onChange={setDisplayName} />
      <Field label="Avatar URL" value={avatarUrl} onChange={setAvatarUrl} placeholder="https://..." />
      <label className="block">
        <span className="text-sm text-neutral-300">Bio</span>
        <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)}
          className="mt-1 w-full rounded-md bg-surface2 border border-border px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/30 outline-none transition resize-y" />
      </label>
      {error && <div className="text-sm text-accent">{error}</div>}
      {saved && <div className="text-sm text-emerald-400">Saved ✓</div>}
      <button type="submit" disabled={pending}
        className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white hover:brightness-110 transition disabled:opacity-50">
        {pending ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm text-neutral-300">{label}</span>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="mt-1 w-full rounded-md bg-surface2 border border-border px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/30 outline-none transition" />
    </label>
  );
}
