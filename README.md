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

## Demo Mode

You can try Cloudscape **without connecting AWS**. Demo mode uses realistic mock AWS data (metrics, logs, CloudTrail events) but calls the **real Perplexity API** for analysis — so the root cause and remediations are genuinely AI-generated.

Three built-in scenarios:

| Scenario | What happens |
|----------|-------------|
| **RDS Connection Exhaustion** | ECS auto-scales to 15 tasks, overwhelming the database connection limit |
| **ECS OOM Kills** | Memory leak causes containers to restart with exit code 137 |
| **Lambda Throttling** | Traffic spike hits concurrency limit on checkout handler |

Just set `PERPLEXITY_API_KEY` and `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`, then hit the "Investigate" button on the dashboard.

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
```

Required:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` — from your Supabase project settings
- `PERPLEXITY_API_KEY` — from [Perplexity API](https://docs.perplexity.ai)

Optional (for real AWS investigations):
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION`
- `ALLOWED_SNS_TOPIC_ARNS` — comma-separated SNS topic ARNs for webhook security

### 3. Database

Run `supabase/migrations/001_initial.sql` in your Supabase SQL editor.

### 4. Connect AWS (optional — for real investigations)

Deploy the CloudFormation template in `cloudformation/cloudscape-role.yaml` to the AWS account you want to monitor. Paste the resulting Role ARN into Cloudscape's setup page.

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Auth is skipped in development mode.

## Project Structure

```
cloudscape/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing page
│   │   ├── layout.tsx                  # Root layout + fonts
│   │   ├── providers.tsx               # Client providers (Toast, ErrorBoundary)
│   │   ├── loading.tsx                 # Global loading state
│   │   ├── not-found.tsx               # Custom 404
│   │   ├── globals.css                 # Tailwind + custom dark SRE theme
│   │   ├── dashboard/page.tsx          # Incident list + health overview
│   │   ├── incident/[id]/page.tsx      # Live investigation view
│   │   ├── incident/[id]/postmortem/   # Post-mortem viewer
│   │   ├── setup/page.tsx              # AWS connection wizard
│   │   ├── login/page.tsx              # Auth page
│   │   └── api/
│   │       ├── incidents/              # CRUD + investigate + postmortem
│   │       ├── remediations/[id]/      # Mark applied/skipped
│   │       ├── demo/investigate/        # Demo mode (mock AWS, real AI)
│   │       ├── aws/connect/            # Test IAM role connection
│   │       └── webhooks/cloudwatch/    # SNS alarm intake
│   ├── components/
│   │   ├── ErrorBoundary.tsx           # Catches render errors
│   │   ├── HealthOverview.tsx          # Dashboard stat cards
│   │   ├── InvestigateModal.tsx        # Manual incident creation
│   │   ├── MetricChart.tsx             # SVG sparkline for metrics
│   │   ├── Navbar.tsx                  # Shared navigation bar
│   │   ├── RemediationCard.tsx         # Fix option with CLI commands
│   │   ├── ScoreGauge.tsx              # Circular confidence score
│   │   ├── Skeletons.tsx               # Loading skeleton states
│   │   ├── StatusBadge.tsx             # Incident status indicator
│   │   ├── Timeline.tsx                # Real-time event timeline
│   │   └── Toast.tsx                   # Notification system
│   ├── hooks/
│   │   ├── useIncident.ts              # Single incident data + actions
│   │   └── useIncidents.ts             # Incident list + create
│   ├── lib/
│   │   ├── aws/                        # STS AssumeRole + data collectors
│   │   ├── perplexity/                 # Agent API client + prompts
│   │   ├── auth.ts                     # Session validation + requireAuth
│   │   ├── demo.ts                     # Mock AWS data for 3 scenarios
│   │   ├── investigation.ts            # Orchestrator pipeline
│   │   ├── db.ts                       # Supabase client
│   │   └── utils.ts                    # cn() helper
│   ├── types/index.ts                  # Shared TypeScript types
│   └── middleware.ts                   # Auth redirect
├── cloudformation/
│   └── cloudscape-role.yaml            # One-click IAM role setup
├── supabase/
│   └── migrations/001_initial.sql      # Database schema
└── package.json
```

## Perplexity API Usage

Cloudscape uses three Perplexity Agent API calls per investigation:

1. **Root Cause Analysis** (`sonar-reasoning-pro`) — Receives AWS metrics/logs/events, searches web for known issues and AWS outages, returns structured root cause with confidence score.

2. **Remediation Generation** (`sonar-reasoning-pro`) — Given root cause, searches for AWS best practices and current pricing, generates ranked fix options with CLI commands and Terraform code.

3. **Post-Mortem** (`sonar-pro`) — Compiles timeline, root cause, and remediations into a blameless Google SRE-format post-mortem document.

## License

MIT
