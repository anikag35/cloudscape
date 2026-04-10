import { queryPerplexity, parseJSON } from "./client";
import type { RootCauseAnalysis, ServiceStatus } from "@/types";

export interface RemediationOption {
  title: string;
  description: string;
  commands: string[];
  terraform: string | null;
  risk_level: "safe" | "caution" | "dangerous";
  cost_impact: string | null;
  timeframe: "immediate" | "long_term";
}

/**
 * Given a root cause analysis, generates ranked remediation options.
 * Uses Perplexity's web search to find AWS best practices and
 * current pricing for any resource changes.
 */
export async function generateRemediations(
  rootCause: RootCauseAnalysis,
  serviceStatus: ServiceStatus[],
  awsRegion: string
): Promise<RemediationOption[]> {
  const { content } = await queryPerplexity({
    messages: [
      {
        role: "system",
        content: `You are an AWS Solutions Architect generating remediation steps for a production incident.

For each remediation, provide:
1. Exact AWS CLI command(s) to execute — ready to copy-paste
2. Risk level: "safe" (no downtime), "caution" (brief disruption), or "dangerous" (potential data loss)
3. Cost impact (e.g., "+$180/mo", "no change", "-$50/mo")
4. Whether this is "immediate" (stop the bleeding now) or "long_term" (prevent recurrence)
5. Terraform code for long-term infrastructure changes (null if not applicable)

Search the web for:
- AWS best practices for this failure mode
- Current pricing for any resources you recommend adding/resizing
- Any relevant AWS documentation links

Provide 2-4 options ranked by urgency. Include at least one immediate fix and one long-term prevention.

Respond with ONLY a JSON array of remediation objects (no markdown):
[
  {
    "title": "Short title",
    "description": "What this does and why",
    "commands": ["aws cli command 1", "aws cli command 2"],
    "terraform": "terraform code or null",
    "risk_level": "safe" | "caution" | "dangerous",
    "cost_impact": "+$X/mo or null",
    "timeframe": "immediate" | "long_term"
  }
]`,
      },
      {
        role: "user",
        content: `ROOT CAUSE: ${rootCause.root_cause}
CATEGORY: ${rootCause.category}
CONTRIBUTING FACTORS: ${rootCause.contributing_factors.join(", ")}
AWS REGION: ${awsRegion}

CURRENT INFRASTRUCTURE:
${JSON.stringify(serviceStatus, null, 2)}

Generate remediation options. Search the web for current AWS pricing and best practices. Return ONLY a JSON array.`,
      },
    ],
    searchContextSize: "high",
    temperature: 0.2,
  });

  return parseJSON<RemediationOption[]>(content);
}
