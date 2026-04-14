"use client";

import { useState } from "react";
import { X, Zap, Play } from "lucide-react";

interface InvestigateModalProps {
  onClose: () => void;
  onSubmit: (symptom: string, severity: string) => void;
  onDemo?: (scenario: string) => void;
}

const DEMO_SCENARIOS = [
  { id: "rds_connection_exhaustion", label: "RDS Connection Exhaustion", desc: "ECS auto-scale overwhelms database" },
  { id: "ecs_oom_kill", label: "ECS OOM Kills", desc: "Memory leak causes container restarts" },
  { id: "lambda_throttle", label: "Lambda Throttling", desc: "Concurrency limit hit during spike" },
];

export default function InvestigateModal({ onClose, onSubmit, onDemo }: InvestigateModalProps) {
  const [tab, setTab] = useState<"demo" | "custom">("demo");
  const [symptom, setSymptom] = useState("");
  const [severity, setSeverity] = useState("sev2");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!symptom.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await onSubmit(symptom, severity);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Investigation failed to start");
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async (scenario: string) => {
    setLoading(true);
    setError(null);
    try {
      if (onDemo) await onDemo(scenario);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo failed to start");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full max-w-lg p-7 animate-slide-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--color-bg)] transition-colors duration-150"
        >
          <X className="w-4 h-4 text-[var(--color-text-dim)]" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-muted)] flex items-center justify-center">
            <Zap className="w-5 h-5 text-[var(--color-accent)]" />
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>Investigate Now</h2>
            <p className="text-xs text-[var(--color-text-muted)]">Run a demo scenario or describe a real symptom</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-[var(--color-danger-dim)] border border-[var(--color-danger)]/30 rounded-xl px-4 py-2.5">
            <p className="text-xs text-[var(--color-danger)]">{error}</p>
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex bg-[var(--color-bg)] rounded-xl p-1 mb-6">
          <button
            onClick={() => setTab("demo")}
            className={`flex-1 text-sm py-2 rounded-lg font-medium transition-all duration-150 ${
              tab === "demo"
                ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm"
                : "text-[var(--color-text-muted)]"
            }`}
          >
            Demo Scenarios
          </button>
          <button
            onClick={() => setTab("custom")}
            className={`flex-1 text-sm py-2 rounded-lg font-medium transition-all duration-150 ${
              tab === "custom"
                ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm"
                : "text-[var(--color-text-muted)]"
            }`}
          >
            Custom
          </button>
        </div>

        {tab === "demo" ? (
          <div className="space-y-3">
            {DEMO_SCENARIOS.map((s) => (
              <button
                key={s.id}
                onClick={() => handleDemo(s.id)}
                disabled={loading}
                className="w-full text-left bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl p-4 hover:border-[var(--color-accent)] transition-all duration-150 group disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium group-hover:text-[var(--color-accent)] transition-colors duration-150">{s.label}</div>
                    <div className="text-xs text-[var(--color-text-muted)] mt-0.5">{s.desc}</div>
                  </div>
                  <Play className="w-4 h-4 text-[var(--color-text-dim)] group-hover:text-[var(--color-accent)] transition-colors duration-150" />
                </div>
              </button>
            ))}
            {loading && (
              <div className="text-center py-3">
                <div className="w-5 h-5 border-2 border-[var(--color-accent)]/30 border-t-[var(--color-accent)] rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-[var(--color-text-muted)]">Running investigation with Perplexity...</p>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">What&apos;s happening?</label>
              <textarea
                value={symptom}
                onChange={(e) => setSymptom(e.target.value)}
                placeholder="e.g., Our API is returning 502 errors, RDS CPU is at 100%..."
                rows={3}
                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors duration-150 resize-none"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Severity</label>
              <div className="flex gap-2">
                {[
                  { value: "sev1", label: "SEV1", desc: "Total outage", color: "border-[var(--color-sev1)]" },
                  { value: "sev2", label: "SEV2", desc: "Degraded", color: "border-[var(--color-sev2)]" },
                  { value: "sev3", label: "SEV3", desc: "Minor", color: "border-[var(--color-sev3)]" },
                ].map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSeverity(s.value)}
                    className={`flex-1 border rounded-xl p-3 text-center transition-all duration-150 ${
                      severity === s.value
                        ? `${s.color} bg-[var(--color-bg)]`
                        : "border-[var(--color-border)] hover:border-[var(--color-border-bright)]"
                    }`}
                  >
                    <div className="text-xs font-mono font-bold">{s.label}</div>
                    <div className="text-xs text-[var(--color-text-muted)] mt-0.5">{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!symptom.trim() || loading}
              className="btn-primary w-full disabled:opacity-40"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Starting...</>
              ) : (
                <><Zap className="w-4 h-4" /> Start Investigation</>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
