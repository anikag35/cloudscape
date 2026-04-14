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
  cloudtrail: "text-[var(--color-info)]",
  logs: "text-[var(--color-warning)]",
  agent: "text-[var(--color-success)]",
  user: "text-[var(--color-text)]",
};

const typeIcons: Record<string, string> = {
  metric_spike: "\u{1F4C8}",
  deployment: "\u{1F680}",
  error: "\u274C",
  analysis: "\u{1F50D}",
  remediation: "\u{1F6E0}",
  status_change: "\u{1F504}",
  info: "\u2139\uFE0F",
};

export default function Timeline({ incidentId, initialEvents = [] }: TimelineProps) {
  const [events, setEvents] = useState<IncidentEvent[]>(initialEvents);
  const bottomRef = useRef<HTMLDivElement>(null);
  // Track which event IDs we've already rendered so we only animate truly new ones
  const seenIdsRef = useRef<Set<string>>(new Set(initialEvents.map((e) => e.id)));

  // Sync local state when parent passes updated initialEvents (from polling)
  useEffect(() => {
    setEvents((prev) => {
      // Merge: keep all existing events, add any new ones from the prop
      const existingIds = new Set(prev.map((e) => e.id));
      const newFromProp = initialEvents.filter((e) => !existingIds.has(e.id));
      if (newFromProp.length === 0 && prev.length === initialEvents.length) return prev;
      // If parent has fewer events (shouldn't happen), prefer the larger set
      if (newFromProp.length === 0 && prev.length >= initialEvents.length) return prev;
      return [...prev, ...newFromProp];
    });
  }, [initialEvents]);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events.length]);

  // Subscribe to Supabase Realtime for live event streaming
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channelRef: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let clientRef: any = null;

    async function subscribe() {
      try {
        const { getSupabaseBrowserClient } = await import("@/lib/db");
        if (cancelled) return;

        const supabaseClient = getSupabaseBrowserClient();
        clientRef = supabaseClient;

        const channel = supabaseClient
          .channel(`incident-timeline-${incidentId}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "incident_events",
              filter: `incident_id=eq.${incidentId}`,
            },
            (payload: { new: IncidentEvent }) => {
              if (cancelled) return;
              setEvents((prev) => {
                if (prev.some((e) => e.id === payload.new.id)) return prev;
                return [...prev, payload.new];
              });
            }
          )
          .subscribe();

        if (cancelled) {
          supabaseClient.removeChannel(channel);
        } else {
          channelRef = channel;
        }
      } catch {
        // Supabase not configured — fall back to polling
      }
    }

    subscribe();

    return () => {
      cancelled = true;
      if (channelRef && clientRef) {
        clientRef.removeChannel(channelRef);
      }
    };
  }, [incidentId]);

  const formatTime = (ts: string) => {
    try {
      return new Date(ts).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      return ts;
    }
  };

  return (
    <div className="card p-5">
      <div className="space-y-0.5 max-h-[600px] overflow-y-auto">
        {events.map((event) => {
          const isRootCause = event.content.includes("ROOT CAUSE");
          const isError = event.event_type === "error";

          // Only animate events we haven't seen before
          const isNew = !seenIdsRef.current.has(event.id);
          if (isNew) seenIdsRef.current.add(event.id);

          return (
            <div
              key={event.id || `${event.incident_id}-${event.timestamp}-${event.content.slice(0, 20)}`}
              className={`flex gap-3 py-2 px-3 rounded-lg ${isNew ? "animate-slide-in" : ""} ${
                isRootCause
                  ? "bg-[var(--color-success-dim)] border border-[var(--color-success)]/20"
                  : isError
                  ? "bg-[var(--color-danger-dim)] border border-[var(--color-danger)]/20"
                  : "hover:bg-[var(--color-bg)]"
              }`}
            >
              <span className="text-xs font-mono text-[var(--color-text-dim)] whitespace-nowrap mt-0.5 w-16 shrink-0">
                {formatTime(event.timestamp)}
              </span>
              <span className="text-[10px] mt-1">{typeIcons[event.event_type] || "\u2022"}</span>
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
    </div>
  );
}
