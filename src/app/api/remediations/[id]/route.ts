import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/db";

const supabase = getSupabaseClient();

/** PATCH /api/remediations/[id] — mark a remediation as applied or skipped */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { status } = await req.json();

  if (!["applied", "skipped"].includes(status)) {
    return NextResponse.json({ error: "status must be 'applied' or 'skipped'" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("remediations")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
