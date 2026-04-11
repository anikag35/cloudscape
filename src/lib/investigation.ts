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

const AWS_TIMEOUT_MS = 30_000; // 30s per AWS operation

/** Wraps a promise with a timeout. */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

/**
 * Full investigation pipeline:
 * 1. Assume IAM role into customer's AWS account
 * 2. Collect metrics, logs, trail events, service status (parallel)
 * 3. Send to Perplexity for root cause analysis
 * 4. Generate remediation options
 *
 * The `onEvent` callback streams timeline events back to the caller
 * so the UI can update in real-time. Errors in onEvent are logged
 * but do not abort the investigation.
 */
export async function runInvestigation(
  org: Organization,
  symptom: string,
  onEvent: (event: { phase: string; content: string }) => Promise<void> | void
): Promise<InvestigationResult> {
  if (!org.aws_role_arn) throw new Error("AWS not connected — no role ARN");

  const safeEvent = async (event: { phase: string; content: string }) => {
    try {
      await onEvent(event);
    } catch (err) {
      console.error("onEvent callback failed:", err);
    }
  };

  // -- Phase 1: Connect to AWS --
  await safeEvent({ phase: "collecting", content: "Assuming IAM role into your AWS account..." });

  const clients = await withTimeout(
    getAWSClients(org.aws_role_arn, org.aws_external_id, org.aws_region),
    AWS_TIMEOUT_MS,
    "AWS STS AssumeRole"
  );
  await safeEvent({ phase: "collecting", content: "Connected. Pulling metrics, logs, and events..." });

  // -- Phase 2: Collect data in parallel --
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - 30 * 60 * 1000); // 30 min window
  const trailStart = new Date(endTime.getTime() - 2 * 60 * 60 * 1000); // 2hr for deploys

  const [metrics, logExcerpts, trailEvents, serviceStatus] = await Promise.all([
    withTimeout(getMetrics(clients, startTime, endTime), AWS_TIMEOUT_MS, "CloudWatch metrics").catch(() => []),
    withTimeout(getErrorLogs(clients, startTime, endTime), AWS_TIMEOUT_MS, "CloudWatch logs").catch(() => []),
    withTimeout(getCloudTrailEvents(clients, trailStart, endTime), AWS_TIMEOUT_MS, "CloudTrail events").catch(() => []),
    withTimeout(getServiceStatus(clients), AWS_TIMEOUT_MS, "Service status").catch(() => []),
  ]);

  const awsContext: AWSContext = { metrics, logExcerpts, trailEvents, serviceStatus };

  await safeEvent({
    phase: "collecting",
    content: `Collected ${metrics.length} metric series, ${logExcerpts.length} error logs, ${trailEvents.length} trail events, ${serviceStatus.length} services`,
  });

  // -- Phase 3: Root cause analysis via Perplexity --
  await safeEvent({ phase: "analyzing", content: "Sending data to Perplexity for root cause analysis..." });
  await safeEvent({ phase: "analyzing", content: "Searching web for AWS outages and known issues..." });

  const rootCause = await analyzeRootCause(
    symptom,
    startTime.toISOString(),
    endTime.toISOString(),
    awsContext
  );

  await safeEvent({
    phase: "analyzing",
    content: `ROOT CAUSE IDENTIFIED (${Math.round(rootCause.confidence * 100)}% confidence): ${rootCause.root_cause}`,
  });

  if (rootCause.is_aws_outage) {
    await safeEvent({ phase: "analyzing", content: "AWS service disruption detected — this may be outside your control" });
  }
  if (rootCause.known_issue_url) {
    await safeEvent({ phase: "analyzing", content: `Known issue found: ${rootCause.known_issue_url}` });
  }

  // -- Phase 4: Generate remediations --
  await safeEvent({ phase: "remediating", content: "Generating remediation options..." });

  const remediations = await generateRemediations(rootCause, serviceStatus, org.aws_region);

  await safeEvent({
    phase: "remediating",
    content: `Generated ${remediations.length} remediation options (${remediations.filter((r) => r.timeframe === "immediate").length} immediate, ${remediations.filter((r) => r.timeframe === "long_term").length} long-term)`,
  });

  return { awsContext, rootCause, remediations };
}
