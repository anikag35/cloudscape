import { getAWSClients } from "./aws/client";
import { getMetrics, getErrorLogs, getCloudTrailEvents, getServiceStatus } from "./aws/collectors";
import { analyzeRootCause } from "./perplexity/analyze";
import { generateRemediations, type RemediationOption } from "./perplexity/remediate";
import type { AWSContext, RootCauseAnalysis, Organization } from "@/types";

export interface InvestigationResult {
  awsContext: AWSContext;
  rootCause: RootCauseAnalysis;
  remediations: RemediationOption[];
}

/**
 * Full investigation pipeline:
 * 1. Assume IAM role into customer's AWS account
 * 2. Collect metrics, logs, trail events, service status (parallel)
 * 3. Send to Perplexity for root cause analysis
 * 4. Generate remediation options
 *
 * The `onEvent` callback streams timeline events back to the caller
 * so the UI can update in real-time.
 */
export async function runInvestigation(
  org: Organization,
  symptom: string,
  onEvent: (event: { phase: string; content: string }) => void
): Promise<InvestigationResult> {
  if (!org.aws_role_arn) throw new Error("AWS not connected — no role ARN");

  // ── Phase 1: Connect to AWS ──────────────────────────────
  onEvent({ phase: "collecting", content: "Assuming IAM role into your AWS account..." });

  const clients = await getAWSClients(org.aws_role_arn, org.aws_external_id, org.aws_region);
  onEvent({ phase: "collecting", content: "Connected. Pulling metrics, logs, and events..." });

  // ── Phase 2: Collect data in parallel ────────────────────
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - 30 * 60 * 1000); // 30 min window
  const trailStart = new Date(endTime.getTime() - 2 * 60 * 60 * 1000); // 2hr for deploys

  const [metrics, logExcerpts, trailEvents, serviceStatus] = await Promise.all([
    getMetrics(clients, startTime, endTime),
    getErrorLogs(clients, startTime, endTime),
    getCloudTrailEvents(clients, trailStart, endTime),
    getServiceStatus(clients),
  ]);

  const awsContext: AWSContext = { metrics, logExcerpts, trailEvents, serviceStatus };

  onEvent({
    phase: "collecting",
    content: `Collected ${metrics.length} metric series, ${logExcerpts.length} error logs, ${trailEvents.length} trail events, ${serviceStatus.length} services`,
  });

  // ── Phase 3: Root cause analysis via Perplexity ──────────
  onEvent({ phase: "analyzing", content: "Sending data to Perplexity for root cause analysis..." });
  onEvent({ phase: "analyzing", content: "Searching web for AWS outages and known issues..." });

  const rootCause = await analyzeRootCause(
    symptom,
    startTime.toISOString(),
    endTime.toISOString(),
    awsContext
  );

  onEvent({
    phase: "analyzing",
    content: `ROOT CAUSE IDENTIFIED (${Math.round(rootCause.confidence * 100)}% confidence): ${rootCause.root_cause}`,
  });

  if (rootCause.is_aws_outage) {
    onEvent({ phase: "analyzing", content: "⚠️ AWS service disruption detected — this may be outside your control" });
  }
  if (rootCause.known_issue_url) {
    onEvent({ phase: "analyzing", content: `Known issue found: ${rootCause.known_issue_url}` });
  }

  // ── Phase 4: Generate remediations ───────────────────────
  onEvent({ phase: "remediating", content: "Generating remediation options..." });

  const remediations = await generateRemediations(rootCause, serviceStatus, org.aws_region);

  onEvent({
    phase: "remediating",
    content: `Generated ${remediations.length} remediation options (${remediations.filter((r) => r.timeframe === "immediate").length} immediate, ${remediations.filter((r) => r.timeframe === "long_term").length} long-term)`,
  });

  return { awsContext, rootCause, remediations };
}
