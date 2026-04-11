"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Zap, Plus, Activity, Clock, CheckCircle, AlertTriangle, Search } from "lucide-react";
import { useIncidents } from "@/hooks/useIncidents";
import HealthOverview from "@/components/HealthOverview";
import InvestigateModal from "@/components/InvestigateModal";
import StatusBadge from "@/components/StatusBadge";

const sevColors = {
  sev1: "bg-[var(--color-sev1)]",
  sev2: "bg-[var(--color-sev2)]",
  sev3: "bg-[var(--color-sev3)]",
};

export default function DashboardPage() {
  const router = useRouter();
  const { incidents, loading, createIncident } = useIncidents();
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "resolved">("all");

  const activeCount = incidents.filter((i) => i.status !== "resolved").length;
  const resolvedToday = incidents.filter((i) => {
    if (!i.resolved_at) return false;
    const resolved = new Date(i.resolved_at);
    const today = new Date();
    return resolved.toDateString() === today.toDateString();
  }).length;

  const filtered = incidents.filter((i) => {
    if (filter === "active") return i.status !== "resolved";
    if (filter === "resolved") return i.status === "resolved";
    return true;
  });

  const handleCreate = async (symptom: string, severity: string) => {
    const incident = await createIncident(symptom, severity);
    setShowModal(false);
    if (incident) {
      router.push(`/incident/${incident.id}`);
    }
  };

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
        <div className="flex items-center gap-4">
          <Link href="/setup" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
            Settings
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-8 py-8">
        {/* Health Overview */}
        <HealthOverview
          activeIncidents={activeCount}
          resolvedToday={resolvedToday}
          mttr={12}
          connected={true}
        />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
              Incidents
            </h1>
            {/* Filter tabs */}
            <div className="flex items-center bg-[var(--color-surface)] rounded-lg p-0.5 ml-4">
              {(["all", "active", "resolved"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-xs px-3 py-1.5 rounded-md capitalize transition ${
                    filter === f
                      ? "bg-[var(--color-surface-elevated)] text-[var(--color-text)]"
                      : "text-[var(--color-text-dim)] hover:text-[var(--color-text-muted)]"
                  }`}
                >
                  {f} {f === "active" && activeCount > 0 && `(${activeCount})`}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-[var(--color-accent)] text-black px-4 py-2 rounded-lg text-sm font-medium hover:brightness-110 transition inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Investigate Now
          </button>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="text-center py-20 text-[var(--color-text-dim)]">
            <Activity className="w-6 h-6 mx-auto mb-3 animate-spin" />
            <p className="text-sm">Loading incidents...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl card-shadow">
            <Search className="w-12 h-12 mx-auto mb-3 text-[var(--color-text-dim)]" />
            <p className="text-[var(--color-text-muted)] mb-1">No incidents found</p>
            <p className="text-sm text-[var(--color-text-dim)]">
              {filter !== "all" ? "Try changing the filter" : "Click \"Investigate Now\" to start"}
            </p>
          </div>
        )}

        {/* Incident list */}
        <div className="space-y-3">
          {filtered.map((incident) => (
            <Link
              key={incident.id}
              href={`/incident/${incident.id}`}
              className="block bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 hover:border-[var(--color-border-bright)] hover:bg-[var(--color-surface-elevated)] transition group card-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-2.5 h-2.5 rounded-full mt-1.5 ${
                      sevColors[incident.severity as keyof typeof sevColors] || "bg-[var(--color-sev2)]"
                    } ${incident.status !== "resolved" ? "pulse-live" : ""}`}
                  />
                  <div>
                    <h3 className="font-medium group-hover:text-[var(--color-accent)] transition-colors">
                      {incident.title}
                    </h3>
                    {incident.root_cause && (
                      <p className="text-sm text-[var(--color-text-muted)] mt-1">
                        {(incident.root_cause as { root_cause: string }).root_cause}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-[var(--color-text-dim)]">
                      <span className="uppercase tracking-wider font-medium">{incident.severity}</span>
                      <span>{new Date(incident.started_at).toLocaleString()}</span>
                      {incident.overall_score && (
                        <span className="text-[var(--color-accent)]">{incident.overall_score}% confidence</span>
                      )}
                    </div>
                  </div>
                </div>
                <StatusBadge status={incident.status} />
              </div>
            </Link>
          ))}
        </div>
      </main>

      {/* Investigate Modal */}
      {showModal && (
        <InvestigateModal
          onClose={() => setShowModal(false)}
          onSubmit={handleCreate}
          onDemo={async (scenario) => {
            try {
              const res = await fetch("/api/demo/investigate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ scenario }),
              });
              const data = await res.json();
              if (data.incident_id) {
                router.push(`/incident/${data.incident_id}`);
              }
            } catch {
              alert("Demo failed \u2014 check your Perplexity API key");
            }
          }}
        />
      )}
    </div>
  );
}
