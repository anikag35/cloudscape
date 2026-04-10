import Link from "next/link";
import { Zap } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center mx-auto mb-6">
          <Zap className="w-6 h-6 text-[var(--color-text-dim)]" />
        </div>
        <h1
          className="text-6xl font-bold text-[var(--color-text-dim)] mb-2"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          404
        </h1>
        <p className="text-[var(--color-text-muted)] mb-6">This page doesn&apos;t exist</p>
        <Link
          href="/dashboard"
          className="text-sm text-[var(--color-accent)] hover:underline"
        >
          &larr; Back to dashboard
        </Link>
      </div>
    </div>
  );
}
