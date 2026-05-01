export const runtime = "edge";
import Link from "next/link";
import { VideoGrid } from "@/components/video-grid";
import { fetchVideosWithCounts, fetchAllCategories } from "@/lib/queries";
import { getCurrentProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;

  const [videos, categories, profile] = await Promise.all([
    fetchVideosWithCounts(undefined, { categorySlug: cat }),
    fetchAllCategories(),
    getCurrentProfile(),
  ]);

  return (
    <div className="space-y-6">
      {!profile && (
        <div className="rounded-xl bg-gradient-to-r from-accent/15 via-surface to-surface border border-border p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold">Welcome 👋</h2>
            <p className="text-muted mt-1 text-sm">Sign up to like, save, and comment on videos.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/signup" className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:brightness-110 transition">Sign up</Link>
            <Link href="/login" className="rounded-full border border-border px-4 py-2 text-sm hover:bg-surface transition">Sign in</Link>
          </div>
        </div>
      )}

      {/* Category filter tabs */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Link
            href="/"
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition border ${
              !cat ? "bg-accent text-white border-accent" : "border-border text-neutral-300 hover:border-neutral-500"
            }`}
          >
            All
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/?cat=${c.slug}`}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition border ${
                cat === c.slug
                  ? "bg-accent text-white border-accent"
                  : "border-border text-neutral-300 hover:border-neutral-500"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      <div className="flex items-baseline justify-between">
        <h1 className="text-lg font-semibold">
          {cat ? categories.find((c) => c.slug === cat)?.name ?? "Videos" : "Latest Videos"}
        </h1>
        <span className="text-xs text-muted">{videos.length} videos</span>
      </div>

      <VideoGrid
        videos={videos}
        empty={
          profile?.is_admin
            ? "No videos yet. Go to /admin/new to add your first one."
            : "No videos yet. Check back soon!"
        }
      />
    </div>
  );
}
