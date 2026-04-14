"use client";

import Link from "next/link";
import { use } from "react";
import {
  Zap,
  ArrowLeft,
  Shield,
  Clock,
  FileText,
  ExternalLink,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { useIncident } from "@/hooks/useIncident";
import Navbar from "@/components/Navbar";
import Timeline from "@/components/Timeline";
import RemediationCard from "@/components/RemediationCard";
import ScoreGauge from "@/components/ScoreGauge";
import StatusBadge from "@/components/StatusBadge";

const phaseSteps = [
  { key: "collecting", label: "Collecting" },
  { key: "analyzing", label: "Analyzing" },
  { key: "remediating", label: "Remediating" },
  { key: "documenting", label: "Documenting" },
  { key: "complete", label: "Complete" },
];

export default function IncidentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const {
    incident,
    events,
    remediations,
    postmortem,
    loading,
    error,
    triggerInvestigation,
    generatePostMortem,
    updateRemediation,
  } = useIncident(id);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-8 h-8 mx-auto mb-3 text-[var(--color-accent)] animate-spin" />
          <p className="text-sm text-[var(--color-text-muted)]">Loading incident...</p>
        </div>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-[var(--color-danger)]" />
          <p className="text-sm text-[var(--color-text-muted)]">{error || "Incident not found"}</p>
          <Link href="/dashboard" className="text-sm text-[var(--color-accent)] mt-4 inline-block hover:underline">
            &larr; Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const rootCause = incident.root_cause as {
    root_cause: string;
    confidence: number;
    category: string;
    is_aws_outage: boolean;
    known_issue_url: string | null;
  } | null;

  const currentPhaseIdx = phaseSteps.findIndex((s) => s.key === incident.phase);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar backHref="/dashboard">
        <div className="flex items-center gap-3">
          <div
            className={`w-2 h-2 rounded-full ${
              incident.status !== "resolved" ? "bg-[var(--color-sev1)] pulse-live" : "bg-[var(--color-success)]"
            }`}
          />
          <h1 className="font-semibold text-sm truncate max-w-[200px] sm:max-w-md" style={{ fontFamily: "var(--font-display)" }}>
            {incident.title}
          </h1>
          <StatusBadge status={incident.status} />
          <span className="text-xs text-[var(--color-text-dim)] font-mono uppercase hidden sm:inline">{incident.severity}</span>
          {!postmortem && rootCause && (
            <button onClick={generatePostMortem} className="btn-ghost btn-sm hidden sm:inline-flex">
              <FileText className="w-3.5 h-3.5" />
              Post-Mortem
            </button>
          )}
          {postmortem && (
            <Link href={`/incident/${id}/postmortem`} className="btn-primary btn-sm hidden sm:inline-flex">
              <FileText className="w-3.5 h-3.5" />
              View Post-Mortem
            </Link>
          )}
        </div>
      </Navbar>

      {/* Phase progress bar */}
      <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-4">
          <div className="flex items-center gap-2">
            {phaseSteps.map((step, i) => (
              <div key={step.key} className="flex items-center gap-2 flex-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-all duration-200 ${
                    i <= currentPhaseIdx
                      ? "bg-[var(--color-accent)] text-white"
                      : "bg-[var(--color-bg)] text-[var(--color-text-dim)] border border-[var(--color-border)]"
                  }`}
                >
                  {i < currentPhaseIdx ? "\u2713" : i + 1}
                </div>
                <span
                  className={`text-xs font-medium whitespace-nowrap hidden sm:inline ${
                    i <= currentPhaseIdx ? "text-[var(--color-text)]" : "text-[var(--color-text-dim)]"
                  }`}
                >
                  {step.label}
                </span>
                {i < phaseSteps.length - 1 && (
                  <div
                    className={`flex-1 h-px transition-colors duration-200 ${
                      i < currentPhaseIdx ? "bg-[var(--color-accent)]" : "bg-[var(--color-border)]"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-10 pb-20">
        {/* Root cause banner */}
        {rootCause && (
          <div className="card p-6 mb-8 border-l-4 border-l-[var(--color-success)]">
            <div className="flex items-start gap-5">
              <ScoreGauge score={Math.round(rootCause.confidence * 100)} label="Confidence" size={72} />
              <div className="flex-1">
                <h2 className="font-semibold text-[var(--color-success)] mb-1.5 text-base">Root Cause Identified</h2>
                <p className="text-sm text-[var(--color-text)] leading-relaxed">{rootCause.root_cause}</p>
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-bg)] text-[var(--color-text-muted)] font-medium">
                    {rootCause.category}
                  </span>
                  {rootCause.is_aws_outage && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-warning-dim)] text-[var(--color-warning)] font-medium">
                      AWS outage involved
                    </span>
                  )}
                  {rootCause.known_issue_url && (
                    <a
                      href={rootCause.known_issue_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[var(--color-accent)] hover:underline inline-flex items-center gap-1"
                    >
                      Known issue <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No investigation yet */}
        {!rootCause && events.length === 0 && (
          <div className="card p-12 mb-8 text-center">
            <Activity className="w-10 h-10 mx-auto mb-4 text-[var(--color-text-dim)]" />
            <p className="text-[var(--color-text-muted)] mb-5">No investigation running yet</p>
            <button onClick={triggerInvestigation} className="btn-primary btn-sm">
              <Zap className="w-4 h-4" />
              Start Investigation
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Timeline — left column */}
          <div className="lg:col-span-3">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-[var(--color-text-muted)]" />
              <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                Investigation Timeline
              </h2>
              {incident.status !== "resolved" && incident.phase !== "complete" && (
                <>
                  <div className="w-2 h-2 rounded-full bg-[var(--color-success)] pulse-live ml-1" />
                  <span className="text-xs text-[var(--color-text-dim)]">Live</span>
                </>
              )}
            </div>

            {events.length > 0 ? (
              <Timeline incidentId={id} initialEvents={events} />
            ) : (
              <div className="card p-10 text-center">
                <p className="text-sm text-[var(--color-text-dim)]">
                  Timeline events will appear here during investigation
                </p>
              </div>
            )}
          </div>

          {/* Remediations — right column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-[var(--color-text-muted)]" />
              <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                Remediation Options
              </h2>
            </div>

            {remediations.length > 0 ? (
              <div className="space-y-4">
                {remediations.map((rem, i) => (
                  <RemediationCard
                    key={rem.id}
                    remediation={rem}
                    index={i}
                    onApply={(remId) => updateRemediation(remId, "applied")}
                    onSkip={(remId) => updateRemediation(remId, "skipped")}
                  />
                ))}
              </div>
            ) : (
              <div className="card p-8 text-center">
                <p className="text-sm text-[var(--color-text-dim)]">
                  {rootCause ? "Generating remediation options..." : "Remediations will appear after root cause is identified"}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
