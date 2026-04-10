import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/db";
import { runInvestigation } from "@/lib/investigation";

const supabase = getSupabaseClient();

/** POST /api/incidents/[id]/investigate — run the full investigation pipeline */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Fetch incident
    const { data: incident, error: incErr } = await supabase
      .from("incidents")
      .select("*")
      .eq("id", id)
      .single();

    if (incErr || !incident) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 });
    }

    // Fetch org for AWS credentials
    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", incident.org_id)
      .single();

    if (orgErr || !org) {
      return NextResponse.json({ error: "Organization not found — connect AWS first" }, { status: 400 });
    }

    // Run investigation — stream events to DB so frontend picks them up via Realtime
    const result = await runInvestigation(org, incident.symptom, async (event) => {
      // Insert each event into the timeline
      await supabase.from("incident_events").insert({
        incident_id: id,
        source: "agent",
        event_type: event.phase === "analyzing" ? "analysis" : "info",
        content: event.content,
      });

      // Update incident phase
      await supabase
        .from("incidents")
        .update({ phase: event.phase })
        .eq("id", id);
    });

    // Store root cause
    await supabase
      .from("incidents")
      .update({
        root_cause: result.rootCause,
        overall_score: Math.round(result.rootCause.confidence * 100),
        status: "identified",
        phase: "remediating",
      })
      .eq("id", id);

    // Store remediations
    for (const rem of result.remediations) {
      await supabase.from("remediations").insert({
        incident_id: id,
        title: rem.title,
        description: rem.description,
        commands: rem.commands,
        terraform: rem.terraform,
        risk_level: rem.risk_level,
        cost_impact: rem.cost_impact,
        timeframe: rem.timeframe,
      });
    }

    return NextResponse.json({
      success: true,
      root_cause: result.rootCause,
      remediations_count: result.remediations.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Investigation failed";

    // Log failure to timeline
    await supabase.from("incident_events").insert({
      incident_id: id,
      source: "system",
      event_type: "error",
      content: `Investigation failed: ${message}`,
    });

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
