"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { extractDriveId } from "@/lib/drive";
import type { Category } from "@/lib/types";

type Result = {
  line: string;
  title: string;
  status: "ok" | "error" | "skip";
  message: string;
};

export function ImportForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [pending, startTransition] = useTransition();

  function parseLine(line: string): { title: string; driveId: string | null } | null {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return null;

    // Format: "Title | Drive URL" or "Title | FileID"
    const pipeIdx = trimmed.indexOf("|");
    if (pipeIdx === -1) {
      // Maybe it's just a URL with no title — use filename from URL or raw
      const driveId = extractDriveId(trimmed);
      return driveId ? { title: trimmed.slice(0, 60), driveId } : null;
    }

    const title = trimmed.slice(0, pipeIdx).trim();
    const urlPart = trimmed.slice(pipeIdx + 1).trim();
    const driveId = extractDriveId(urlPart);
    return { title: title || urlPart, driveId };
  }

  function onImport() {
    const lines = text.split("\n").filter((l) => l.trim());
    setResults([]);

    startTransition(async () => {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id ?? null;

      const newResults: Result[] = [];

      for (const line of lines) {
        const parsed = parseLine(line);
        if (!parsed) {
          newResults.push({ line, title: line, status: "skip", message: "Skipped (blank or comment)" });
          continue;
        }
        const { title, driveId } = parsed;
        if (!driveId) {
          newResults.push({ line, title, status: "error", message: "Could not extract Drive File ID" });
          continue;
        }

        // Check duplicate
        const { data: existing } = await supabase
          .from("videos")
          .select("id")
          .eq("drive_file_id", driveId)
          .maybeSingle();

        if (existing) {
          newResults.push({ line, title, status: "skip", message: "Already exists — skipped" });
          continue;
        }

        const { error } = await supabase.from("videos").insert({
          drive_file_id: driveId,
          title,
          category_id: categoryId || null,
          created_by: userId,
        });

        if (error) {
          newResults.push({ line, title, status: "error", message: error.message });
        } else {
          newResults.push({ line, title, status: "ok", message: "Added ✓" });
        }
      }

      setResults(newResults);
      router.refresh();
    });
  }

  const okCount = results.filter((r) => r.status === "ok").length;
  const errCount = results.filter((r) => r.status === "error").length;

  return (
    <div className="space-y-5">
      {/* Category picker */}
      <div>
        <span className="text-sm text-neutral-300 block mb-2">Category for all imported videos (optional)</span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategoryId("")}
            className={`rounded-full px-3 py-1 text-sm border transition ${
              !categoryId ? "bg-accent text-white border-accent" : "border-border text-neutral-300 hover:border-neutral-500"
            }`}
          >
            None
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryId(c.id)}
              className={`rounded-full px-3 py-1 text-sm border transition ${
                categoryId === c.id
                  ? "bg-accent text-white border-accent"
                  : "border-border text-neutral-300 hover:border-neutral-500"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Text area */}
      <div>
        <span className="text-sm text-neutral-300 block mb-2">
          Video list — one per line
        </span>
        <textarea
          rows={12}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Fishing Video 1 | https://drive.google.com/file/d/ABC123/view\nFishing Video 2 | https://drive.google.com/file/d/DEF456/view\n# Lines starting with # are ignored`}
          className="w-full rounded-md bg-surface2 border border-border px-3 py-2 text-sm font-mono focus:border-accent focus:ring-2 focus:ring-accent/30 outline-none transition resize-y"
        />
        <p className="text-xs text-muted mt-1">
          Format: <code className="bg-surface px-1 rounded">Title | Drive link</code> — duplicates are skipped automatically.
        </p>
      </div>

      {/* Import button */}
      <button
        onClick={onImport}
        disabled={pending || !text.trim()}
        className="rounded-full bg-accent px-6 py-2 text-sm font-medium text-white hover:brightness-110 transition disabled:opacity-50 flex items-center gap-2"
      >
        {pending && <Loader size={14} className="animate-spin" />}
        {pending ? "Importing…" : "Import All"}
      </button>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <div className="text-sm font-medium">
            {okCount > 0 && <span className="text-emerald-400">{okCount} added </span>}
            {errCount > 0 && <span className="text-accent">{errCount} errors </span>}
            {results.filter((r) => r.status === "skip").length > 0 && (
              <span className="text-muted">{results.filter((r) => r.status === "skip").length} skipped</span>
            )}
          </div>
          <div className="rounded-md border border-border overflow-hidden divide-y divide-border">
            {results.map((r, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-2 bg-surface text-sm">
                {r.status === "ok" && <CheckCircle size={15} className="text-emerald-400 mt-0.5 shrink-0" />}
                {r.status === "error" && <XCircle size={15} className="text-accent mt-0.5 shrink-0" />}
                {r.status === "skip" && <span className="text-muted mt-0.5 shrink-0 text-xs">–</span>}
                <div className="min-w-0">
                  <p className="font-medium text-neutral-200 truncate">{r.title}</p>
                  <p className="text-xs text-muted">{r.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
