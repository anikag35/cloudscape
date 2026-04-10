"use client";

import Link from "next/link";
import { Zap, Plus, Activity, Clock, CheckCircle, AlertTriangle } from "lucide-react";

// TODO: Replace with real Supabase query
const MOCK_INCIDENTS = [
  {
    id: "inc-001",
    title: "RDS connection exhaustion after ECS auto-scale",
    severity: "sev1" as const,
    status: "resolved" as const,
    started_at: "2026-04-10T03:42:00Z",
    resolved_at: "2026-04-10T04:15:00Z",
    root_cause: "ECS auto-scaling created 11 new tasks, exhausting RDS max_connections",
    confidence: 94,
  },
  {
    id: "inc-002",
    title: "Elevated 5xx errors on /api/checkout",
    severity: "sev2" as const,
    status: "investigating" as const,
    started_at: "2026-04-10T14:15:00Z",
    resolved_at: null,
    root_cause: null,
    confidence: null,
  },
  {
    id: "inc-003",
    title: "Lambda cold start latency spike",
    severity: "sev3" as const,
    status: "resolved" as const,
    started_at: "2026-04-08T09:30:00Z",
    resolved_at: "2026-04-08T09:45:00Z",
    root_cause: "Provisioned concurrency exhausted after traffic surge",
    confidence: 87,
  },
];

const sevColors = {
  sev1: "bg-[var(--color-sev1)]",
  sev2: "bg-[var(--color-sev2)]",
  sev3: "bg-[var(--color-sev3)]",
};

const statusConfig = {
  investigating: { icon: Activity, color: "text-[var(--color-warning)]", label: "Investigating" },
  identified: { icon: AlertTriangle, color: "text-[var(--color-accent)]", label: "Identified" },
  mitigating: { icon: Clock, color: "text-[var(--color-accent)]", label: "Mitigating" },
  resolved: { icon: CheckCircle, color: "text-[var(--color-success)]", label: "Resolved" },
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto border-b border-[var(--color-border)]">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center">
            <Zap className="w-5 h-5 text-black" />
          </div>
          <span className="text-xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            Cloudscape
          </span>
        </Link>
        <Link
          href="/setup"
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
        >
          Settings
        </Link>
      </nav>

      <main className="max-w-5xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
              Incidents
            </h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              {MOCK_INCIDENTS.filter((i) => i.status !== "resolved").length} active
              &middot; {MOCK_INCIDENTS.length} total
            </p>
          </div>
          <button className="bg-[var(--color-accent)] text-black px-4 py-2 rounded-lg text-sm font-medium hover:brightness-110 transition inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Investigate Now
          </button>
        </div>

        {/* Incident list */}
        <div className="space-y-3">
          {MOCK_INCIDENTS.map((incident) => {
            const status = statusConfig[incident.status];
            const StatusIcon = status.icon;
            return (
              <Link
                key={incident.id}
                href={`/incident/${incident.id}`}
                className="block bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 hover:border-[var(--color-border-bright)] transition group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${sevColors[incident.severity]} ${incident.status === "investigating" ? "pulse-live" : ""}`} />
                    <div>
                      <h3 className="font-medium group-hover:text-[var(--color-accent)] transition-colors">
                        {incident.title}
                      </h3>
                      {incident.root_cause && (
                        <p className="text-sm text-[var(--color-text-muted)] mt-1">
                          {incident.root_cause}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-[var(--color-text-dim)]">
                        <span className="uppercase tracking-wider font-medium">{incident.severity}</span>
                        <span>{new Date(incident.started_at).toLocaleString()}</span>
                        {incident.confidence && (
                          <span className="text-[var(--color-accent)]">{incident.confidence}% confidence</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs font-medium ${status.color}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {status.label}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
