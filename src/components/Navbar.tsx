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
    <nav className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex items-center justify-between max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 h-16">
        <div className="flex items-center gap-3">
          {backHref && (
            <Link
              href={backHref}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)] transition-all duration-150"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
          )}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              {title || "Cloudscape"}
            </span>
          </Link>
        </div>
        {children && <div className="flex items-center gap-3">{children}</div>}
      </div>
    </nav>
  );
}
