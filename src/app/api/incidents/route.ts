import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

const VALID_SEVERITIES = ["sev1", "sev2", "sev3"];
const MAX_SYMPTOM_LENGTH = 5000;

export async function GET(req: NextRequest) {
  const authErr = await requireAuth(req);
  if (authErr) return authErr;

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("incidents")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: "Failed to fetch incidents" }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const authErr = await requireAuth(req);
  if (authErr) return authErr;

  const supabase = getSupabaseClient();
  try {
    const { symptom, severity, org_id } = await req.json();

    if (!symptom || typeof symptom !== "string") {
      return NextResponse.json({ error: "symptom is required and must be a string" }, { status: 400 });
    }
    if (symptom.length > MAX_SYMPTOM_LENGTH) {
      return NextResponse.json({ error: `symptom must be under ${MAX_SYMPTOM_LENGTH} characters` }, { status: 400 });
    }
    if (severity && !VALID_SEVERITIES.includes(severity)) {
      return NextResponse.json({ error: `severity must be one of: ${VALID_SEVERITIES.join(", ")}` }, { status: 400 });
    }
    if (org_id && typeof org_id !== "string") {
      return NextResponse.json({ error: "org_id must be a string" }, { status: 400 });
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

    if (error) return NextResponse.json({ error: "Failed to create incident" }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
