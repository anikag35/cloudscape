import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { runInvestigation } from "@/lib/investigation";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = await requireAuth(req);
  if (authErr) return authErr;

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
      // Fire-and-forget DB writes for timeline events — errors logged but not fatal
      try {
        await supabase.from("incident_events").insert({
          incident_id: id,
          source: "agent",
          event_type: event.phase === "analyzing" ? "analysis" : "info",
          content: event.content,
        });
        await supabase.from("incidents").update({ phase: event.phase }).eq("id", id);
      } catch (dbErr) {
        console.error("Failed to write timeline event:", dbErr);
      }
    });

    await supabase.from("incidents").update({
      root_cause: result.rootCause,
      overall_score: Math.round(result.rootCause.confidence * 100),
      status: "identified",
      phase: "remediating",
    }).eq("id", id);

    // Batch insert remediations
    const remediationRows = result.remediations.map((rem) => ({
      incident_id: id,
      title: rem.title,
      description: rem.description,
      commands: rem.commands,
      terraform: rem.terraform,
      risk_level: rem.risk_level,
      cost_impact: rem.cost_impact,
      timeframe: rem.timeframe,
    }));

    if (remediationRows.length > 0) {
      const { error: remErr } = await supabase.from("remediations").insert(remediationRows);
      if (remErr) {
        console.error("Failed to insert remediations:", remErr);
      }
    }

    return NextResponse.json({
      success: true,
      root_cause: result.rootCause,
      remediations_count: result.remediations.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Investigation failed";
    try {
      await supabase.from("incident_events").insert({
        incident_id: id, source: "system", event_type: "error", content: `Investigation failed: ${message}`,
      });
    } catch {
      // Best-effort error event logging
    }
    return NextResponse.json({ error: "Investigation failed" }, { status: 500 });
  }
}
