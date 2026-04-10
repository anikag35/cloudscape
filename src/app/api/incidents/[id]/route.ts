import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/db";

const supabase = getSupabaseClient();

/** GET /api/incidents/[id] — full incident with events and remediations */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [incidentRes, eventsRes, remediationsRes, postmortemRes] = await Promise.all([
    supabase.from("incidents").select("*").eq("id", id).single(),
    supabase.from("incident_events").select("*").eq("incident_id", id).order("timestamp"),
    supabase.from("remediations").select("*").eq("incident_id", id).order("created_at"),
    supabase.from("postmortems").select("*").eq("incident_id", id).maybeSingle(),
  ]);

  if (incidentRes.error || !incidentRes.data) {
    return NextResponse.json({ error: "Incident not found" }, { status: 404 });
  }

  return NextResponse.json({
    incident: incidentRes.data,
    events: eventsRes.data ?? [],
    remediations: remediationsRes.data ?? [],
    postmortem: postmortemRes.data ?? null,
  });
}

/** PATCH /api/incidents/[id] — update incident status */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const updates = await req.json();

  const allowedFields = ["status", "severity", "resolved_at", "phase"];
  const filtered: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in updates) filtered[key] = updates[key];
  }

  const { data, error } = await supabase
    .from("incidents")
    .update(filtered)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
