import { NextRequest, NextResponse } from "next/server";
import { getAWSClients } from "@/lib/aws/client";

export async function POST(req: NextRequest) {
  try {
    const { roleArn, externalId, region } = await req.json();
    if (!roleArn || !externalId || !region) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const clients = await getAWSClients(roleArn, externalId, region);

    // Smoke test — try listing RDS instances
    const { DescribeDBInstancesCommand } = await import("@aws-sdk/client-rds");
    await clients.rds.send(new DescribeDBInstancesCommand({}));

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Connection failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
