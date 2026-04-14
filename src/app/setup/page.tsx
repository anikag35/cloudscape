"use client";

import Link from "next/link";
import { useState } from "react";
import { Copy, Check, ExternalLink, CheckCircle, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";

const CLOUDSCAPE_ACCOUNT_ID = "123456789012";

export default function SetupPage() {
  const [step, setStep] = useState(1);
  const [roleArn, setRoleArn] = useState("");
  const [region, setRegion] = useState("us-east-1");
  const [testing, setTesting] = useState(false);
  const [copied, setCopied] = useState(false);
  const externalId = "cs-" + Math.random().toString(36).slice(2, 10);

  const cfnUrl = `https://console.aws.amazon.com/cloudformation/home#/stacks/create/review?templateURL=https://cloudscape-public.s3.amazonaws.com/cloudscape-role.yaml&param_CloudscapeAccountId=${CLOUDSCAPE_ACCOUNT_ID}&param_ExternalId=${externalId}&stackName=CloudscapeAccess`;

  const copyExternalId = () => {
    navigator.clipboard.writeText(externalId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      const res = await fetch("/api/aws/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role_arn: roleArn, external_id: externalId, region }),
      });
      if (res.ok) setStep(3);
      else alert("Connection failed — check your Role ARN and try again.");
    } catch {
      alert("Connection failed.");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar backHref="/dashboard" title="Connect AWS" />

      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Progress bar */}
          <div className="flex items-center gap-3 mb-12">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-3 flex-1">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200 ${
                    step >= s
                      ? "bg-[var(--color-accent)] text-white"
                      : "bg-[var(--color-surface)] text-[var(--color-text-dim)] border border-[var(--color-border)]"
                  }`}
                >
                  {step > s ? <Check className="w-4 h-4" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`flex-1 h-px transition-colors duration-200 ${
                      step > s ? "bg-[var(--color-accent)]" : "bg-[var(--color-border)]"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
                Deploy the IAM Role
              </h2>
              <p className="text-[var(--color-text-muted)] mb-8 leading-relaxed">
                Click below to deploy a read-only IAM role in your AWS account. Cloudscape uses this to read CloudWatch, CloudTrail, and service data. It cannot modify anything.
              </p>

              <div className="card p-6 mb-6">
                <h3 className="text-sm font-semibold mb-3">Your External ID</h3>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-[var(--color-bg)] rounded-xl px-4 py-3 font-mono text-sm text-[var(--color-accent)]">
                    {externalId}
                  </code>
                  <button
                    onClick={copyExternalId}
                    className="w-10 h-10 rounded-xl bg-[var(--color-bg)] hover:bg-[var(--color-border)] flex items-center justify-center transition-colors duration-150"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-[var(--color-success)]" />
                    ) : (
                      <Copy className="w-4 h-4 text-[var(--color-text-dim)]" />
                    )}
                  </button>
                </div>
              </div>

              <a href={cfnUrl} target="_blank" rel="noopener noreferrer" className="btn-primary w-full">
                Launch CloudFormation Stack <ExternalLink className="w-4 h-4" />
              </a>
              <button onClick={() => setStep(2)} className="btn-ghost w-full mt-4">
                I&apos;ve deployed the stack &rarr;
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
                Paste your Role ARN
              </h2>
              <p className="text-[var(--color-text-muted)] mb-8 leading-relaxed">
                Go to the CloudFormation Outputs tab and copy the <code className="text-[var(--color-accent)] font-medium">RoleArn</code> value.
              </p>

              <div className="space-y-5 mb-8">
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Role ARN</label>
                  <input
                    type="text"
                    value={roleArn}
                    onChange={(e) => setRoleArn(e.target.value)}
                    placeholder="arn:aws:iam::123456789012:role/CloudscapeReadOnly"
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm font-mono placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-accent)] transition-colors duration-150"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">AWS Region</label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors duration-150"
                  >
                    {["us-east-1", "us-east-2", "us-west-1", "us-west-2", "eu-west-1", "eu-central-1", "ap-southeast-1", "ap-northeast-1"].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={testConnection}
                disabled={!roleArn.startsWith("arn:aws:iam") || testing}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Testing...</>
                ) : (
                  "Test Connection"
                )}
              </button>
              <button
                onClick={() => setStep(1)}
                className="w-full mt-4 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors duration-150 text-center py-2"
              >
                &larr; Back
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--color-success-dim)] flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-[var(--color-success)]" />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
                AWS Connected
              </h2>
              <p className="text-[var(--color-text-muted)] mb-8 leading-relaxed max-w-md mx-auto">
                Cloudscape can now investigate incidents in your account. Set up a webhook for automatic detection.
              </p>

              <div className="card p-6 mb-8 text-left">
                <h3 className="text-sm font-semibold mb-3">Webhook URL (CloudWatch → SNS → Cloudscape)</h3>
                <code className="block dark-inset rounded-xl px-4 py-3 font-mono text-xs text-[#f97316] break-all">
                  https://cloudscape.dev/api/webhooks/cloudwatch
                </code>
              </div>

              <Link href="/dashboard" className="btn-primary">
                Go to Dashboard
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
