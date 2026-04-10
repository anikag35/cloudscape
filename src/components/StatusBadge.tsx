import { Activity, AlertTriangle, Clock, CheckCircle, type LucideIcon } from "lucide-react";
import type { IncidentStatus, Severity } from "@/types";

const statusConfig: Record<IncidentStatus, { icon: LucideIcon; color: string; label: string }> = {
  investigating: { icon: Activity, color: "text-[var(--color-warning)]", label: "Investigating" },
  identified: { icon: AlertTriangle, color: "text-[var(--color-accent)]", label: "Identified" },
  mitigating: { icon: Clock, color: "text-[var(--color-accent)]", label: "Mitigating" },
  resolved: { icon: CheckCircle, color: "text-[var(--color-success)]", label: "Resolved" },
};

const sevConfig: Record<Severity, { color: string; bg: string }> = {
  sev1: { color: "text-[var(--color-sev1)]", bg: "bg-[var(--color-sev1)]" },
  sev2: { color: "text-[var(--color-sev2)]", bg: "bg-[var(--color-sev2)]" },
  sev3: { color: "text-[var(--color-sev3)]", bg: "bg-[var(--color-sev3)]" },
};

export function StatusBadge({ status }: { status: IncidentStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;
  return (
    <div className={`flex items-center gap-1.5 text-xs font-medium ${config.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </div>
  );
}

export function SeverityDot({ severity, pulse }: { severity: Severity; pulse?: boolean }) {
  const config = sevConfig[severity];
  return (
    <div className={`w-2.5 h-2.5 rounded-full ${config.bg} ${pulse ? "pulse-live" : ""}`} />
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const config = sevConfig[severity];
  return (
    <span className={`text-xs font-mono font-bold uppercase tracking-wider ${config.color}`}>
      {severity}
    </span>
  );
}
