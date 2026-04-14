"use client";

import { Activity, Database, Server, Globe } from "lucide-react";

interface HealthOverviewProps {
  activeIncidents: number;
  resolvedToday: number;
  mttr?: number; // mean time to resolve in minutes
  connected: boolean;
}

export default function HealthOverview({
  activeIncidents,
  resolvedToday,
  mttr,
  connected,
}: HealthOverviewProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <StatCard
        icon={<Activity className="w-4 h-4" />}
        label="Active"
        value={activeIncidents.toString()}
        color={activeIncidents > 0 ? "var(--color-danger)" : "var(--color-success)"}
      />
      <StatCard
        icon={<Server className="w-4 h-4" />}
        label="Resolved Today"
        value={resolvedToday.toString()}
        color="var(--color-success)"
      />
      <StatCard
        icon={<Database className="w-4 h-4" />}
        label="Avg MTTR"
        value={mttr ? `${mttr}m` : "\u2014"}
        color="var(--color-accent)"
      />
      <StatCard
        icon={<Globe className="w-4 h-4" />}
        label="AWS"
        value={connected ? "Connected" : "Not connected"}
        color={connected ? "var(--color-success)" : "var(--color-text-dim)"}
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-3 text-[var(--color-text-muted)]">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-xl font-bold font-mono" style={{ color }}>
        {value}
      </span>
    </div>
  );
}
