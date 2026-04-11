import type { AWSContext } from "@/types";

/**
 * Demo mode: returns realistic mock AWS data so the app can be
 * demoed without connecting a real AWS account.
 *
 * The Perplexity API calls are REAL — it still searches the web
 * and reasons over the data. Only the AWS data collection is mocked.
 */

const DEMO_SCENARIOS = {
  rds_connection_exhaustion: {
    symptom: 'CloudWatch Alarm: "5xx errors > 50/min" triggered on prod-api ALB',
    context: getMockRDSContext(),
  },
  ecs_oom_kill: {
    symptom: "ECS tasks restarting repeatedly with OOMKilled exit code",
    context: getMockOOMContext(),
  },
  lambda_throttle: {
    symptom: "Lambda function checkout-handler returning ThrottlingException",
    context: getMockLambdaContext(),
  },
};

export type DemoScenario = keyof typeof DEMO_SCENARIOS;

export function getDemoScenario(scenario: DemoScenario) {
  return DEMO_SCENARIOS[scenario];
}

export function listDemoScenarios() {
  return [
    { id: "rds_connection_exhaustion", label: "RDS Connection Exhaustion", desc: "ECS auto-scale overwhelms database connections" },
    { id: "ecs_oom_kill", label: "ECS OOM Kills", desc: "Memory leak causes containers to restart" },
    { id: "lambda_throttle", label: "Lambda Throttling", desc: "Concurrency limit hit during traffic spike" },
  ];
}

function getMockRDSContext(): AWSContext {
  const now = new Date();
  const minutesAgo = (m: number) => new Date(now.getTime() - m * 60000).toISOString();

  return {
    metrics: [
      {
        metric_name: "db_connections",
        namespace: "AWS/RDS",
        datapoints: [
          { timestamp: minutesAgo(30), value: 42, unit: "Count" },
          { timestamp: minutesAgo(25), value: 45, unit: "Count" },
          { timestamp: minutesAgo(20), value: 48, unit: "Count" },
          { timestamp: minutesAgo(15), value: 55, unit: "Count" },
          { timestamp: minutesAgo(10), value: 120, unit: "Count" },
          { timestamp: minutesAgo(8), value: 195, unit: "Count" },
          { timestamp: minutesAgo(6), value: 280, unit: "Count" },
          { timestamp: minutesAgo(4), value: 300, unit: "Count" },
          { timestamp: minutesAgo(2), value: 300, unit: "Count" },
          { timestamp: minutesAgo(0), value: 300, unit: "Count" },
        ],
      },
      {
        metric_name: "alb_5xx",
        namespace: "AWS/ApplicationELB",
        datapoints: [
          { timestamp: minutesAgo(30), value: 0, unit: "Count" },
          { timestamp: minutesAgo(25), value: 0, unit: "Count" },
          { timestamp: minutesAgo(20), value: 0, unit: "Count" },
          { timestamp: minutesAgo(15), value: 0, unit: "Count" },
          { timestamp: minutesAgo(10), value: 12, unit: "Count" },
          { timestamp: minutesAgo(8), value: 145, unit: "Count" },
          { timestamp: minutesAgo(6), value: 523, unit: "Count" },
          { timestamp: minutesAgo(4), value: 847, unit: "Count" },
          { timestamp: minutesAgo(2), value: 834, unit: "Count" },
          { timestamp: minutesAgo(0), value: 812, unit: "Count" },
        ],
      },
      {
        metric_name: "cpu",
        namespace: "AWS/ECS",
        datapoints: [
          { timestamp: minutesAgo(30), value: 35, unit: "Percent" },
          { timestamp: minutesAgo(25), value: 42, unit: "Percent" },
          { timestamp: minutesAgo(20), value: 55, unit: "Percent" },
          { timestamp: minutesAgo(15), value: 72, unit: "Percent" },
          { timestamp: minutesAgo(10), value: 28, unit: "Percent" },
          { timestamp: minutesAgo(8), value: 22, unit: "Percent" },
          { timestamp: minutesAgo(6), value: 25, unit: "Percent" },
          { timestamp: minutesAgo(4), value: 30, unit: "Percent" },
          { timestamp: minutesAgo(2), value: 35, unit: "Percent" },
          { timestamp: minutesAgo(0), value: 32, unit: "Percent" },
        ],
      },
    ],
    logExcerpts: [
      `[${minutesAgo(8)}] [/ecs/api] ERROR: FATAL: too many connections for role "api_user"`,
      `[${minutesAgo(8)}] [/ecs/api] ERROR: Connection pool exhausted, cannot acquire connection`,
      `[${minutesAgo(7)}] [/ecs/api] ERROR: FATAL: remaining connection slots are reserved for non-replication superuser connections`,
      `[${minutesAgo(6)}] [/ecs/api] ERROR: connect ECONNREFUSED 10.0.1.52:5432`,
      `[${minutesAgo(6)}] [/ecs/api] ERROR: Unhandled rejection: ConnectionError: Connection terminated unexpectedly`,
      `[${minutesAgo(5)}] [/ecs/api] ERROR: FATAL: too many connections for role "api_user"`,
      `[${minutesAgo(4)}] [/ecs/api] ERROR: SequelizeConnectionError: Connection pool exhausted`,
      `[${minutesAgo(3)}] [/ecs/api] ERROR: Request timeout after 30000ms on POST /api/checkout`,
    ],
    trailEvents: [
      {
        event_time: minutesAgo(12),
        event_name: "UpdateService",
        event_source: "ecs.amazonaws.com",
        username: "autoscaling",
        resources: ["arn:aws:ecs:us-east-1:123456789012:service/prod/api"],
        raw: { requestParameters: { desiredCount: 15, cluster: "prod", service: "api" } },
      },
      {
        event_time: minutesAgo(45),
        event_name: "PutScalingPolicy",
        event_source: "autoscaling.amazonaws.com",
        username: "terraform",
        resources: ["arn:aws:autoscaling:us-east-1:123456789012:scalingPolicy:api-cpu-target"],
        raw: { requestParameters: { targetTrackingScalingPolicyConfiguration: { targetValue: 70 } } },
      },
    ],
    serviceStatus: [
      {
        service: "ecs",
        resource_id: "api",
        status: "ACTIVE",
        details: { desiredCount: 15, runningCount: 15, pendingCount: 0, cluster: "prod" },
      },
      {
        service: "rds",
        resource_id: "db-prod-1",
        status: "available",
        details: {
          instanceClass: "db.t3.medium",
          engine: "postgres",
          engineVersion: "15.4",
          multiAZ: true,
          endpoint: "db-prod-1.xxxx.us-east-1.rds.amazonaws.com",
        },
      },
    ],
  };
}

function getMockOOMContext(): AWSContext {
  const now = new Date();
  const minutesAgo = (m: number) => new Date(now.getTime() - m * 60000).toISOString();

  return {
    metrics: [
      {
        metric_name: "memory",
        namespace: "AWS/ECS",
        datapoints: [
          { timestamp: minutesAgo(30), value: 45, unit: "Percent" },
          { timestamp: minutesAgo(20), value: 62, unit: "Percent" },
          { timestamp: minutesAgo(15), value: 78, unit: "Percent" },
          { timestamp: minutesAgo(10), value: 91, unit: "Percent" },
          { timestamp: minutesAgo(5), value: 99, unit: "Percent" },
          { timestamp: minutesAgo(2), value: 45, unit: "Percent" },
          { timestamp: minutesAgo(0), value: 58, unit: "Percent" },
        ],
      },
    ],
    logExcerpts: [
      `[${minutesAgo(5)}] [/ecs/worker] ERROR: JavaScript heap out of memory`,
      `[${minutesAgo(5)}] [/ecs/worker] FATAL ERROR: Reached heap limit Allocation failed`,
      `[${minutesAgo(4)}] [/ecs/worker] ERROR: Container killed due to OOM (exit code 137)`,
      `[${minutesAgo(2)}] [/ecs/worker] ERROR: JavaScript heap out of memory`,
    ],
    trailEvents: [
      {
        event_time: minutesAgo(60),
        event_name: "UpdateService",
        event_source: "ecs.amazonaws.com",
        username: "deploy-bot",
        resources: ["arn:aws:ecs:us-east-1:123456789012:service/prod/worker"],
        raw: { requestParameters: { taskDefinition: "worker:42" } },
      },
    ],
    serviceStatus: [
      {
        service: "ecs",
        resource_id: "worker",
        status: "ACTIVE",
        details: { desiredCount: 4, runningCount: 2, pendingCount: 2, cluster: "prod" },
      },
    ],
  };
}

function getMockLambdaContext(): AWSContext {
  const now = new Date();
  const minutesAgo = (m: number) => new Date(now.getTime() - m * 60000).toISOString();

  return {
    metrics: [
      {
        metric_name: "throttles",
        namespace: "AWS/Lambda",
        datapoints: [
          { timestamp: minutesAgo(30), value: 0, unit: "Count" },
          { timestamp: minutesAgo(20), value: 0, unit: "Count" },
          { timestamp: minutesAgo(10), value: 45, unit: "Count" },
          { timestamp: minutesAgo(5), value: 312, unit: "Count" },
          { timestamp: minutesAgo(0), value: 487, unit: "Count" },
        ],
      },
    ],
    logExcerpts: [
      `[${minutesAgo(10)}] [/aws/lambda/checkout-handler] ERROR: Rate exceeded (ThrottlingException)`,
      `[${minutesAgo(8)}] [/aws/lambda/checkout-handler] ERROR: TooManyRequestsException: Rate exceeded`,
      `[${minutesAgo(5)}] [/aws/lambda/checkout-handler] ERROR: Lambda.TooManyRequestsException`,
    ],
    trailEvents: [],
    serviceStatus: [],
  };
}
