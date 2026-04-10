import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/db";

const supabase = getSupabaseClient();

/** GET /api/incidents — list all incidents */
export async function GET() {
  const { data, error } = await supabase
    .from("incidents")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/** POST /api/incidents — create a new incident (manual or from webhook) */
export async function POST(req: NextRequest) {
  try {
    const { symptom, severity, org_id } = await req.json();

    if (!symptom) {
      return NextResponse.json({ error: "symptom is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("incidents")
      .insert({
        org_id: org_id ?? null,
        title: symptom.slice(0, 100),
        symptom,
        severity: severity ?? "sev2",
        status: "investigating",
        phase: "collecting",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // TODO: Kick off investigation in background
    // await triggerInvestigation(data.id);

    return NextResponse.json(data, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create incident";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
