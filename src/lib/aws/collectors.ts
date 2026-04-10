import {
  GetMetricDataCommand,
  type MetricDataQuery,
} from "@aws-sdk/client-cloudwatch";
import { FilterLogEventsCommand } from "@aws-sdk/client-cloudwatch-logs";
import { LookupEventsCommand } from "@aws-sdk/client-cloudtrail";
import {
  ListClustersCommand,
  ListServicesCommand,
  DescribeServicesCommand,
} from "@aws-sdk/client-ecs";
import { DescribeDBInstancesCommand } from "@aws-sdk/client-rds";
import type { AWSClients } from "./client";
import type { CloudWatchMetricData, CloudTrailEvent, ServiceStatus } from "@/types";

export async function getMetrics(
  clients: AWSClients,
  startTime: Date,
  endTime: Date
): Promise<CloudWatchMetricData[]> {
  const queries: MetricDataQuery[] = [
    { Id: "cpu", MetricStat: { Metric: { Namespace: "AWS/ECS", MetricName: "CPUUtilization" }, Period: 60, Stat: "Average" } },
    { Id: "memory", MetricStat: { Metric: { Namespace: "AWS/ECS", MetricName: "MemoryUtilization" }, Period: 60, Stat: "Average" } },
    { Id: "db_connections", MetricStat: { Metric: { Namespace: "AWS/RDS", MetricName: "DatabaseConnections" }, Period: 60, Stat: "Maximum" } },
    { Id: "db_cpu", MetricStat: { Metric: { Namespace: "AWS/RDS", MetricName: "CPUUtilization" }, Period: 60, Stat: "Average" } },
    { Id: "alb_5xx", MetricStat: { Metric: { Namespace: "AWS/ApplicationELB", MetricName: "HTTPCode_Target_5XX_Count" }, Period: 60, Stat: "Sum" } },
    { Id: "alb_latency", MetricStat: { Metric: { Namespace: "AWS/ApplicationELB", MetricName: "TargetResponseTime" }, Period: 60, Stat: "Average" } },
  ];

  const res = await clients.cloudwatch.send(
    new GetMetricDataCommand({ MetricDataQueries: queries, StartTime: startTime, EndTime: endTime })
  );

  return (res.MetricDataResults ?? []).map((r) => ({
    metric_name: r.Id ?? "unknown",
    namespace: "AWS",
    datapoints: (r.Timestamps ?? []).map((ts, i) => ({
      timestamp: ts.toISOString(),
      value: r.Values?.[i] ?? 0,
      unit: "None",
    })),
  }));
}

export async function getErrorLogs(
  clients: AWSClients,
  startTime: Date,
  endTime: Date,
  logGroupName?: string
): Promise<string[]> {
  const logGroups = logGroupName ? [logGroupName] : ["/ecs/app", "/aws/ecs", "/aws/lambda"];
  const excerpts: string[] = [];

  for (const group of logGroups) {
    try {
      const res = await clients.logs.send(
        new FilterLogEventsCommand({
          logGroupName: group,
          startTime: startTime.getTime(),
          endTime: endTime.getTime(),
          filterPattern: "?ERROR ?error ?FATAL ?Exception ?timeout ?OOM ?refused",
          limit: 50,
        })
      );
      for (const event of res.events ?? []) {
        if (event.message) {
          excerpts.push(`[${new Date(event.timestamp ?? 0).toISOString()}] [${group}] ${event.message.trim()}`);
        }
      }
    } catch {
      // Log group may not exist — skip silently
    }
  }
  return excerpts;
}

export async function getCloudTrailEvents(
  clients: AWSClients,
  startTime: Date,
  endTime: Date
): Promise<CloudTrailEvent[]> {
  const res = await clients.trail.send(
    new LookupEventsCommand({ StartTime: startTime, EndTime: endTime, MaxResults: 50 })
  );

  return (res.Events ?? []).map((e) => ({
    event_time: e.EventTime?.toISOString() ?? "",
    event_name: e.EventName ?? "",
    event_source: e.EventSource ?? "",
    username: e.Username ?? "",
    resources: (e.Resources ?? []).map((r) => r.ResourceName ?? ""),
    raw: JSON.parse(e.CloudTrailEvent ?? "{}"),
  }));
}

export async function getServiceStatus(clients: AWSClients): Promise<ServiceStatus[]> {
  const statuses: ServiceStatus[] = [];

  // ECS clusters + services
  try {
    const clusters = await clients.ecs.send(new ListClustersCommand({}));
    for (const clusterArn of clusters.clusterArns ?? []) {
      const services = await clients.ecs.send(new ListServicesCommand({ cluster: clusterArn }));
      if (services.serviceArns?.length) {
        const details = await clients.ecs.send(
          new DescribeServicesCommand({ cluster: clusterArn, services: services.serviceArns })
        );
        for (const svc of details.services ?? []) {
          statuses.push({
            service: "ecs",
            resource_id: svc.serviceName ?? "",
            status: svc.status ?? "UNKNOWN",
            details: {
              desiredCount: svc.desiredCount,
              runningCount: svc.runningCount,
              pendingCount: svc.pendingCount,
              cluster: clusterArn,
            },
          });
        }
      }
    }
  } catch {
    // No ECS — skip
  }

  // RDS instances
  try {
    const rds = await clients.rds.send(new DescribeDBInstancesCommand({}));
    for (const db of rds.DBInstances ?? []) {
      statuses.push({
        service: "rds",
        resource_id: db.DBInstanceIdentifier ?? "",
        status: db.DBInstanceStatus ?? "UNKNOWN",
        details: {
          instanceClass: db.DBInstanceClass,
          engine: db.Engine,
          engineVersion: db.EngineVersion,
          multiAZ: db.MultiAZ,
          endpoint: db.Endpoint?.Address,
        },
      });
    }
  } catch {
    // No RDS — skip
  }

  return statuses;
}
