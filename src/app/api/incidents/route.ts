import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/db";

export async function GET() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("incidents")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseClient();
  try {
    const { symptom, severity, org_id } = await req.json();
    if (!symptom) return NextResponse.json({ error: "symptom is required" }, { status: 400 });

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
    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create incident";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
