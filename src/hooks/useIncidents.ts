"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/incidents");
      if (!res.ok) throw new Error("Failed to fetch incidents");
      const data = await res.json();
      if (!mountedRef.current) return;
      setIncidents(data);
      setError(null);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      if (mountedRef.current) setLoading(false);
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
      setError(null);
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptom, severity }),
      });
      if (!res.ok) throw new Error("Failed to create incident");
      const incident = await res.json();
      if (mountedRef.current) {
        setIncidents((prev) => [incident, ...prev]);
      }
      return incident;
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Creation failed");
      }
      return null;
    }
  };

  return { incidents, loading, error, refetch: fetchData, createIncident };
}
