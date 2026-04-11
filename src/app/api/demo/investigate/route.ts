import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/db";
import { getDemoScenario, type DemoScenario } from "@/lib/demo";
import { analyzeRootCause } from "@/lib/perplexity/analyze";
import { generateRemediations } from "@/lib/perplexity/remediate";

const VALID_SCENARIOS: DemoScenario[] = ["rds_connection_exhaustion", "ecs_oom_kill", "lambda_throttle"];

/**
 * POST /api/demo/investigate
 *
 * Runs a full investigation using mock AWS data but REAL Perplexity API calls.
 * This is what you use for the hackathon demo — no AWS account needed.
 *
 * Body: { scenario: "rds_connection_exhaustion" | "ecs_oom_kill" | "lambda_throttle" }
 */
export async function POST(req: NextRequest) {
  const supabase = getSupabaseClient();

  try {
    let body: { scenario?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const scenario = (body.scenario || "rds_connection_exhaustion") as DemoScenario;
    if (!VALID_SCENARIOS.includes(scenario)) {
      return NextResponse.json(
        { error: `Invalid scenario. Must be one of: ${VALID_SCENARIOS.join(", ")}` },
        { status: 400 }
      );
    }

    const demo = getDemoScenario(scenario);

    // 1. Create the incident
    const { data: incident, error: incErr } = await supabase
      .from("incidents")
      .insert({
        title: demo.symptom.slice(0, 100),
        symptom: demo.symptom,
        severity: "sev1",
        status: "investigating",
        phase: "collecting",
        started_at: new Date().toISOString(),
      })
      .select().single();

    if (incErr || !incident) {
      return NextResponse.json({ error: "Failed to create incident" }, { status: 500 });
    }

    const id = incident.id;

    // Helper to add timeline events — errors logged but non-fatal
    const addEvent = async (content: string, source = "agent", eventType = "info") => {
      try {
        await supabase.from("incident_events").insert({
          incident_id: id, source, event_type: eventType, content,
        });
      } catch (err) {
        console.error("Failed to add timeline event:", err);
      }
    };

    // 2. Simulate data collection phase
    await addEvent("CloudWatch alarm received", "cloudwatch");
    await supabase.from("incidents").update({ phase: "collecting" }).eq("id", id);

    await addEvent("Pulling CloudWatch metrics (ECS CPU, RDS connections, ALB 5xx)...", "system");
    await addEvent(
      `Collected ${demo.context.metrics.length} metric series, ${demo.context.logExcerpts.length} error logs, ${demo.context.trailEvents.length} CloudTrail events`,
      "system"
    );

    // Log key findings from the mock data
    for (const metric of demo.context.metrics) {
      const values = metric.datapoints.map((d) => d.value);
      const max = Math.max(...values);
      const min = Math.min(...values.slice(0, 3)); // early baseline
      if (max > min * 2) {
        await addEvent(
          `${metric.metric_name}: spiked from ${Math.round(min)} \u2192 ${Math.round(max)}`,
          "cloudwatch",
          "metric_spike"
        );
      }
    }

    for (const trail of demo.context.trailEvents) {
      await addEvent(
        `CloudTrail: ${trail.event_name} by ${trail.username} at ${trail.event_time}`,
        "cloudtrail",
        trail.event_name.includes("Update") ? "deployment" : "info"
      );
    }

    // 3. Run REAL Perplexity root cause analysis
    await supabase.from("incidents").update({ phase: "analyzing" }).eq("id", id);
    await addEvent("Sending data to Perplexity for root cause analysis...");
    await addEvent("Searching web for AWS outages and known issues...");

    let rootCause;
    try {
      const now = new Date();
      rootCause = await analyzeRootCause(
        demo.symptom,
        new Date(now.getTime() - 30 * 60000).toISOString(),
        now.toISOString(),
        demo.context
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Analysis failed";
      await addEvent(`Root cause analysis failed: ${msg}`, "system", "error");
      await supabase.from("incidents").update({ phase: "analyzing", status: "investigating" }).eq("id", id);
      return NextResponse.json({ error: "Root cause analysis failed", incident_id: id }, { status: 500 });
    }

    await addEvent(
      `ROOT CAUSE (${Math.round(rootCause.confidence * 100)}% confidence): ${rootCause.root_cause}`,
      "agent",
      "analysis"
    );

    if (rootCause.is_aws_outage) {
      await addEvent("AWS service disruption detected", "agent", "analysis");
    }
    if (rootCause.known_issue_url) {
      await addEvent(`Known issue: ${rootCause.known_issue_url}`, "agent", "analysis");
    }

    await supabase.from("incidents").update({
      root_cause: rootCause,
      overall_score: Math.round(rootCause.confidence * 100),
      status: "identified",
      phase: "remediating",
    }).eq("id", id);

    // 4. Run REAL Perplexity remediation generation
    await addEvent("Generating remediation options...");

    let remediations;
    try {
      remediations = await generateRemediations(
        rootCause,
        demo.context.serviceStatus,
        "us-east-1"
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Remediation generation failed";
      await addEvent(`Remediation generation failed: ${msg}`, "system", "error");
      // Still return success since we have root cause
      return NextResponse.json({
        success: true,
        incident_id: id,
        root_cause: rootCause,
        remediations_count: 0,
      });
    }

    // Batch insert remediations
    const remediationRows = remediations.map((rem) => ({
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

    await addEvent(
      `${remediations.length} remediation options generated (${remediations.filter((r) => r.timeframe === "immediate").length} immediate, ${remediations.filter((r) => r.timeframe === "long_term").length} long-term)`,
      "system",
      "remediation"
    );

    await supabase.from("incidents").update({ phase: "documenting" }).eq("id", id);

    return NextResponse.json({
      success: true,
      incident_id: id,
      root_cause: rootCause,
      remediations_count: remediations.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Demo investigation failed";
    console.error("Demo investigation error:", message);
    return NextResponse.json({ error: "Demo investigation failed" }, { status: 500 });
  }
}
