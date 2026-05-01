"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { extractDriveId, thumbnailUrl } from "@/lib/drive";
import type { Category } from "@/lib/types";

export function NewVideoForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [showNewCat, setShowNewCat] = useState(false);
  const [pending, startTransition] = useTransition();
  const [catPending, setCatPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localCats, setLocalCats] = useState<Category[]>(categories);

  const driveId = useMemo(() => extractDriveId(url), [url]);

  async function createCategory() {
    if (!newCatName.trim()) return;
    setCatPending(true);
    const supabase = createClient();
    const slug = newCatName.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const { data, error } = await supabase
      .from("categories")
      .insert({ name: newCatName.trim(), slug })
      .select()
      .single();
    setCatPending(false);
    if (error) { setError(error.message); return; }
    setLocalCats((prev) => [...prev, data]);
    setCategoryId(data.id);
    setNewCatName("");
    setShowNewCat(false);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!driveId) { setError("Please paste a valid Google Drive link."); return; }
    if (!title.trim()) { setError("Please enter a title."); return; }
    startTransition(async () => {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      const { data, error } = await supabase.from("videos")
        .insert({
          drive_file_id: driveId,
          title: title.trim(),
          description: description.trim() || null,
          category_id: categoryId || null,
          created_by: userId ?? null,
        })
        .select("id").single();
      if (error) { setError(error.message); return; }
      router.push(`/videos/${data.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Drive URL */}
      <label className="block">
        <span className="text-sm text-neutral-300">Drive link or File ID</span>
        <input type="text" value={url} onChange={(e) => setUrl(e.target.value)}
          placeholder="https://drive.google.com/file/d/.../view"
          className="mt-1 w-full rounded-md bg-surface2 border border-border px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/30 outline-none transition" required />
        {url && (
          <span className="text-xs mt-1 inline-block">
            {driveId
              ? <span className="text-emerald-400">✓ File ID: {driveId}</span>
              : <span className="text-accent">✗ Doesn&apos;t look like a Drive link</span>}
          </span>
        )}
      </label>

      {/* Thumbnail preview */}
      {driveId && (
        <div className="rounded-lg overflow-hidden border border-border bg-surface aspect-video max-w-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={thumbnailUrl(driveId, 640)} alt="Thumbnail preview" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Title */}
      <label className="block">
        <span className="text-sm text-neutral-300">Title</span>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
          className="mt-1 w-full rounded-md bg-surface2 border border-border px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/30 outline-none transition" />
      </label>

      {/* Description */}
      <label className="block">
        <span className="text-sm text-neutral-300">Description (optional)</span>
        <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
          className="mt-1 w-full rounded-md bg-surface2 border border-border px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/30 outline-none transition resize-y" />
      </label>

      {/* Category */}
      <div className="space-y-2">
        <span className="text-sm text-neutral-300 block">Category (optional)</span>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setCategoryId("")}
            className={`rounded-full px-3 py-1 text-sm border transition ${!categoryId ? "bg-accent text-white border-accent" : "border-border text-neutral-300 hover:border-neutral-500"}`}>
            None
          </button>
          {localCats.map((c) => (
            <button key={c.id} type="button" onClick={() => setCategoryId(c.id)}
              className={`rounded-full px-3 py-1 text-sm border transition ${categoryId === c.id ? "bg-accent text-white border-accent" : "border-border text-neutral-300 hover:border-neutral-500"}`}>
              {c.name}
            </button>
          ))}
          <button type="button" onClick={() => setShowNewCat(!showNewCat)}
            className="rounded-full px-3 py-1 text-sm border border-dashed border-border text-neutral-400 hover:border-neutral-500 transition flex items-center gap-1">
            <Plus size={13} /> New category
          </button>
        </div>

        {showNewCat && (
          <div className="flex gap-2 mt-2">
            <input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Category name (e.g. FK, SG, WS)"
              className="flex-1 rounded-md bg-surface2 border border-border px-3 py-2 text-sm focus:border-accent outline-none transition" />
            <button type="button" onClick={createCategory} disabled={catPending || !newCatName.trim()}
              className="rounded-md bg-surface2 border border-border px-4 py-2 text-sm hover:border-accent transition disabled:opacity-50">
              {catPending ? "..." : "Create"}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-accent/15 border border-accent/30 px-3 py-2 text-sm text-accent">{error}</div>
      )}

      <button type="submit" disabled={pending}
        className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white hover:brightness-110 transition disabled:opacity-50">
        {pending ? "Adding..." : "Add Video"}
      </button>
    </form>
  );
}
