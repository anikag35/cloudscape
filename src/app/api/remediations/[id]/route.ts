import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = await requireAuth(req);
  if (authErr) return authErr;

  const supabase = getSupabaseClient();
  const { id } = await params;

  let body: { status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { status } = body;
  if (!status || !["applied", "skipped"].includes(status)) {
    return NextResponse.json({ error: "status must be 'applied' or 'skipped'" }, { status: 400 });
  }

  const { data, error } = await supabase.from("remediations").update({ status }).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: "Failed to update remediation" }, { status: 500 });
  return NextResponse.json(data);
}
