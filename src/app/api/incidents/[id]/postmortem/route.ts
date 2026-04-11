import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { generatePostMortem } from "@/lib/perplexity/postmortem";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = await requireAuth(req);
  if (authErr) return authErr;

  const supabase = getSupabaseClient();
  const { id } = await params;

  try {
    const [incidentRes, eventsRes, remediationsRes] = await Promise.all([
      supabase.from("incidents").select("*").eq("id", id).single(),
      supabase.from("incident_events").select("*").eq("incident_id", id).order("timestamp"),
      supabase.from("remediations").select("*").eq("incident_id", id),
    ]);

    if (incidentRes.error || !incidentRes.data) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 });
    }
    if (!incidentRes.data.root_cause) {
      return NextResponse.json({ error: "No root cause yet — run investigation first" }, { status: 400 });
    }

    const content = await generatePostMortem(
      incidentRes.data, eventsRes.data ?? [], incidentRes.data.root_cause, remediationsRes.data ?? []
    );

    const { data, error } = await supabase
      .from("postmortems")
      .upsert({ incident_id: id, content }, { onConflict: "incident_id" })
      .select().single();

    if (error) return NextResponse.json({ error: "Failed to save post-mortem" }, { status: 500 });

    await supabase.from("incidents").update({ phase: "complete" }).eq("id", id);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Post-mortem generation failed" }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = await requireAuth(req);
  if (authErr) return authErr;

  const supabase = getSupabaseClient();
  const { id } = await params;

  const { data, error } = await supabase.from("postmortems").select("*").eq("incident_id", id).single();
  if (error || !data) return NextResponse.json({ error: "Post-mortem not found" }, { status: 404 });
  return NextResponse.json(data);
}
