import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/db";

export async function POST(req: NextRequest) {
  const supabase = getSupabaseClient();
  try {
    const body = await req.text();
    const payload = JSON.parse(body);

    if (payload.Type === "SubscriptionConfirmation") {
      if (payload.SubscribeURL) await fetch(payload.SubscribeURL);
      return NextResponse.json({ status: "subscription_confirmed" });
    }

    if (payload.Type === "Notification") {
      const message = JSON.parse(payload.Message || "{}");
      const alarmName = message.AlarmName || "Unknown alarm";
      const reason = message.NewStateReason || "No reason provided";
      const timestamp = message.StateChangeTime || new Date().toISOString();
      const symptom = `CloudWatch Alarm: "${alarmName}" — ${reason}`;

      const { data: incident, error } = await supabase
        .from("incidents")
        .insert({
          title: alarmName,
          symptom,
          severity: "sev2",
          status: "investigating",
          phase: "collecting",
          started_at: timestamp,
        })
        .select().single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      await supabase.from("incident_events").insert({
        incident_id: incident.id,
        timestamp,
        source: "cloudwatch",
        event_type: "info",
        content: symptom,
        raw_data: message,
      });

      return NextResponse.json({ status: "incident_created", id: incident.id }, { status: 201 });
    }

    return NextResponse.json({ status: "ignored" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
