import { queryPerplexity, parseJSON } from "./client";
import type { AWSContext, RootCauseAnalysis, EventSource } from "@/types";

const VALID_CATEGORIES = [
  "scaling", "deployment", "resource_exhaustion", "aws_outage",
  "network", "config", "dependency", "unknown",
];

/** Runtime validation for the Perplexity root cause response. */
function validateRootCause(data: unknown): RootCauseAnalysis {
  if (!data || typeof data !== "object") {
    throw new Error("Root cause response is not an object");
  }

  const obj = data as Record<string, unknown>;

  return {
    root_cause: typeof obj.root_cause === "string" ? obj.root_cause : "Unknown root cause",
    confidence: typeof obj.confidence === "number" ? Math.min(1, Math.max(0, obj.confidence)) : 0.5,
    category: VALID_CATEGORIES.includes(obj.category as string)
      ? (obj.category as RootCauseAnalysis["category"])
      : "unknown",
    chain_of_events: Array.isArray(obj.chain_of_events)
      ? obj.chain_of_events.map((e: Record<string, unknown>) => ({
          time: typeof e.time === "string" ? e.time : "",
          event: typeof e.event === "string" ? e.event : "",
          source: (typeof e.source === "string" ? e.source : "system") as EventSource,
        }))
      : [],
    contributing_factors: Array.isArray(obj.contributing_factors)
      ? obj.contributing_factors.filter((f): f is string => typeof f === "string")
      : [],
    is_aws_outage: typeof obj.is_aws_outage === "boolean" ? obj.is_aws_outage : false,
    known_issue_url: typeof obj.known_issue_url === "string" ? obj.known_issue_url : null,
  };
}

/**
 * Sends collected AWS metrics, logs, and CloudTrail events to Perplexity
 * Sonar Reasoning Pro. The model correlates the data, searches the web for
 * known issues and AWS outage status, and returns a structured root cause.
 */
export async function analyzeRootCause(
  symptom: string,
  startTime: string,
  endTime: string,
  awsContext: AWSContext
): Promise<RootCauseAnalysis> {
  const { content } = await queryPerplexity({
    messages: [
      {
        role: "system",
        content: `You are an expert AWS Site Reliability Engineer performing incident root cause analysis.

You will receive CloudWatch metrics, CloudWatch Logs excerpts, and CloudTrail events from a production AWS environment experiencing an active incident.

Your job:
1. Correlate the data to identify the probable root cause.
2. Search the web to check if AWS itself is experiencing a service disruption (check https://health.aws.amazon.com and recent reports).
3. Search for known issues matching the error signature (AWS forums, Stack Overflow, GitHub issues).
4. Build a chain of events showing exactly what happened and when.

You MUST respond with ONLY a JSON object (no markdown, no explanation) in this exact schema:
{
  "root_cause": "One clear sentence describing the root cause",
  "confidence": 0.0 to 1.0,
  "category": "scaling" | "deployment" | "resource_exhaustion" | "aws_outage" | "network" | "config" | "dependency" | "unknown",
  "chain_of_events": [
    { "time": "ISO8601 timestamp", "event": "what happened", "source": "cloudwatch" | "cloudtrail" | "logs" }
  ],
  "contributing_factors": ["factor1", "factor2"],
  "is_aws_outage": true | false,
  "known_issue_url": "URL if this matches a known bug/issue, or null"
}`,
      },
      {
        role: "user",
        content: `INCIDENT SYMPTOM: ${symptom}
TIME WINDOW: ${startTime} to ${endTime}

CLOUDWATCH METRICS (last 30 min):
${JSON.stringify(awsContext.metrics, null, 2)}

CLOUDWATCH LOGS (error entries, last 30 min):
${awsContext.logExcerpts.slice(0, 50).join("\n")}

CLOUDTRAIL EVENTS (last 2 hours):
${JSON.stringify(awsContext.trailEvents, null, 2)}

SERVICE STATUS:
${JSON.stringify(awsContext.serviceStatus, null, 2)}

Analyze this incident. Search the web for any matching known issues or active AWS outages. Return ONLY JSON.`,
      },
    ],
    // High search context so Perplexity thoroughly checks AWS status pages
    searchContextSize: "high",
    temperature: 0.1,
  });

  const parsed = parseJSON<unknown>(content);
  return validateRootCause(parsed);
}
