"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import {
  Zap,
  ArrowRight,
  Search,
  Terminal,
  FileText,
  AlertTriangle,
  CheckCircle,
  Activity,
  Shield,
  BarChart3,
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
   HERO DASHBOARD PREVIEW (dark inset card)
   ═══════════════════════════════════════════════════════ */

function HeroDashboard() {
  const events = [
    { t: "03:42:00", text: "CloudWatch alarm: 5xx > 50/min", c: "text-[#ef4444]", I: AlertTriangle },
    { t: "03:42:05", text: "Assuming read-only IAM role...", c: "text-[#888]", I: Shield },
    { t: "03:42:08", text: "Collecting metrics, logs, CloudTrail...", c: "text-[#888]", I: Search },
    { t: "03:42:15", text: "DB connections spiked 45 → 300", c: "text-[#f59e0b]", I: BarChart3 },
    { t: "03:42:22", text: "Searching web for known AWS issues...", c: "text-[#888]", I: Activity },
    { t: "03:42:28", text: "Root cause identified — 94% confidence", c: "text-[#f97316]", I: CheckCircle },
    { t: "03:42:30", text: "3 remediation options ready", c: "text-[#f97316]", I: Terminal },
  ];

  return (
    <div className="rounded-2xl overflow-hidden bg-[#1a1a2e] border border-[#2a2a40] shadow-lg">
      {/* Chrome bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#2a2a40] bg-[#141428]">
        <div className="flex items-center gap-2">
          <div className="w-[9px] h-[9px] rounded-full bg-[#ff5f57]" />
          <div className="w-[9px] h-[9px] rounded-full bg-[#febc2e]" />
          <div className="w-[9px] h-[9px] rounded-full bg-[#28c840]" />
          <span className="text-[10px] text-[#666] ml-2 font-mono">
            cloudscape — live investigation
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-[6px] h-[6px] rounded-full bg-[#f97316] pulse-live" />
          <span className="text-[9px] text-[#f97316] font-semibold tracking-widest uppercase">Live</span>
        </div>
      </div>

      <div className="p-4 text-white">
        {/* Incident header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#ef4444]/20 text-[#ef4444]">SEV-1</span>
              <span className="text-[9px] text-[#555] font-mono">INC-2847</span>
            </div>
            <h3 className="text-xs font-semibold text-[#ddd]">5xx errors &gt; 50/min on prod-api ALB</h3>
          </div>
          <div className="text-right flex-shrink-0 ml-3">
            <div className="text-[8px] text-[#555] uppercase tracking-wider">Confidence</div>
            <div className="text-base font-bold text-[#f97316] font-mono">94%</div>
          </div>
        </div>

        {/* Root cause */}
        <div className="rounded-lg border border-[#f97316]/20 bg-[#f97316]/5 p-2.5 mb-3">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-3 h-3 text-[#f97316] mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-[8px] text-[#f97316] font-bold uppercase tracking-widest mb-0.5">Root Cause</div>
              <div className="text-[10px] text-[#999] leading-relaxed">
                ECS auto-scale created 11 new tasks, exhausting RDS max_connections (200).
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-[3px]">
          {events.slice(0, 5).map((ev) => (
            <div key={ev.t} className="flex items-center gap-2">
              <span className="text-[9px] text-[#555] w-[46px] flex-shrink-0 font-mono">{ev.t}</span>
              <ev.I className={`w-2.5 h-2.5 flex-shrink-0 ${ev.c}`} />
              <span className={`text-[9px] leading-tight ${ev.c}`}>{ev.text}</span>
            </div>
          ))}
          <div className="text-[9px] text-[#444] pl-[58px]">+ 2 more events...</div>
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
              <HeroDashboard />
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
