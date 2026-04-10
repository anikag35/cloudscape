// ── Incident lifecycle ────────────────────────────────────────

export type Severity = "sev1" | "sev2" | "sev3";
export type IncidentStatus = "investigating" | "identified" | "mitigating" | "resolved";
export type Phase = "collecting" | "analyzing" | "remediating" | "documenting" | "complete";

export interface Incident {
  id: string;
  org_id: string;
  title: string;
  symptom: string;
  severity: Severity;
  status: IncidentStatus;
  phase: Phase;
  root_cause: RootCauseAnalysis | null;
  overall_score: number | null; // 0-100 confidence
  started_at: string;
  resolved_at: string | null;
  created_at: string;
}

// ── Timeline events ──────────────────────────────────────────

export type EventSource = "cloudwatch" | "cloudtrail" | "logs" | "agent" | "user" | "system";
export type EventType =
  | "metric_spike"
  | "deployment"
  | "error"
  | "analysis"
  | "remediation"
  | "status_change"
  | "info";

export interface IncidentEvent {
  id: string;
  incident_id: string;
  timestamp: string;
  source: EventSource;
  event_type: EventType;
  content: string;
  raw_data?: Record<string, unknown>;
  created_at: string;
}

// ── Root cause analysis (returned by Perplexity) ─────────────

export type RootCauseCategory =
  | "scaling"
  | "deployment"
  | "resource_exhaustion"
  | "aws_outage"
  | "network"
  | "config"
  | "dependency"
  | "unknown";

export interface ChainEvent {
  time: string;
  event: string;
  source: EventSource;
}

export interface RootCauseAnalysis {
  root_cause: string;
  confidence: number;
  category: RootCauseCategory;
  chain_of_events: ChainEvent[];
  contributing_factors: string[];
  is_aws_outage: boolean;
  known_issue_url: string | null;
}

// ── Remediation ──────────────────────────────────────────────

export type RiskLevel = "safe" | "caution" | "dangerous";
export type Timeframe = "immediate" | "long_term";
export type RemediationStatus = "suggested" | "applied" | "skipped";

export interface Remediation {
  id: string;
  incident_id: string;
  title: string;
  description: string;
  commands: string[];
  terraform: string | null;
  risk_level: RiskLevel;
  cost_impact: string | null;
  timeframe: Timeframe;
  status: RemediationStatus;
  created_at: string;
}

// ── Post-mortem ──────────────────────────────────────────────

export interface PostMortem {
  id: string;
  incident_id: string;
  content: string; // Markdown
  created_at: string;
}

// ── AWS context (collected before sending to Perplexity) ─────

export interface AWSContext {
  metrics: CloudWatchMetricData[];
  logExcerpts: string[];
  trailEvents: CloudTrailEvent[];
  serviceStatus: ServiceStatus[];
}

export interface CloudWatchMetricData {
  metric_name: string;
  namespace: string;
  datapoints: { timestamp: string; value: number; unit: string }[];
}

export interface CloudTrailEvent {
  event_time: string;
  event_name: string;
  event_source: string;
  username: string;
  resources: string[];
  raw: Record<string, unknown>;
}

export interface ServiceStatus {
  service: string; // e.g., "ecs", "rds", "ec2"
  resource_id: string;
  status: string;
  details: Record<string, unknown>;
}

// ── Organization / AWS connection ────────────────────────────

export interface Organization {
  id: string;
  name: string;
  aws_role_arn: string | null;
  aws_external_id: string;
  aws_region: string;
  created_at: string;
}
