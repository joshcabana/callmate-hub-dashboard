# CallMate AI Hub

> Autonomous call center intelligence — powered by hyper-realistic AI agents.

CallMate AI automates inbound and outbound phone calls with self-learning AI agents that deliver human-like conversations, lightning-fast responses, and zero extraction errors that improve with every call.

## Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui |
| **State** | TanStack Query (React Query) · React Context |
| **Backend** | Vercel Serverless Functions (Node 20) |
| **Database** | Supabase (PostgreSQL + RLS + Auth) |
| **Payments** | Stripe Checkout + Customer Portal + Webhooks |
| **Voice AI** | Vapi (Voice Agent Platform) |
| **SMS** | Twilio |
| **Animation** | Framer Motion |

## Features

- **📊 Real-time Dashboard** — Live call volume, minutes used, WoW trends, and 7-day charts
- **📝 Call Logs** — Searchable table with AI transcripts, summaries, intent detection, and CSV export
- **🤖 Agent Settings** — Configure voice identity, system prompts, integrations (Vapi + Twilio)
- **💳 Billing** — Stripe-powered subscription management with usage tracking and tier-based pricing
- **🔐 Auth & Onboarding** — Supabase Auth with mandatory business onboarding flow
- **🏢 Multi-tenant** — Row Level Security isolates data per business

## Getting Started

### Prerequisites

- Node.js 20+ or Bun 1.1+
- A [Supabase](https://supabase.com) project
- A [Stripe](https://stripe.com) account (test mode)
- A [Vapi](https://vapi.ai) account (optional for voice features)

### 1. Clone & Install

```bash
git clone https://github.com/joshcabana/callmate-hub-dashboard.git
cd callmate-hub-dashboard
npm install   # or: bun install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual credentials. See `.env.example` for all required variables.

### 3. Set Up Supabase

Run the migration scripts in order via the Supabase SQL Editor:

```
supabase/01_schema.sql    — Core tables (businesses, calls, call_logs)
supabase/02_rls.sql       — Row Level Security policies
supabase/03_idempotency.sql — Unique constraints + recording_url column
supabase/04_stripe.sql    — Stripe subscription tracking columns
```

### 4. Configure Stripe

1. Create a Product in your [Stripe Dashboard](https://dashboard.stripe.com/products) with pricing tiers
2. Copy the Price IDs into your `.env.local`
3. Set up a webhook endpoint pointing to `/api/webhooks/stripe` with these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

### 5. Run Development Server

```bash
npm run dev   # or: bun dev
```

Open [http://localhost:5173](http://localhost:5173)

## Deployment (Vercel)

This project is pre-configured for Vercel with `vercel.json`.

1. Push to GitHub
2. Import the repo in [Vercel Dashboard](https://vercel.com/new)
3. Add all environment variables from `.env.example` to Vercel's Environment Variables
4. Deploy — Vercel auto-detects Vite and applies the config

### Required Vercel Environment Variables

| Variable | Context |
|---|---|
| `VITE_SUPABASE_URL` | Build + Runtime |
| `VITE_SUPABASE_ANON_KEY` | Build + Runtime |
| `SUPABASE_URL` | Runtime (serverless) |
| `SUPABASE_SERVICE_ROLE_KEY` | Runtime (serverless) |
| `STRIPE_SECRET_KEY` | Runtime (serverless) |
| `STRIPE_WEBHOOK_SECRET` | Runtime (serverless) |
| `VAPI_WEBHOOK_SECRET` | Runtime (serverless) |
| `TWILIO_ACCOUNT_SID` | Runtime (serverless) |
| `TWILIO_AUTH_TOKEN` | Runtime (serverless) |
| `TWILIO_PHONE_NUMBER` | Runtime (serverless) |
| `BUSINESS_OWNER_PHONE` | Runtime (serverless) |

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | System health check |
| `/api/webhooks/vapi` | POST | Vapi call event ingestion (idempotent upsert) |
| `/api/webhooks/stripe` | POST | Stripe subscription lifecycle sync |
| `/api/stripe/checkout` | POST | Generate Checkout Session or Customer Portal URL |

## Project Structure

```
├── api/                    # Vercel Serverless Functions
│   ├── health.ts
│   ├── stripe/checkout.ts
│   └── webhooks/
│       ├── stripe.ts
│       └── vapi.ts
├── src/
│   ├── components/         # UI components (shadcn/ui + custom)
│   ├── contexts/           # React Context (Auth + Business state)
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Supabase client + queries
│   ├── pages/              # Route-level pages
│   └── test/               # Vitest test suite
├── supabase/               # SQL migration scripts
├── vercel.json             # Vercel deployment config
└── .env.example            # Environment variable template
```

## Pricing Model

| Tier | Monthly | Per-Minute | Includes |
|---|---|---|---|
| **Free** | $0 | — | 50 minutes, basic extraction |
| **Starter** | $49 | $0.09 | 2,000 minutes, transcripts, SMS alerts |
| **Pro** | $199 | $0.07 | 10,000 minutes, custom accents, priority support |
| **Enterprise** | Custom | Custom | Unlimited, HIPAA roadmap, CRM integrations |

## License

[MIT](./LICENSE) — Copyright (c) 2025-2026 CallMate AI
