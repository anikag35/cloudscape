import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/db";
import { generatePostMortem } from "@/lib/perplexity/postmortem";

const supabase = getSupabaseClient();

/** POST /api/incidents/[id]/postmortem — generate a blameless post-mortem */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Fetch incident + events + remediations in parallel
    const [incidentRes, eventsRes, remediationsRes] = await Promise.all([
      supabase.from("incidents").select("*").eq("id", id).single(),
      supabase.from("incident_events").select("*").eq("incident_id", id).order("timestamp"),
      supabase.from("remediations").select("*").eq("incident_id", id),
    ]);

    if (incidentRes.error || !incidentRes.data) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 });
    }

    const incident = incidentRes.data;
    if (!incident.root_cause) {
      return NextResponse.json({ error: "No root cause yet — run investigation first" }, { status: 400 });
    }

    const events = eventsRes.data ?? [];
    const remediations = remediationsRes.data ?? [];

    // Generate post-mortem via Perplexity
    const content = await generatePostMortem(incident, events, incident.root_cause, remediations);

    // Upsert (replace if exists)
    const { data, error } = await supabase
      .from("postmortems")
      .upsert({ incident_id: id, content }, { onConflict: "incident_id" })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update incident phase
    await supabase.from("incidents").update({ phase: "complete" }).eq("id", id);

    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Post-mortem generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** GET /api/incidents/[id]/postmortem — fetch the generated post-mortem */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabase
    .from("postmortems")
    .select("*")
    .eq("incident_id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Post-mortem not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
