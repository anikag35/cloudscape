"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Incident, IncidentEvent, Remediation, PostMortem } from "@/types";

interface IncidentData {
  incident: Incident | null;
  events: IncidentEvent[];
  remediations: Remediation[];
  postmortem: PostMortem | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  triggerInvestigation: () => Promise<void>;
  generatePostMortem: () => Promise<void>;
  updateRemediation: (id: string, status: "applied" | "skipped") => Promise<void>;
}

/** Only update state if the new data actually differs (by comparing IDs and lengths). */
function eventsChanged(prev: IncidentEvent[], next: IncidentEvent[]): boolean {
  if (prev.length !== next.length) return true;
  for (let i = 0; i < prev.length; i++) {
    if (prev[i].id !== next[i].id) return true;
  }
  return false;
}

function remediationsChanged(prev: Remediation[], next: Remediation[]): boolean {
  if (prev.length !== next.length) return true;
  for (let i = 0; i < prev.length; i++) {
    if (prev[i].id !== next[i].id || prev[i].status !== next[i].status) return true;
  }
  return false;
}

export function useIncident(id: string): IncidentData {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [events, setEvents] = useState<IncidentEvent[]>([]);
  const [remediations, setRemediations] = useState<Remediation[]>([]);
  const [postmortem, setPostmortem] = useState<PostMortem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const initialLoadDone = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchData = useCallback(async () => {
    try {
      // Only show loading spinner on initial load, not on poll refreshes
      if (!initialLoadDone.current) setLoading(true);

      const res = await fetch(`/api/incidents/${id}`);
      if (!res.ok) throw new Error("Failed to fetch incident");
      const data = await res.json();
      if (!mountedRef.current) return;

      // Smart-update: only update state when data actually changed
      setIncident((prev) => {
        if (!prev) return data.incident;
        if (prev.phase !== data.incident.phase ||
            prev.status !== data.incident.status ||
            prev.overall_score !== data.incident.overall_score) {
          return data.incident;
        }
        return prev;
      });

      setEvents((prev) => eventsChanged(prev, data.events) ? data.events : prev);
      setRemediations((prev) => remediationsChanged(prev, data.remediations) ? data.remediations : prev);

      setPostmortem((prev) => {
        const newPm = data.postmortem ?? null;
        if (prev?.id !== newPm?.id) return newPm;
        return prev;
      });

      setError(null);
      initialLoadDone.current = true;
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();

    const interval = setInterval(() => {
      if (!mountedRef.current) return;
      fetchData();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchData]);

  const triggerInvestigation = async () => {
    try {
      setError(null);
      const res = await fetch(`/api/incidents/${id}/investigate`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Investigation failed");
      }
      if (mountedRef.current) await fetchData();
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Investigation failed");
      }
    }
  };

  const generatePostMortem = async () => {
    try {
      setError(null);
      const res = await fetch(`/api/incidents/${id}/postmortem`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Post-mortem generation failed");
      }
      const pm = await res.json();
      if (mountedRef.current) setPostmortem(pm);
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Post-mortem failed");
      }
    }
  };

  const updateRemediation = async (remId: string, status: "applied" | "skipped") => {
    try {
      setError(null);
      await fetch(`/api/remediations/${remId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (mountedRef.current) {
        setRemediations((prev) =>
          prev.map((r) => (r.id === remId ? { ...r, status } : r))
        );
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Update failed");
      }
    }
  };

  return {
    incident,
    events,
    remediations,
    postmortem,
    loading,
    error,
    refetch: fetchData,
    triggerInvestigation,
    generatePostMortem,
    updateRemediation,
  };
}
