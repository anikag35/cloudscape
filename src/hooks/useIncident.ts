"use client";

import { useState, useEffect, useCallback } from "react";
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

export function useIncident(id: string): IncidentData {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [events, setEvents] = useState<IncidentEvent[]>([]);
  const [remediations, setRemediations] = useState<Remediation[]>([]);
  const [postmortem, setPostmortem] = useState<PostMortem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/incidents/${id}`);
      if (!res.ok) throw new Error("Failed to fetch incident");
      const data = await res.json();
      setIncident(data.incident);
      setEvents(data.events);
      setRemediations(data.remediations);
      setPostmortem(data.postmortem);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
    // Poll every 5s for live updates (replace with Supabase Realtime in production)
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const triggerInvestigation = async () => {
    try {
      const res = await fetch(`/api/incidents/${id}/investigate`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Investigation failed");
      }
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Investigation failed");
    }
  };

  const generatePostMortem = async () => {
    try {
      const res = await fetch(`/api/incidents/${id}/postmortem`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Post-mortem generation failed");
      }
      const pm = await res.json();
      setPostmortem(pm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Post-mortem failed");
    }
  };

  const updateRemediation = async (remId: string, status: "applied" | "skipped") => {
    try {
      await fetch(`/api/remediations/${remId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setRemediations((prev) =>
        prev.map((r) => (r.id === remId ? { ...r, status } : r))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
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
