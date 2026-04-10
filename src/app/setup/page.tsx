"use client";

import Link from "next/link";
import { useState } from "react";
import { Zap, ArrowLeft, Copy, Check, ExternalLink, CheckCircle, Loader2 } from "lucide-react";

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
      <nav className="flex items-center justify-between px-8 py-5 max-w-4xl mx-auto border-b border-[var(--color-border)]">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center">
              <Zap className="w-5 h-5 text-black" />
            </div>
            <span className="text-xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>Connect AWS</span>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-8 py-12">
        {/* Progress bar */}
        <div className="flex items-center gap-3 mb-12">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-3 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= s ? "bg-[var(--color-accent)] text-black" : "bg-[var(--color-surface)] text-[var(--color-text-dim)] border border-[var(--color-border)]"}`}>
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 3 && <div className={`flex-1 h-px ${step > s ? "bg-[var(--color-accent)]" : "bg-[var(--color-border)]"}`} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>Deploy the IAM Role</h2>
            <p className="text-[var(--color-text-muted)] mb-8">
              Click below to deploy a read-only IAM role in your AWS account. Cloudscape uses this to read CloudWatch, CloudTrail, and service data. It cannot modify anything.
            </p>
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 mb-6">
              <h3 className="text-sm font-semibold mb-3">Your External ID</h3>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-[var(--color-bg)] rounded-lg px-4 py-2.5 font-mono text-sm text-[var(--color-accent)]">{externalId}</code>
                <button onClick={copyExternalId} className="p-2.5 rounded-lg bg-[var(--color-bg)] hover:bg-[var(--color-surface-elevated)] transition">
                  {copied ? <Check className="w-4 h-4 text-[var(--color-success)]" /> : <Copy className="w-4 h-4 text-[var(--color-text-dim)]" />}
                </button>
              </div>
            </div>
            <a href={cfnUrl} target="_blank" rel="noopener noreferrer" className="w-full bg-[var(--color-accent)] text-black px-6 py-3 rounded-lg font-semibold text-center hover:brightness-110 transition flex items-center justify-center gap-2">
              Launch CloudFormation Stack <ExternalLink className="w-4 h-4" />
            </a>
            <button onClick={() => setStep(2)} className="w-full mt-4 bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] px-6 py-3 rounded-lg font-medium text-center hover:border-[var(--color-border-bright)] transition">
              I&apos;ve deployed the stack &rarr;
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>Paste your Role ARN</h2>
            <p className="text-[var(--color-text-muted)] mb-8">Go to the CloudFormation Outputs tab and copy the <code className="text-[var(--color-accent)]">RoleArn</code> value.</p>
            <div className="space-y-4 mb-8">
              <div>
                <label className="text-sm text-[var(--color-text-muted)] mb-2 block">Role ARN</label>
                <input type="text" value={roleArn} onChange={(e) => setRoleArn(e.target.value)} placeholder="arn:aws:iam::123456789012:role/CloudscapeReadOnly" className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-4 py-3 text-sm font-mono text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-[var(--color-accent)]" />
              </div>
              <div>
                <label className="text-sm text-[var(--color-text-muted)] mb-2 block">AWS Region</label>
                <select value={region} onChange={(e) => setRegion(e.target.value)} className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-4 py-3 text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]">
                  {["us-east-1","us-east-2","us-west-1","us-west-2","eu-west-1","eu-central-1","ap-southeast-1","ap-northeast-1"].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
            <button onClick={testConnection} disabled={!roleArn.startsWith("arn:aws:iam") || testing} className="w-full bg-[var(--color-accent)] text-black px-6 py-3 rounded-lg font-semibold hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {testing ? <><Loader2 className="w-4 h-4 animate-spin" /> Testing...</> : "Test Connection"}
            </button>
            <button onClick={() => setStep(1)} className="w-full mt-3 text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text-muted)] transition text-center">&larr; Back</button>
          </div>
        )}

        {step === 3 && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--color-success-dim)] flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-[var(--color-success)]" />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>AWS Connected</h2>
            <p className="text-[var(--color-text-muted)] mb-8">Cloudscape can now investigate incidents in your account. Set up a webhook for automatic detection.</p>
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 mb-8 text-left">
              <h3 className="text-sm font-semibold mb-3">Webhook URL (CloudWatch → SNS → Cloudscape)</h3>
              <code className="block bg-[var(--color-bg)] rounded-lg px-4 py-2.5 font-mono text-xs text-[var(--color-accent)] break-all">
                https://cloudscape.dev/api/webhooks/cloudwatch
              </code>
            </div>
            <Link href="/dashboard" className="bg-[var(--color-accent)] text-black px-8 py-3 rounded-lg font-semibold hover:brightness-110 transition inline-flex items-center gap-2">
              Go to Dashboard
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
