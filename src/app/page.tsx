import Link from "next/link";
import {
  Zap,
  Shield,
  FileText,
  Activity,
  ArrowRight,
  Terminal,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center">
            <Zap className="w-5 h-5 text-black" />
          </div>
          <span
            className="text-xl font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Cloudscape
          </span>
        </div>
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors text-sm"
          >
            Dashboard
          </Link>
          <Link
            href="/setup"
            className="bg-[var(--color-accent)] text-black px-4 py-2 rounded-lg text-sm font-medium hover:brightness-110 transition"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-5xl mx-auto px-8 pt-24 pb-32">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full px-4 py-1.5 mb-8">
            <div className="w-2 h-2 rounded-full bg-[var(--color-success)] pulse-live" />
            <span className="text-xs text-[var(--color-text-muted)]">
              Powered by Perplexity Agent API
            </span>
          </div>

          <h1
            className="text-6xl font-bold tracking-tight leading-[1.1] mb-6"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Your infrastructure breaks at 2am.
            <br />
            <span className="text-[var(--color-accent)]">
              Cloudscape figures out why.
            </span>
          </h1>

          <p className="text-xl text-[var(--color-text-muted)] max-w-2xl mx-auto mb-12 leading-relaxed">
            AI incident commander that connects to your AWS account, investigates
            outages autonomously, and generates post-mortems — before you finish
            your coffee.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/setup"
              className="bg-[var(--color-accent)] text-black px-8 py-3 rounded-lg font-semibold text-lg hover:brightness-110 transition inline-flex items-center gap-2 glow-accent"
            >
              Connect AWS
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/dashboard"
              className="bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] px-8 py-3 rounded-lg font-semibold text-lg hover:border-[var(--color-border-bright)] transition"
            >
              View Demo
            </Link>
          </div>
        </div>

        {/* Terminal preview */}
        <div className="mt-24 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden glow-accent">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border)]">
            <div className="w-3 h-3 rounded-full bg-[var(--color-danger)]" />
            <div className="w-3 h-3 rounded-full bg-[var(--color-warning)]" />
            <div className="w-3 h-3 rounded-full bg-[var(--color-success)]" />
            <span className="text-xs text-[var(--color-text-dim)] ml-2 font-mono">
              cloudscape — incident investigation
            </span>
          </div>
          <div
            className="p-6 text-sm leading-7"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <p className="text-[var(--color-text-dim)]">
              03:42:00 &nbsp;CloudWatch alarm triggered: &quot;5xx &gt; 50/min&quot;
            </p>
            <p className="text-[var(--color-text-muted)]">
              03:42:05 &nbsp;Assuming IAM role into your AWS account...
            </p>
            <p className="text-[var(--color-text-muted)]">
              03:42:08 &nbsp;Pulling CloudWatch metrics, logs, CloudTrail events...
            </p>
            <p className="text-[var(--color-warning)]">
              03:42:15 &nbsp;DB connections spiked 45 → 300 (max: 200)
            </p>
            <p className="text-[var(--color-text-muted)]">
              03:42:18 &nbsp;CloudTrail: ECS UpdateService — desired 4 → 15
            </p>
            <p className="text-[var(--color-text-muted)]">
              03:42:22 &nbsp;Searching web for &quot;RDS connection exhaustion ECS
              scale-up&quot;...
            </p>
            <p className="text-[var(--color-success)] font-semibold">
              03:42:28 &nbsp;ROOT CAUSE (94% confidence): ECS auto-scale created
              11 new tasks, exhausting RDS max_connections (200)
            </p>
            <p className="text-[var(--color-accent)]">
              03:42:30 &nbsp;3 remediation options generated. Post-mortem ready.
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Activity,
              title: "Autonomous Investigation",
              desc: "Pulls CloudWatch metrics, logs, and CloudTrail events. Correlates them with web-searched known issues.",
            },
            {
              icon: Terminal,
              title: "Copy-Paste Fixes",
              desc: "Remediation options with exact AWS CLI commands, risk levels, and cost impact estimates.",
            },
            {
              icon: FileText,
              title: "Instant Post-Mortems",
              desc: "Generates blameless post-mortems in Google SRE format with timeline, action items, and lessons learned.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 hover:border-[var(--color-border-bright)] transition"
            >
              <f.icon className="w-8 h-8 text-[var(--color-accent)] mb-4" />
              <h3
                className="text-lg font-semibold mb-2"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {f.title}
              </h3>
              <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="mt-32 text-center">
          <h2
            className="text-3xl font-bold mb-16"
            style={{ fontFamily: "var(--font-display)" }}
          >
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Connect AWS", desc: "One-click CloudFormation — creates a read-only IAM role" },
              { step: "02", title: "Alert fires", desc: "CloudWatch alarm → webhook → Cloudscape starts investigating" },
              { step: "03", title: "AI investigates", desc: "Perplexity correlates metrics + logs + web research" },
              { step: "04", title: "Fix & document", desc: "Get CLI commands, cost estimates, and a full post-mortem" },
            ].map((s) => (
              <div key={s.step}>
                <div className="text-4xl font-bold text-[var(--color-accent)] mb-3" style={{ fontFamily: "var(--font-mono)" }}>
                  {s.step}
                </div>
                <h3 className="font-semibold mb-2" style={{ fontFamily: "var(--font-display)" }}>
                  {s.title}
                </h3>
                <p className="text-sm text-[var(--color-text-muted)]">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] py-8 text-center text-xs text-[var(--color-text-dim)]">
        Built for the Perplexity x Codelogy Hackathon — Track B: Best Computer-Powered Product
      </footer>
    </div>
  );
}
