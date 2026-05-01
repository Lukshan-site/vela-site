"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="rounded-xl bg-surface border border-border p-6 sm:p-8">
        <h1 className="text-2xl font-semibold mb-1">Sign in</h1>
        <p className="text-muted text-sm mb-6">Enter your email and password.</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Email" type="email" value={email} onChange={setEmail} required autoFocus />
          <Field label="Password" type="password" value={password} onChange={setPassword} required />
          {error && (
            <div className="rounded-md bg-accent/15 border border-accent/30 px-3 py-2 text-sm text-accent">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-accent py-2.5 font-medium text-white hover:brightness-110 transition disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-sm text-muted text-center">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-accent hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  label, type, value, onChange, required, autoFocus,
}: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; required?: boolean; autoFocus?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm text-neutral-300">{label}</span>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        required={required} autoFocus={autoFocus}
        className="mt-1 w-full rounded-md bg-surface2 border border-border px-3 py-2 text-sm focus:border-accent focus:ring-2 focus:ring-accent/30 outline-none transition"
      />
    </label>
  );
}
