"use client";

import { useState } from "react";
import { X, Zap, AlertTriangle } from "lucide-react";

interface InvestigateModalProps {
  onClose: () => void;
  onSubmit: (symptom: string, severity: string) => void;
}

export default function InvestigateModal({ onClose, onSubmit }: InvestigateModalProps) {
  const [symptom, setSymptom] = useState("");
  const [severity, setSeverity] = useState("sev2");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!symptom.trim()) return;
    setLoading(true);
    await onSubmit(symptom, severity);
    setLoading(false);
    setSymptom("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-lg p-8 animate-slide-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-[var(--color-surface-elevated)] rounded-lg transition"
        >
          <X className="w-4 h-4 text-[var(--color-text-dim)]" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-[var(--color-accent)]" />
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>
              Investigate Now
            </h2>
            <p className="text-xs text-[var(--color-text-dim)]">
              Describe the symptom and Cloudscape will investigate
            </p>
          </div>
        </div>

        {/* Symptom input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">What's happening?</label>
          <textarea
            value={symptom}
            onChange={(e) => setSymptom(e.target.value)}
            placeholder="e.g., Our API is returning 502 errors, RDS CPU is at 100%, users can't log in..."
            rows={3}
            className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-accent)] transition resize-none"
          />
        </div>

        {/* Severity selector */}
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
                className={`flex-1 border rounded-lg p-3 text-center transition ${
                  severity === s.value
                    ? `${s.color} bg-[var(--color-surface-elevated)]`
                    : "border-[var(--color-border)] hover:border-[var(--color-border-bright)]"
                }`}
              >
                <div className="text-xs font-mono font-bold">{s.label}</div>
                <div className="text-xs text-[var(--color-text-dim)] mt-0.5">{s.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!symptom.trim() || loading}
          className="w-full bg-[var(--color-accent)] text-black py-3 rounded-lg font-medium hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              Starting investigation...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Start Investigation
            </>
          )}
        </button>
      </div>
    </div>
  );
}
