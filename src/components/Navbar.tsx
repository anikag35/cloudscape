"use client";

import Link from "next/link";
import { Zap, ArrowLeft } from "lucide-react";

interface NavbarProps {
  backHref?: string;
  title?: string;
  children?: React.ReactNode;
}

export default function Navbar({ backHref, title, children }: NavbarProps) {
  return (
    <nav className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto border-b border-[var(--color-border)]">
      <div className="flex items-center gap-4">
        {backHref && (
          <Link href={backHref} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        )}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center">
            <Zap className="w-5 h-5 text-black" />
          </div>
          <span className="text-xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            {title || "Cloudscape"}
          </span>
        </Link>
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </nav>
  );
}
