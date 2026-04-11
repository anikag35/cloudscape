import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getAWSClients } from "@/lib/aws/client";

const VALID_REGIONS = [
  "us-east-1", "us-east-2", "us-west-1", "us-west-2",
  "eu-west-1", "eu-west-2", "eu-west-3", "eu-central-1", "eu-north-1",
  "ap-southeast-1", "ap-southeast-2", "ap-northeast-1", "ap-northeast-2", "ap-south-1",
  "sa-east-1", "ca-central-1", "me-south-1", "af-south-1",
];

const ROLE_ARN_PATTERN = /^arn:aws:iam::\d{12}:role\/[\w+=,.@-]+$/;

export async function POST(req: NextRequest) {
  const authErr = await requireAuth(req);
  if (authErr) return authErr;

  try {
    let body: { roleArn?: string; externalId?: string; region?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { roleArn, externalId, region } = body;

    if (!roleArn || !externalId || !region) {
      return NextResponse.json({ error: "Missing required fields: roleArn, externalId, region" }, { status: 400 });
    }
    if (!ROLE_ARN_PATTERN.test(roleArn)) {
      return NextResponse.json({ error: "Invalid IAM role ARN format" }, { status: 400 });
    }
    if (!VALID_REGIONS.includes(region)) {
      return NextResponse.json({ error: `Invalid region. Must be one of: ${VALID_REGIONS.join(", ")}` }, { status: 400 });
    }
    if (typeof externalId !== "string" || externalId.length < 2 || externalId.length > 128) {
      return NextResponse.json({ error: "externalId must be 2-128 characters" }, { status: 400 });
    }

    const clients = await getAWSClients(roleArn, externalId, region);

    // Smoke test — try listing RDS instances
    const { DescribeDBInstancesCommand } = await import("@aws-sdk/client-rds");
    await clients.rds.send(new DescribeDBInstancesCommand({}));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to connect — check the IAM role ARN and external ID" }, { status: 500 });
  }
}
