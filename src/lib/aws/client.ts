import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { CloudWatchClient } from "@aws-sdk/client-cloudwatch";
import { CloudWatchLogsClient } from "@aws-sdk/client-cloudwatch-logs";
import { CloudTrailClient } from "@aws-sdk/client-cloudtrail";
import { ECSClient } from "@aws-sdk/client-ecs";
import { RDSClient } from "@aws-sdk/client-rds";

/**
 * Assumes the customer's cross-account IAM role and returns
 * authenticated SDK clients for each AWS service we need.
 *
 * The role is read-only (aws:policy/ReadOnlyAccess) — we cannot
 * modify any resources in the customer's account.
 */
export interface AWSClients {
  cloudwatch: CloudWatchClient;
  logs: CloudWatchLogsClient;
  trail: CloudTrailClient;
  ecs: ECSClient;
  rds: RDSClient;
}

export async function getAWSClients(
  roleArn: string,
  externalId: string,
  region: string
): Promise<AWSClients> {
  // STS client uses Cloudscape's own credentials
  const sts = new STSClient({ region });

  const assumed = await sts.send(
    new AssumeRoleCommand({
      RoleArn: roleArn,
      RoleSessionName: `cloudscape-${Date.now()}`,
      ExternalId: externalId,
      // 1-hour session — plenty for an investigation
      DurationSeconds: 3600,
    })
  );

  const creds = assumed.Credentials;
  if (!creds?.AccessKeyId || !creds?.SecretAccessKey || !creds?.SessionToken) {
    throw new Error("Failed to assume role — check the IAM role ARN and external ID");
  }

  const credentials = {
    accessKeyId: creds.AccessKeyId,
    secretAccessKey: creds.SecretAccessKey,
    sessionToken: creds.SessionToken,
  };

  // Return clients authenticated as the customer's read-only role
  return {
    cloudwatch: new CloudWatchClient({ region, credentials }),
    logs: new CloudWatchLogsClient({ region, credentials }),
    trail: new CloudTrailClient({ region, credentials }),
    ecs: new ECSClient({ region, credentials }),
    rds: new RDSClient({ region, credentials }),
  };
}
