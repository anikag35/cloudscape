"use client";

import { useEffect, useState, useRef } from "react";
import type { IncidentEvent } from "@/types";

interface TimelineProps {
  incidentId: string;
  /** Initial events loaded from API. New ones stream via Supabase Realtime. */
  initialEvents?: IncidentEvent[];
}

const sourceColors: Record<string, string> = {
  system: "text-[var(--color-text-dim)]",
  cloudwatch: "text-[var(--color-accent)]",
  cloudtrail: "text-[var(--color-sev3)]",
  logs: "text-[var(--color-warning)]",
  agent: "text-[var(--color-success)]",
  user: "text-[var(--color-text)]",
};

const typeIcons: Record<string, string> = {
  metric_spike: "📈",
  deployment: "🚀",
  error: "❌",
  analysis: "🔍",
  remediation: "🛠",
  status_change: "🔄",
  info: "ℹ️",
};

export default function Timeline({ incidentId, initialEvents = [] }: TimelineProps) {
  const [events, setEvents] = useState<IncidentEvent[]>(initialEvents);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events.length]);

  // TODO: Subscribe to Supabase Realtime for live events
  // useEffect(() => {
  //   const supabase = getSupabaseBrowserClient();
  //   const channel = supabase
  //     .channel(`incident-${incidentId}`)
  //     .on(
  //       "postgres_changes",
  //       { event: "INSERT", schema: "public", table: "incident_events", filter: `incident_id=eq.${incidentId}` },
  //       (payload) => setEvents((prev) => [...prev, payload.new as IncidentEvent])
  //     )
  //     .subscribe();
  //   return () => { supabase.removeChannel(channel); };
  // }, [incidentId]);

  const formatTime = (ts: string) => {
    try {
      return new Date(ts).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      return ts;
    }
  };

  return (
    <div className="space-y-0.5 max-h-[600px] overflow-y-auto pr-2">
      {events.map((event, i) => {
        const isRootCause = event.content.includes("ROOT CAUSE");
        const isError = event.event_type === "error";

        return (
          <div
            key={event.id || i}
            className={`flex gap-3 py-2 px-3 rounded-lg animate-slide-in ${
              isRootCause
                ? "bg-[var(--color-success-dim)] border border-[var(--color-success)]/30"
                : isError
                ? "bg-[var(--color-danger-dim)] border border-[var(--color-danger)]/30"
                : "hover:bg-[var(--color-surface)]"
            }`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <span className="text-xs font-mono text-[var(--color-text-dim)] whitespace-nowrap mt-0.5 w-16 shrink-0">
              {formatTime(event.timestamp)}
            </span>
            <span className="text-[10px] mt-1">{typeIcons[event.event_type] || "•"}</span>
            <span
              className={`text-xs font-mono uppercase tracking-wider w-20 shrink-0 mt-0.5 ${
                sourceColors[event.source] || "text-[var(--color-text-dim)]"
              }`}
            >
              {event.source}
            </span>
            <span
              className={`text-sm leading-relaxed ${
                isRootCause
                  ? "text-[var(--color-success)] font-semibold"
                  : isError
                  ? "text-[var(--color-danger)]"
                  : "text-[var(--color-text)]"
              }`}
            >
              {event.content}
            </span>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
