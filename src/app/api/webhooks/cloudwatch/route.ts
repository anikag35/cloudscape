import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/db";

const supabase = getSupabaseClient();

/**
 * POST /api/webhooks/cloudwatch
 *
 * Receives CloudWatch alarm notifications via SNS.
 * SNS sends either a SubscriptionConfirmation or a Notification.
 *
 * Flow: CloudWatch Alarm → SNS Topic → HTTPS subscription → this endpoint
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const payload = JSON.parse(body);

    // SNS sends a SubscriptionConfirmation first — we need to confirm it
    if (payload.Type === "SubscriptionConfirmation") {
      const confirmUrl = payload.SubscribeURL;
      if (confirmUrl) {
        await fetch(confirmUrl);
        return NextResponse.json({ status: "subscription_confirmed" });
      }
    }

    // Actual alarm notification
    if (payload.Type === "Notification") {
      const message = JSON.parse(payload.Message || "{}");
      const alarmName = message.AlarmName || "Unknown alarm";
      const reason = message.NewStateReason || "No reason provided";
      const timestamp = message.StateChangeTime || new Date().toISOString();
      const region = message.Region || "us-east-1";

      const symptom = `CloudWatch Alarm: "${alarmName}" — ${reason}`;

      // Create incident automatically
      const { data: incident, error } = await supabase
        .from("incidents")
        .insert({
          title: alarmName,
          symptom,
          severity: "sev2", // Default — could parse alarm priority
          status: "investigating",
          phase: "collecting",
          started_at: timestamp,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Log the alarm as the first timeline event
      await supabase.from("incident_events").insert({
        incident_id: incident.id,
        timestamp,
        source: "cloudwatch",
        event_type: "info",
        content: symptom,
        raw_data: message,
      });

      // TODO: Auto-trigger investigation
      // fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/incidents/${incident.id}/investigate`, { method: 'POST' });

      return NextResponse.json({ status: "incident_created", id: incident.id }, { status: 201 });
    }

    return NextResponse.json({ status: "ignored" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
