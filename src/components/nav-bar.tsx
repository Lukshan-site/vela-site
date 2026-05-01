import Link from "next/link";
import { Heart, Star, User, Home, LogIn, UserPlus, Shield } from "lucide-react";
import type { Profile } from "@/lib/types";

export function NavBar({ profile }: { profile: Profile | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur supports-[backdrop-filter]:bg-bg/70">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-6">
        <Link href="/" className="font-bold text-lg tracking-tight">
          <span className="text-accent">▶</span>{" "}
          <span className="hidden sm:inline">Videos</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm flex-1">
          <NavLink href="/" icon={<Home size={16} />} label="Home" />
          {profile && (
            <>
              <NavLink href="/liked" icon={<Heart size={16} />} label="Liked" />
              <NavLink href="/favorites" icon={<Star size={16} />} label="Favorites" />
            </>
          )}
          {profile?.is_admin && (
            <NavLink href="/admin" icon={<Shield size={16} />} label="Admin" />
          )}
        </nav>

        {profile ? (
          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="flex items-center gap-2 rounded-full bg-surface hover:bg-surface2 px-3 py-1.5 transition"
            >
              <Avatar profile={profile} size={26} />
              <span className="text-sm hidden sm:inline">
                {profile.display_name || profile.username}
              </span>
            </Link>
            <form action="/logout" method="post">
              <button
                type="submit"
                className="text-sm text-muted hover:text-white transition"
              >
                Sign out
              </button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm hover:bg-surface transition"
            >
              <LogIn size={16} /> Sign in
            </Link>
            <Link
              href="/signup"
              className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-white hover:brightness-110 transition"
            >
              <UserPlus size={16} /> Sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

function NavLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-neutral-300 hover:bg-surface hover:text-white transition"
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </Link>
  );
}

export function Avatar({
  profile,
  size = 32,
}: {
  profile: Pick<Profile, "username" | "display_name" | "avatar_url">;
  size?: number;
}) {
  const initial = (profile.display_name || profile.username || "?")
    .charAt(0)
    .toUpperCase();
  if (profile.avatar_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={profile.avatar_url}
        alt=""
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full bg-gradient-to-br from-accent/70 to-gold/70 flex items-center justify-center text-white font-semibold"
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      {initial}
    </div>
  );
}
