"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    if (!data.session) {
      setInfo("Check your email for a confirmation link, then sign in.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="rounded-xl bg-surface border border-border p-6 sm:p-8">
        <h1 className="text-2xl font-semibold mb-1">Create account</h1>
        <p className="text-muted text-sm mb-6">Choose an email and a password (min 6 chars).</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm text-neutral-300">Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus
              className="mt-1 w-full rounded-md bg-surface2 border border-border px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/30 outline-none transition" />
          </label>
          <label className="block">
            <span className="text-sm text-neutral-300">Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
              className="mt-1 w-full rounded-md bg-surface2 border border-border px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/30 outline-none transition" />
          </label>
          {error && (
            <div className="rounded-md bg-accent/15 border border-accent/30 px-3 py-2 text-sm text-accent">{error}</div>
          )}
          {info && (
            <div className="rounded-md bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 text-sm text-emerald-400">{info}</div>
          )}
          <button type="submit" disabled={loading}
            className="w-full rounded-md bg-accent py-2.5 font-medium text-white hover:brightness-110 transition disabled:opacity-50">
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-sm text-muted text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
