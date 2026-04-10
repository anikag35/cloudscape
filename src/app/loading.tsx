import { Zap } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 rounded-lg bg-[var(--color-accent)] flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Zap className="w-6 h-6 text-black" />
        </div>
        <p className="text-sm text-[var(--color-text-dim)]">Loading...</p>
      </div>
    </div>
  );
}
