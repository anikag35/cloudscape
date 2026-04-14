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

  const copyCommands = async () => {
    try {
      await navigator.clipboard.writeText(remediation.commands.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available (e.g., non-HTTPS context)
    }
  };

  return (
    <div
      className="card p-6 animate-slide-in"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-medium text-sm flex-1 pr-4">{remediation.title}</h3>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${risk.bg} ${risk.text}`}>
            {risk.label}
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-bg)] text-[var(--color-text-muted)]">
            {remediation.timeframe === "immediate" ? "Now" : "Long-term"}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-[var(--color-text-muted)] mb-4 leading-relaxed">
        {remediation.description}
      </p>

      {/* Cost */}
      {remediation.cost_impact && (
        <p className="text-xs text-[var(--color-text-muted)] mb-4">
          Cost impact: <span className="text-[var(--color-text)] font-medium">{remediation.cost_impact}</span>
        </p>
      )}

      {/* Command block */}
      {remediation.commands.length > 0 && (
        <div className="relative dark-inset p-4 font-mono text-xs overflow-x-auto mb-4">
          <pre className="whitespace-pre-wrap text-[#f97316]">{remediation.commands.join("\n")}</pre>
          <button
            onClick={copyCommands}
            className="absolute top-2.5 right-2.5 p-1.5 rounded-md bg-[#2a2a40] hover:bg-[#3a3a50] transition-colors duration-150"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-[#f97316]" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-[#888]" />
            )}
          </button>
        </div>
      )}

      {/* Terraform toggle */}
      {remediation.terraform && (
        <div className="mb-4">
          <button
            onClick={() => setShowTerraform(!showTerraform)}
            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors duration-150 flex items-center gap-1"
          >
            {showTerraform ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showTerraform ? "Hide" : "View"} Terraform code
          </button>
          {showTerraform && (
            <div className="mt-2 dark-inset p-4 font-mono text-xs overflow-x-auto">
              <pre className="whitespace-pre-wrap text-[var(--color-dark-text-muted)]">{remediation.terraform}</pre>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      {remediation.status === "suggested" && (
        <div className="flex items-center gap-2 pt-4 border-t border-[var(--color-border)]">
          <button
            onClick={() => onApply?.(remediation.id)}
            className="btn-primary btn-sm"
          >
            Mark Applied
          </button>
          <button
            onClick={() => onSkip?.(remediation.id)}
            className="btn-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors duration-150"
          >
            Skip
          </button>
        </div>
      )}

      {remediation.status === "applied" && (
        <div className="pt-4 border-t border-[var(--color-border)]">
          <span className="text-xs text-[var(--color-success)] font-medium">&#10003; Applied</span>
        </div>
      )}
    </div>
  );
}
