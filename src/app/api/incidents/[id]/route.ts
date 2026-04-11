import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

const VALID_STATUSES = ["investigating", "identified", "mitigating", "resolved"];
const VALID_SEVERITIES = ["sev1", "sev2", "sev3"];
const VALID_PHASES = ["collecting", "analyzing", "remediating", "documenting", "complete"];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = await requireAuth(req);
  if (authErr) return authErr;

  const supabase = getSupabaseClient();
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = await requireAuth(req);
  if (authErr) return authErr;

  const supabase = getSupabaseClient();
  const { id } = await params;

  let updates: Record<string, unknown>;
  try {
    updates = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Validate allowed field values
  if (updates.status && !VALID_STATUSES.includes(updates.status as string)) {
    return NextResponse.json({ error: `status must be one of: ${VALID_STATUSES.join(", ")}` }, { status: 400 });
  }
  if (updates.severity && !VALID_SEVERITIES.includes(updates.severity as string)) {
    return NextResponse.json({ error: `severity must be one of: ${VALID_SEVERITIES.join(", ")}` }, { status: 400 });
  }
  if (updates.phase && !VALID_PHASES.includes(updates.phase as string)) {
    return NextResponse.json({ error: `phase must be one of: ${VALID_PHASES.join(", ")}` }, { status: 400 });
  }

  const allowedFields = ["status", "severity", "resolved_at", "phase"];
  const filtered: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in updates) filtered[key] = updates[key];
  }

  if (Object.keys(filtered).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase.from("incidents").update(filtered).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: "Failed to update incident" }, { status: 500 });
  return NextResponse.json(data);
}
