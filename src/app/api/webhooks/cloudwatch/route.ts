import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/db";
import { createVerify } from "crypto";

// Only accept messages from these SNS topic ARNs (configure via env)
const ALLOWED_TOPIC_ARNS = process.env.ALLOWED_SNS_TOPIC_ARNS?.split(",").map((s) => s.trim()) ?? [];

// Fields used to build the SNS signature string for Notification messages
const NOTIFICATION_SIGN_KEYS = ["Message", "MessageId", "Subject", "Timestamp", "TopicArn", "Type"];
const SUBSCRIPTION_SIGN_KEYS = ["Message", "MessageId", "SubscribeURL", "Timestamp", "Token", "TopicArn", "Type"];

/**
 * Verify the SNS message signature to prevent spoofing.
 * Fetches the signing cert from AWS and verifies the SHA1/SHA256 signature.
 */
async function verifySNSSignature(payload: Record<string, string>): Promise<boolean> {
  const certUrl = payload.SigningCertURL;
  if (!certUrl) return false;

  // Only accept certs from amazonaws.com
  try {
    const url = new URL(certUrl);
    if (!url.hostname.endsWith(".amazonaws.com")) return false;
    if (url.protocol !== "https:") return false;
  } catch {
    return false;
  }

  const signKeys = payload.Type === "Notification" ? NOTIFICATION_SIGN_KEYS : SUBSCRIPTION_SIGN_KEYS;
  let stringToSign = "";
  for (const key of signKeys) {
    if (key in payload) {
      stringToSign += `${key}\n${payload[key]}\n`;
    }
  }

  try {
    const certRes = await fetch(certUrl);
    if (!certRes.ok) return false;
    const cert = await certRes.text();

    const version = payload.SignatureVersion;
    const algorithm = version === "2" ? "SHA256" : "SHA1";
    const verifier = createVerify(algorithm);
    verifier.update(stringToSign);
    return verifier.verify(cert, payload.Signature, "base64");
  } catch {
    return false;
  }
}

/** Check message freshness (reject messages older than 1 hour). */
function isMessageFresh(timestamp: string): boolean {
  try {
    const msgTime = new Date(timestamp).getTime();
    const now = Date.now();
    return Math.abs(now - msgTime) < 60 * 60 * 1000; // 1 hour
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseClient();
  try {
    const body = await req.text();

    let payload: Record<string, string>;
    try {
      payload = JSON.parse(body);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // Verify the SNS signature
    const signatureValid = await verifySNSSignature(payload);
    if (!signatureValid) {
      return NextResponse.json({ error: "Invalid SNS signature" }, { status: 403 });
    }

    // Verify message freshness
    if (payload.Timestamp && !isMessageFresh(payload.Timestamp)) {
      return NextResponse.json({ error: "Message too old" }, { status: 400 });
    }

    // Verify topic ARN if configured
    if (ALLOWED_TOPIC_ARNS.length > 0 && payload.TopicArn) {
      if (!ALLOWED_TOPIC_ARNS.includes(payload.TopicArn)) {
        return NextResponse.json({ error: "Topic not allowed" }, { status: 403 });
      }
    }

    if (payload.Type === "SubscriptionConfirmation") {
      if (payload.SubscribeURL) await fetch(payload.SubscribeURL);
      return NextResponse.json({ status: "subscription_confirmed" });
    }

    if (payload.Type === "Notification") {
      let message: Record<string, string>;
      try {
        message = JSON.parse(payload.Message || "{}");
      } catch {
        return NextResponse.json({ error: "Invalid notification message JSON" }, { status: 400 });
      }

      const alarmName = message.AlarmName || "Unknown alarm";
      const reason = message.NewStateReason || "No reason provided";
      const timestamp = message.StateChangeTime || new Date().toISOString();
      const symptom = `CloudWatch Alarm: "${alarmName}" — ${reason}`;

      const { data: incident, error } = await supabase
        .from("incidents")
        .insert({
          title: alarmName.slice(0, 100),
          symptom: symptom.slice(0, 5000),
          severity: "sev2",
          status: "investigating",
          phase: "collecting",
          started_at: timestamp,
        })
        .select().single();

      if (error) return NextResponse.json({ error: "Failed to create incident" }, { status: 500 });

      await supabase.from("incident_events").insert({
        incident_id: incident.id,
        timestamp,
        source: "cloudwatch",
        event_type: "info",
        content: symptom.slice(0, 5000),
        raw_data: message,
      });

      return NextResponse.json({ status: "incident_created", id: incident.id }, { status: 201 });
    }

    return NextResponse.json({ status: "ignored" });
  } catch {
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
