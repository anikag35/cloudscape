"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Activity, Search, Settings } from "lucide-react";
import { useIncidents } from "@/hooks/useIncidents";
import Navbar from "@/components/Navbar";
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
      <Navbar>
        <Link
          href="/setup"
          className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors duration-150"
        >
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">Settings</span>
        </Link>
      </Navbar>

      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-10">
        {/* Health Overview */}
        <HealthOverview
          activeIncidents={activeCount}
          resolvedToday={resolvedToday}
          mttr={12}
          connected={true}
        />

        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
              Incidents
            </h1>
            {/* Filter tabs */}
            <div className="flex items-center bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-1">
              {(["all", "active", "resolved"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-xs px-3 py-1.5 rounded-lg capitalize font-medium transition-all duration-150 ${
                    filter === f
                      ? "bg-[var(--color-bg)] text-[var(--color-text)] shadow-sm"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  }`}
                >
                  {f} {f === "active" && activeCount > 0 && `(${activeCount})`}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary btn-sm"
          >
            <Plus className="w-4 h-4" />
            Investigate Now
          </button>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="card p-20 text-center">
            <Activity className="w-6 h-6 mx-auto mb-3 text-[var(--color-text-dim)] animate-spin" />
            <p className="text-sm text-[var(--color-text-muted)]">Loading incidents...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="card p-20 text-center">
            <Search className="w-10 h-10 mx-auto mb-3 text-[var(--color-text-dim)]" />
            <p className="text-[var(--color-text-muted)] font-medium mb-1">No incidents found</p>
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
              className="block card-interactive p-5 group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${
                      sevColors[incident.severity as keyof typeof sevColors] || "bg-[var(--color-sev2)]"
                    } ${incident.status !== "resolved" ? "pulse-live" : ""}`}
                  />
                  <div>
                    <h3 className="font-medium group-hover:text-[var(--color-accent)] transition-colors duration-150">
                      {incident.title}
                    </h3>
                    {incident.root_cause && (
                      <p className="text-sm text-[var(--color-text-muted)] mt-1 leading-relaxed">
                        {(incident.root_cause as { root_cause: string }).root_cause}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-[var(--color-text-dim)]">
                      <span className="uppercase tracking-wider font-medium">{incident.severity}</span>
                      <span>{new Date(incident.started_at).toLocaleString()}</span>
                      {incident.overall_score && (
                        <span className="text-[var(--color-accent)] font-medium">{incident.overall_score}% confidence</span>
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
