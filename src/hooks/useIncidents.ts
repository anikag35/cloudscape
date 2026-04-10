"use client";

import { useState, useEffect, useCallback } from "react";
import type { Incident } from "@/types";

interface IncidentsData {
  incidents: Incident[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  createIncident: (symptom: string, severity?: string) => Promise<Incident | null>;
}

export function useIncidents(): IncidentsData {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/incidents");
      if (!res.ok) throw new Error("Failed to fetch incidents");
      const data = await res.json();
      setIncidents(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const createIncident = async (
    symptom: string,
    severity: string = "sev2"
  ): Promise<Incident | null> => {
    try {
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptom, severity }),
      });
      if (!res.ok) throw new Error("Failed to create incident");
      const incident = await res.json();
      setIncidents((prev) => [incident, ...prev]);
      return incident;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Creation failed");
      return null;
    }
  };

  return { incidents, loading, error, refetch: fetchData, createIncident };
}
