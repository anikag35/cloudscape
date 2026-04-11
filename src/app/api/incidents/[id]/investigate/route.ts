import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/db";
import { runInvestigation } from "@/lib/investigation";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = getSupabaseClient();
  const { id } = await params;

  try {
    const { data: incident, error: incErr } = await supabase
      .from("incidents").select("*").eq("id", id).single();

    if (incErr || !incident) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 });
    }

    const { data: org, error: orgErr } = await supabase
      .from("organizations").select("*").eq("id", incident.org_id).single();

    if (orgErr || !org) {
      return NextResponse.json({ error: "Organization not found — connect AWS first" }, { status: 400 });
    }

    const result = await runInvestigation(org, incident.symptom, async (event) => {
      await supabase.from("incident_events").insert({
        incident_id: id,
        source: "agent",
        event_type: event.phase === "analyzing" ? "analysis" : "info",
        content: event.content,
      });
      await supabase.from("incidents").update({ phase: event.phase }).eq("id", id);
    });

    await supabase.from("incidents").update({
      root_cause: result.rootCause,
      overall_score: Math.round(result.rootCause.confidence * 100),
      status: "identified",
      phase: "remediating",
    }).eq("id", id);

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
    await supabase.from("incident_events").insert({
      incident_id: id, source: "system", event_type: "error", content: `Investigation failed: ${message}`,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
