"use client";

import { useState } from "react";
import Link from "next/link";
import { Zap, Loader2 } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/db";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (authError) {
        setError(authError.message);
      } else {
        setSent(true);
      }
    } catch {
      setError("Failed to send magic link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-accent)] flex items-center justify-center mx-auto mb-4">
            <Zap className="w-7 h-7 text-black" />
          </div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            Sign in to Cloudscape
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-2">
            AI Incident Commander for AWS
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-[var(--color-danger-dim)] border border-[var(--color-danger)]/30 rounded-lg px-4 py-2">
            <p className="text-sm text-[var(--color-danger)]">{error}</p>
          </div>
        )}

        {sent ? (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 text-center">
            <p className="text-sm text-[var(--color-text-muted)]">
              Check your email for a magic link to sign in.
            </p>
            <p className="text-xs text-[var(--color-text-dim)] mt-2">{email}</p>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm text-[var(--color-text-muted)] mb-2 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--color-accent)] text-black px-6 py-3 rounded-lg font-semibold hover:brightness-110 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : "Send Magic Link"}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-[var(--color-text-dim)] mt-6">
          <Link href="/" className="hover:text-[var(--color-text-muted)] transition">
            &larr; Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
