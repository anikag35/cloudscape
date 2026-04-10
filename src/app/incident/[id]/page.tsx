"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Zap,
  ArrowLeft,
  Copy,
  Check,
  AlertTriangle,
  Shield,
  Clock,
  FileText,
  ExternalLink,
} from "lucide-react";

// TODO: Replace with real data from Supabase + investigation engine
const MOCK_EVENTS = [
  { time: "03:42:00", source: "system", content: "CloudWatch alarm triggered: \"5xx > 50/min\"", type: "info" },
  { time: "03:42:05", source: "system", content: "Assuming IAM role into your AWS account...", type: "info" },
  { time: "03:42:08", source: "cloudwatch", content: "Pulling CloudWatch metrics (ECS CPU, RDS connections, ALB 5xx)...", type: "info" },
  { time: "03:42:12", source: "cloudwatch", content: "DB connections spiked from 45 → 300 at 03:38 (max_connections: 200)", type: "metric_spike" },
  { time: "03:42:15", source: "cloudwatch", content: "ALB 5xx errors: 0 → 847/min starting at 03:39", type: "metric_spike" },
  { time: "03:42:18", source: "cloudtrail", content: "ECS UpdateService at 03:35 — desired count changed from 4 → 15", type: "deployment" },
  { time: "03:42:22", source: "agent", content: "Searching web for \"RDS connection exhaustion ECS auto-scaling\"...", type: "analysis" },
  { time: "03:42:25", source: "agent", content: "Checking https://health.aws.amazon.com for active outages...", type: "analysis" },
  { time: "03:42:28", source: "agent", content: "ROOT CAUSE (94% confidence): ECS auto-scaling event created 11 new tasks, each opening a connection pool of 20. Total connections (300) exceeded RDS db.t3.medium max_connections (200), causing connection refusals and 502 errors.", type: "analysis" },
  { time: "03:42:30", source: "system", content: "3 remediation options generated", type: "remediation" },
];

const MOCK_REMEDIATIONS = [
  {
    title: "Scale ECS to safe task count",
    description: "Reduce ECS desired count to 6 tasks, keeping total DB connections under max_connections limit.",
    commands: ["aws ecs update-service \\\n  --cluster prod \\\n  --service api \\\n  --desired-count 6"],
    risk: "safe" as const,
    cost: "No change",
    timeframe: "immediate" as const,
  },
  {
    title: "Resize RDS to db.r6g.large",
    description: "Increases max_connections from 200 to 800. Requires a brief reboot (~30s downtime with Multi-AZ).",
    commands: ["aws rds modify-db-instance \\\n  --db-instance-identifier db-prod-1 \\\n  --db-instance-class db.r6g.large \\\n  --apply-immediately"],
    risk: "caution" as const,
    cost: "+$180/mo",
    timeframe: "immediate" as const,
  },
  {
    title: "Add RDS Proxy for connection pooling",
    description: "RDS Proxy pools connections across all ECS tasks, preventing exhaustion regardless of task count. Long-term fix.",
    commands: ["# See generated Terraform below"],
    risk: "safe" as const,
    cost: "+$21/mo",
    timeframe: "long_term" as const,
    terraform: `resource "aws_db_proxy" "api" {
  name                   = "api-proxy"
  debug_logging          = false
  engine_family          = "POSTGRESQL"
  idle_client_timeout    = 1800
  require_tls            = true
  role_arn               = aws_iam_role.rds_proxy.arn
  vpc_subnet_ids         = var.private_subnet_ids

  auth {
    auth_scheme = "SECRETS"
    iam_auth    = "DISABLED"
    secret_arn  = aws_secretsmanager_secret.db.arn
  }
}`,
  },
];

const riskColors = {
  safe: { bg: "bg-[var(--color-success-dim)]", text: "text-[var(--color-success)]", label: "Safe" },
  caution: { bg: "bg-[var(--color-warning-dim)]", text: "text-[var(--color-warning)]", label: "Caution" },
  dangerous: { bg: "bg-[var(--color-danger-dim)]", text: "text-[var(--color-danger)]", label: "Dangerous" },
};

const sourceColors: Record<string, string> = {
  system: "text-[var(--color-text-dim)]",
  cloudwatch: "text-[var(--color-accent)]",
  cloudtrail: "text-[var(--color-sev3)]",
  logs: "text-[var(--color-warning)]",
  agent: "text-[var(--color-success)]",
  user: "text-[var(--color-text)]",
};

export default function IncidentPage() {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const copyCommand = (cmd: string, idx: number) => {
    navigator.clipboard.writeText(cmd);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto border-b border-[var(--color-border)]">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-sev1)] pulse-live" />
            <h1 className="font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              RDS connection exhaustion after ECS auto-scale
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--color-text-dim)] font-mono">SEV1</span>
          <button className="bg-[var(--color-surface)] border border-[var(--color-border)] text-sm px-4 py-2 rounded-lg hover:border-[var(--color-border-bright)] transition inline-flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Generate Post-Mortem
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Timeline — left column */}
          <div className="lg:col-span-3">
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-4 h-4 text-[var(--color-text-muted)]" />
              <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                Investigation Timeline
              </h2>
              <div className="w-2 h-2 rounded-full bg-[var(--color-success)] pulse-live ml-2" />
              <span className="text-xs text-[var(--color-text-dim)]">Live</span>
            </div>

            <div className="space-y-1">
              {MOCK_EVENTS.map((event, i) => {
                const isRootCause = event.content.startsWith("ROOT CAUSE");
                return (
                  <div
                    key={i}
                    className={`flex gap-3 py-2 px-3 rounded-lg animate-slide-in ${
                      isRootCause
                        ? "bg-[var(--color-success-dim)] border border-[var(--color-success)]/30"
                        : "hover:bg-[var(--color-surface)]"
                    }`}
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <span className="text-xs font-mono text-[var(--color-text-dim)] whitespace-nowrap mt-0.5">
                      {event.time}
                    </span>
                    <span className={`text-xs font-mono uppercase tracking-wider w-20 shrink-0 mt-0.5 ${sourceColors[event.source]}`}>
                      {event.source}
                    </span>
                    <span className={`text-sm leading-relaxed ${isRootCause ? "text-[var(--color-success)] font-semibold" : "text-[var(--color-text)]"}`}>
                      {event.content}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Remediations — right column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="w-4 h-4 text-[var(--color-text-muted)]" />
              <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                Remediation Options
              </h2>
            </div>

            <div className="space-y-4">
              {MOCK_REMEDIATIONS.map((rem, i) => {
                const risk = riskColors[rem.risk];
                return (
                  <div
                    key={i}
                    className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 animate-slide-in"
                    style={{ animationDelay: `${(MOCK_EVENTS.length + i) * 80}ms` }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-medium text-sm">{rem.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${risk.bg} ${risk.text}`}>
                          {risk.label}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]">
                          {rem.timeframe === "immediate" ? "Now" : "Long-term"}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] mb-3 leading-relaxed">
                      {rem.description}
                    </p>
                    {rem.cost && (
                      <p className="text-xs text-[var(--color-text-dim)] mb-3">
                        Cost impact: <span className="text-[var(--color-text)]">{rem.cost}</span>
                      </p>
                    )}

                    {/* Command block */}
                    <div className="relative bg-[var(--color-bg)] rounded-lg p-3 font-mono text-xs text-[var(--color-accent)] overflow-x-auto">
                      <pre className="whitespace-pre-wrap">{rem.commands.join("\n")}</pre>
                      <button
                        onClick={() => copyCommand(rem.commands.join("\n"), i)}
                        className="absolute top-2 right-2 p-1.5 rounded-md bg-[var(--color-surface)] hover:bg-[var(--color-surface-elevated)] transition"
                      >
                        {copiedIdx === i ? (
                          <Check className="w-3.5 h-3.5 text-[var(--color-success)]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-[var(--color-text-dim)]" />
                        )}
                      </button>
                    </div>

                    {/* Terraform block */}
                    {rem.terraform && (
                      <details className="mt-3">
                        <summary className="text-xs text-[var(--color-text-dim)] cursor-pointer hover:text-[var(--color-text-muted)] transition">
                          View Terraform code
                        </summary>
                        <div className="mt-2 bg-[var(--color-bg)] rounded-lg p-3 font-mono text-xs text-[var(--color-text-muted)] overflow-x-auto">
                          <pre className="whitespace-pre-wrap">{rem.terraform}</pre>
                        </div>
                      </details>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
