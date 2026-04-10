"use client";

import { useState } from "react";
import { Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import type { Remediation } from "@/types";

const riskConfig = {
  safe: { bg: "bg-[var(--color-success-dim)]", text: "text-[var(--color-success)]", label: "Safe" },
  caution: { bg: "bg-[var(--color-warning-dim)]", text: "text-[var(--color-warning)]", label: "Caution" },
  dangerous: { bg: "bg-[var(--color-danger-dim)]", text: "text-[var(--color-danger)]", label: "Dangerous" },
};

interface RemediationCardProps {
  remediation: Remediation;
  index: number;
  onApply?: (id: string) => void;
  onSkip?: (id: string) => void;
}

export default function RemediationCard({ remediation, index, onApply, onSkip }: RemediationCardProps) {
  const [copied, setCopied] = useState(false);
  const [showTerraform, setShowTerraform] = useState(false);
  const risk = riskConfig[remediation.risk_level];

  const copyCommands = () => {
    navigator.clipboard.writeText(remediation.commands.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 animate-slide-in"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-medium text-sm flex-1 pr-4">{remediation.title}</h3>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full ${risk.bg} ${risk.text}`}>
            {risk.label}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]">
            {remediation.timeframe === "immediate" ? "Now" : "Long-term"}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-[var(--color-text-muted)] mb-3 leading-relaxed">
        {remediation.description}
      </p>

      {/* Cost */}
      {remediation.cost_impact && (
        <p className="text-xs text-[var(--color-text-dim)] mb-3">
          Cost impact: <span className="text-[var(--color-text)]">{remediation.cost_impact}</span>
        </p>
      )}

      {/* Command block */}
      {remediation.commands.length > 0 && (
        <div className="relative bg-[var(--color-bg)] rounded-lg p-3 font-mono text-xs text-[var(--color-accent)] overflow-x-auto mb-3">
          <pre className="whitespace-pre-wrap">{remediation.commands.join("\n")}</pre>
          <button
            onClick={copyCommands}
            className="absolute top-2 right-2 p-1.5 rounded-md bg-[var(--color-surface)] hover:bg-[var(--color-surface-elevated)] transition"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-[var(--color-success)]" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-[var(--color-text-dim)]" />
            )}
          </button>
        </div>
      )}

      {/* Terraform toggle */}
      {remediation.terraform && (
        <div className="mb-3">
          <button
            onClick={() => setShowTerraform(!showTerraform)}
            className="text-xs text-[var(--color-text-dim)] hover:text-[var(--color-text-muted)] transition flex items-center gap-1"
          >
            {showTerraform ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showTerraform ? "Hide" : "View"} Terraform code
          </button>
          {showTerraform && (
            <div className="mt-2 bg-[var(--color-bg)] rounded-lg p-3 font-mono text-xs text-[var(--color-text-muted)] overflow-x-auto">
              <pre className="whitespace-pre-wrap">{remediation.terraform}</pre>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      {remediation.status === "suggested" && (
        <div className="flex items-center gap-2 pt-2 border-t border-[var(--color-border)]">
          <button
            onClick={() => onApply?.(remediation.id)}
            className="text-xs px-3 py-1.5 rounded-md bg-[var(--color-accent)] text-black font-medium hover:brightness-110 transition"
          >
            Mark Applied
          </button>
          <button
            onClick={() => onSkip?.(remediation.id)}
            className="text-xs px-3 py-1.5 rounded-md text-[var(--color-text-dim)] hover:text-[var(--color-text-muted)] transition"
          >
            Skip
          </button>
        </div>
      )}

      {remediation.status === "applied" && (
        <div className="pt-2 border-t border-[var(--color-border)]">
          <span className="text-xs text-[var(--color-success)]">✓ Applied</span>
        </div>
      )}
    </div>
  );
}
