export const runtime = "edge";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { fetchAllCategories } from "@/lib/queries";
import { NewVideoForm } from "./new-video-form";

export default async function NewVideoPage() {
  if (!(await isAdmin())) redirect("/");
  const categories = await fetchAllCategories();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Add New Video</h1>
        <p className="text-muted text-sm mt-1">Paste a Google Drive share link to add a video.</p>
      </div>

      <div className="rounded-md bg-amber-500/10 border border-amber-500/30 p-4 text-sm text-amber-200">
        <strong>Important:</strong> Make sure the Drive video is set to{" "}
        <em>&quot;Anyone with the link → Viewer&quot;</em> — otherwise visitors won&apos;t be able to play it.
      </div>

      <NewVideoForm categories={categories} />
    </div>
  );
}
