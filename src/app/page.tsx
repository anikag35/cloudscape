"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import {
  Zap,
  ArrowRight,
  Search,
  Terminal,
  FileText,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════
   SCROLL-REVEAL HOOK
   ═══════════════════════════════════════════════════════ */

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const targets = el.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, []);

  return ref;
}

/* ═══════════════════════════════════════════════════════
   HERO STACKED CARDS — Cloudscape workflow visualization
   ═══════════════════════════════════════════════════════ */

function HeroAppPreview() {
  return (
    <div className="relative min-h-[420px] pt-2 pb-4">
      {/* Card 1 — Signal detected */}
      <div
        className="relative rounded-2xl border border-[#e5e5e0] bg-white shadow-sm px-5 py-4 mb-[-12px] mx-4"
        style={{ zIndex: 1 }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#fef2f2] border border-[#fecaca] flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4 text-[#ef4444]" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-[#999] uppercase tracking-wider mb-1">Signal Detected</div>
              <div className="text-[13px] font-semibold text-[#1a1a1a] leading-snug">Elevated 5xx errors on prod-api</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0 mt-1">
            <span className="w-2 h-2 rounded-full bg-[#f97316] pulse-live" />
            <span className="text-[9px] font-semibold text-[#f97316] uppercase tracking-wider">Active</span>
          </div>
        </div>
      </div>

      {/* Card 2 — Evidence collected */}
      <div
        className="relative rounded-2xl border border-[#e5e5e0] bg-white shadow-md px-5 py-4 mb-[-12px] mx-2"
        style={{ zIndex: 2 }}
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#eff6ff] border border-[#bfdbfe] flex items-center justify-center flex-shrink-0 mt-0.5">
            <Search className="w-4 h-4 text-[#3b82f6]" />
          </div>
          <div className="flex-1">
            <div className="text-[10px] font-bold text-[#999] uppercase tracking-wider mb-1">Evidence Collected</div>
            <div className="text-[13px] font-medium text-[#1a1a1a] leading-snug mb-2.5">CloudWatch metrics, CloudTrail events, deployment diff</div>
            <div className="flex items-center gap-1.5">
              {["CloudWatch", "CloudTrail", "Web Search"].map((s) => (
                <span key={s} className="text-[9px] font-medium text-[#6b6b6b] bg-[#f5f5f0] border border-[#e5e5e0] rounded-full px-2 py-0.5">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Card 3 — Root cause (hero card, most prominent) */}
      <div
        className="relative rounded-2xl border-2 border-[#fdba74] bg-[#fff7ed] shadow-lg px-5 py-5 mb-[-12px]"
        style={{ zIndex: 3 }}
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#f97316] flex items-center justify-center flex-shrink-0 mt-0.5">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-[#f97316] uppercase tracking-wider">Root Cause Identified</span>
              <span className="text-[9px] font-bold text-[#f97316] bg-white border border-[#fdba74] rounded-full px-2 py-0.5">94% confidence</span>
            </div>
            <div className="text-[14px] font-semibold text-[#1a1a1a] leading-snug">
              ECS scale-out exhausted RDS connections
            </div>
            <div className="text-[12px] text-[#6b6b6b] leading-relaxed mt-1">
              Auto-scaling created 11 new ECS tasks, overwhelming the RDS max_connections limit of 200.
            </div>
          </div>
        </div>
      </div>

      {/* Card 4 — Remediation generated */}
      <div
        className="relative rounded-2xl border border-[#e5e5e0] bg-white shadow-lg px-5 py-4 mx-2"
        style={{ zIndex: 4 }}
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#f0fdf4] border border-[#bbf7d0] flex items-center justify-center flex-shrink-0 mt-0.5">
            <Terminal className="w-4 h-4 text-[#22c55e]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <div className="text-[10px] font-bold text-[#999] uppercase tracking-wider">Remediation Generated</div>
              <span className="text-[9px] font-medium text-[#22c55e] bg-[#f0fdf4] border border-[#bbf7d0] rounded-full px-2 py-0.5">Ready to apply</span>
            </div>
            <div className="text-[13px] font-medium text-[#1a1a1a] leading-snug">Increase max_connections to 500 and cap ECS desired count</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════ */

export default function LandingPage() {
  const revealRef = useScrollReveal();

  return (
    <div ref={revealRef} className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">

      {/* ─── NAVBAR ─── */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <nav className="flex items-center justify-between max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 h-16" role="navigation" aria-label="Main">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Home">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              Cloudscape
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Setup", href: "/setup" },
            ].map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="px-3.5 py-2 rounded-lg text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)] transition-all duration-150"
              >
                {l.label}
              </Link>
            ))}
            {["Features", "How It Works"].map((l) => (
              <a
                key={l}
                href={`#${l.toLowerCase().replace(/\s+/g, "-")}`}
                className="px-3.5 py-2 rounded-lg text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)] transition-all duration-150"
              >
                {l}
              </a>
            ))}
          </div>

          <Link href="/dashboard" className="btn-primary btn-sm">
            Open Dashboard
          </Link>
        </nav>
      </header>

      {/* ═══════════════════════════════════════════════════
         HERO — two-column
         ═══════════════════════════════════════════════════ */}
      <section className="py-24 md:py-32" role="region" aria-label="Hero">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: copy */}
            <div>
              <div className="animate-fade-up kicker mb-5">AI Incident Commander</div>

              <h1
                className="animate-fade-up-d1 text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.08] tracking-tight mb-6"
                style={{ fontFamily: "var(--font-display)" }}
              >
                It&apos;s 3&nbsp;a.m.{" "}
                <span className="text-[var(--color-accent)]">
                  We already know what broke.
                </span>
              </h1>

              <p className="animate-fade-up-d2 text-lg text-[var(--color-text-muted)] max-w-lg mb-10 leading-relaxed">
                When an alert fires, Cloudscape pulls your AWS logs, traces deployments, and uses AI to pinpoint the root cause — so you fix, not investigate.
              </p>

              <div className="animate-fade-up-d3 flex flex-col sm:flex-row items-start gap-3">
                <Link href="/dashboard" className="btn-primary group">
                  Try the Demo
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-150" />
                </Link>
                <Link href="/setup" className="btn-ghost">
                  Connect Your AWS
                </Link>
              </div>
            </div>

            {/* Right: dashboard preview */}
            <div className="animate-fade-up-d4 lg:pl-4">
              <HeroAppPreview />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
         FEATURES
         ═══════════════════════════════════════════════════ */}
      <section
        id="features"
        className="py-20 md:py-24 bg-[var(--color-surface)] border-y border-[var(--color-border)]"
        role="region"
        aria-label="Features"
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
          <div className="max-w-2xl mb-14">
            <div className="reveal kicker mb-3">Why It Matters</div>
            <h2
              className="reveal text-3xl md:text-4xl font-extrabold tracking-tight leading-[1.15] mb-4"
              style={{ fontFamily: "var(--font-display)", transitionDelay: "100ms" }}
            >
              From alert to resolution brief. Fully automated.
            </h2>
            <p className="reveal text-[var(--color-text-muted)] text-base leading-relaxed" style={{ transitionDelay: "200ms" }}>
              Cloudscape autonomously collects CloudWatch metrics, logs, and CloudTrail events, correlates them with real-time web research, and delivers a root cause with remediation commands.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Search,
                title: "Autonomous investigation",
                desc: "Pulls CloudWatch metrics, logs, and CloudTrail events. Cross-references with real-time web search for AWS outages and known bugs.",
              },
              {
                icon: Terminal,
                title: "Copy-paste remediation",
                desc: "Generates ranked fixes with exact AWS CLI commands, Terraform snippets, risk levels, and cost estimates.",
              },
              {
                icon: FileText,
                title: "Instant post-mortems",
                desc: "Blameless post-mortems in Google SRE format — timeline, root cause, action items, and lessons learned.",
              },
            ].map((card, i) => (
              <div
                key={card.title}
                className="reveal card p-7 flex flex-col"
                style={{ transitionDelay: `${i * 120}ms` }}
              >
                <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-muted)] flex items-center justify-center mb-5">
                  <card.icon className="w-5 h-5 text-[var(--color-accent)]" />
                </div>
                <h3 className="text-base font-bold tracking-tight mb-2" style={{ fontFamily: "var(--font-display)" }}>
                  {card.title}
                </h3>
                <p className="text-sm text-[var(--color-text-muted)] leading-relaxed flex-1">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
         HOW IT WORKS
         ═══════════════════════════════════════════════════ */}
      <section
        id="how-it-works"
        className="py-20 md:py-24"
        role="region"
        aria-label="How it works"
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Left: heading */}
            <div>
              <div className="reveal kicker mb-3">How It Works</div>
              <h2
                className="reveal text-3xl md:text-4xl font-extrabold tracking-tight leading-[1.15] mb-4"
                style={{ fontFamily: "var(--font-display)", transitionDelay: "100ms" }}
              >
                Alert to answer in under 30 seconds
              </h2>
              <p className="reveal text-[var(--color-text-muted)] text-base leading-relaxed" style={{ transitionDelay: "200ms" }}>
                Four stages. Fully automated. You just read the result and apply the fix.
              </p>
            </div>

            {/* Right: steps card */}
            <div className="reveal card p-8" style={{ transitionDelay: "150ms" }}>
              <div className="space-y-6">
                {[
                  { n: 1, title: "Alert fires", desc: "CloudWatch alarm triggers a webhook into Cloudscape." },
                  { n: 2, title: "Data collected", desc: "Assumes read-only IAM role, pulls metrics, logs, and CloudTrail in parallel." },
                  { n: 3, title: "AI analyzes", desc: "Perplexity Sonar Reasoning Pro correlates data with live web search for outages and known bugs." },
                  { n: 4, title: "You get a brief", desc: "Root cause, CLI remediation commands, and a full SRE-format post-mortem." },
                ].map((s) => (
                  <div key={s.n} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
                      {s.n}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold mb-0.5" style={{ fontFamily: "var(--font-display)" }}>
                        {s.title}
                      </h3>
                      <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
         DEMO CTA
         ═══════════════════════════════════════════════════ */}
      <section
        className="py-20 md:py-24 bg-[var(--color-surface)] border-y border-[var(--color-border)]"
        role="region"
        aria-label="Demo"
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
          <div className="reveal max-w-2xl mx-auto text-center">
            <div className="kicker mb-3">Live Demo</div>
            <h2
              className="text-3xl md:text-4xl font-extrabold tracking-tight leading-[1.15] mb-4"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Try it without an AWS account
            </h2>
            <p className="text-[var(--color-text-muted)] mb-10 max-w-md mx-auto leading-relaxed">
              Three built-in scenarios with realistic mock AWS data and real Perplexity AI analysis. No setup needed.
            </p>
            <Link href="/dashboard" className="btn-primary group">
              Launch Demo
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-150" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-[var(--color-border)]" role="contentinfo">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[var(--color-accent)] flex items-center justify-center">
                <Zap className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm font-bold" style={{ fontFamily: "var(--font-display)" }}>Cloudscape</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-[var(--color-text-muted)]">
              <Link href="/dashboard" className="hover:text-[var(--color-text)] transition-colors duration-150">Dashboard</Link>
              <Link href="/setup" className="hover:text-[var(--color-text)] transition-colors duration-150">Setup</Link>
              <a href="#features" className="hover:text-[var(--color-text)] transition-colors duration-150">Features</a>
              <a href="#how-it-works" className="hover:text-[var(--color-text)] transition-colors duration-150">How It Works</a>
            </div>

            <p className="text-xs text-[var(--color-text-dim)]">
              Next.js 15 &middot; Perplexity Sonar Pro &middot; Supabase &middot; AWS SDK v3
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
