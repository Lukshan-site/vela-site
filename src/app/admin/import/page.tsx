export const runtime = "edge";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { fetchAllCategories } from "@/lib/queries";
import { ImportForm } from "./import-form";

export default async function ImportPage() {
  if (!(await isAdmin())) redirect("/");
  const categories = await fetchAllCategories();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Bulk Import Videos</h1>
        <p className="text-muted text-sm mt-1">
          Paste one video per line in the format:{" "}
          <code className="bg-surface2 px-1 rounded text-xs">Video Name | https://drive.google.com/file/d/FILE_ID/view</code>
        </p>
      </div>

      <ImportForm categories={categories} />
    </div>
  );
}
