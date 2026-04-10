# Cloudscape — AI Incident Commander

> Your infrastructure breaks at 2am. Cloudscape figures out why before you finish your coffee.

Cloudscape is an AI-powered incident investigation tool for AWS. When an alert fires, it autonomously pulls CloudWatch metrics, logs, and CloudTrail events, correlates them with real-time web research (AWS outages, known bugs), identifies the root cause, generates remediation commands, and writes a blameless post-mortem — all in under a minute.

**Built for the Perplexity x Codelogy Hackathon — Track B**

## How It Works

```
CloudWatch alarm fires
        │
        ▼
Webhook hits Cloudscape
        │
        ▼
Assumes read-only IAM role into your AWS account
        │
        ▼
Pulls metrics, logs, CloudTrail events (parallel, ~5s)
        │
        ▼
Sends data to Perplexity Sonar Reasoning Pro:
"Correlate this data. Search the web for known issues.
 Check if AWS is having an outage. What's the root cause?"
        │
        ▼
Returns structured root cause + remediation options + post-mortem
        │
        ▼
User sees live timeline in the dashboard
```

## Architecture

```
┌───────────────────────────────────────────────────┐
│                  Next.js 15 App                    │
│                                                   │
│  Landing Page  │  Dashboard  │  Investigation View │
│                │  (incidents)│  (live timeline +   │
│                │             │   remediations)     │
└────────────────────────┬──────────────────────────┘
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
     ┌──────────┐ ┌──────────┐ ┌──────────┐
     │ AWS SDK  │ │Perplexity│ │ Supabase │
     │          │ │Agent API │ │(Postgres)│
     │CloudWatch│ │          │ │          │
     │CloudTrail│ │ Sonar    │ │ Realtime │
     │ ECS/RDS  │ │Reasoning │ │ Auth     │
     │          │ │ Pro      │ │          │
     └──────────┘ └──────────┘ └──────────┘
```

## Tech Stack

| Layer     | Choice                    | Why                                      |
|-----------|---------------------------|------------------------------------------|
| Frontend  | Next.js 15 + Tailwind v4  | App Router, fast, great DX               |
| Backend   | Next.js API routes        | Collocated with frontend                 |
| Database  | Supabase (Postgres)       | Free tier, Realtime for live timeline     |
| AI Engine | Perplexity Sonar Reasoning Pro | Multi-step analysis + web search     |
| AWS       | SDK v3 (STS, CW, CT, ECS, RDS) | Cross-account read-only access     |
| Deploy    | Vercel                    | Zero-config Next.js                      |

## Setup

### 1. Clone & install

```bash
git clone https://github.com/anikag35/cloudscape.git
cd cloudscape
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
# Fill in your Supabase, Perplexity, and AWS credentials
```

### 3. Database

Run `supabase/migrations/001_initial.sql` in your Supabase SQL editor.

### 4. Connect AWS (for real investigations)

Deploy the CloudFormation template in `cloudformation/cloudscape-role.yaml` to the AWS account you want to monitor. Paste the resulting Role ARN into Cloudscape's setup page.

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
cloudscape/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing page
│   │   ├── layout.tsx                  # Root layout + fonts
│   │   ├── globals.css                 # Tailwind + custom theme
│   │   ├── dashboard/page.tsx          # Incident list
│   │   ├── incident/[id]/page.tsx      # Live investigation view
│   │   └── setup/page.tsx              # AWS connection wizard (TODO)
│   ├── lib/
│   │   ├── aws/
│   │   │   ├── client.ts              # STS AssumeRole + SDK clients
│   │   │   └── collectors.ts          # CloudWatch, Logs, Trail, ECS, RDS
│   │   ├── perplexity/
│   │   │   ├── client.ts             # Agent API wrapper
│   │   │   ├── analyze.ts            # Root cause analysis prompt
│   │   │   ├── remediate.ts          # Remediation generation prompt
│   │   │   └── postmortem.ts         # Post-mortem generation prompt
│   │   ├── investigation.ts          # Orchestrator pipeline
│   │   └── db.ts                     # Supabase client
│   └── types/
│       └── index.ts                   # Shared TypeScript types
├── cloudformation/
│   └── cloudscape-role.yaml           # One-click IAM role setup
├── supabase/
│   └── migrations/
│       └── 001_initial.sql            # Database schema
└── package.json
```

## Perplexity API Usage

Cloudscape uses three Perplexity Agent API calls per investigation:

1. **Root Cause Analysis** (`sonar-reasoning-pro`) — Receives AWS metrics/logs/events, searches web for known issues and AWS outages, returns structured root cause with confidence score.

2. **Remediation Generation** (`sonar-reasoning-pro`) — Given root cause, searches for AWS best practices and current pricing, generates ranked fix options with CLI commands and Terraform code.

3. **Post-Mortem** (`sonar-pro`) — Compiles timeline, root cause, and remediations into a blameless Google SRE-format post-mortem document.

## License

MIT
