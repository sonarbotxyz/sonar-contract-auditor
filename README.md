# Sonar Audit — AI Smart Contract Auditor

AI-powered smart contract security auditing in 60 seconds.

## Tech Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** — dark theme, Base blue (#0052FF) accent
- **Anthropic Claude 3.5 Sonnet** — contract analysis
- **Supabase** — audit result storage + shareable links
- **Vercel** — deploy-ready

## Features

- Paste Solidity code or fetch from Etherscan by contract address
- AI-powered vulnerability detection (reentrancy, overflow, access control, etc.)
- Streaming results with severity badges (Critical/High/Medium/Low/Info)
- Security score (0-100) with visual ring
- Shareable audit reports stored in Supabase
- "Share on X" button with pre-filled tweet
- Pricing page with free tier + $19/audit (Stripe skeleton)

## Setup

1. Copy `.env.example` to `.env` and fill in your keys:

```
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_ETHERSCAN_API_KEY=...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

2. Run the Supabase schema:

```sql
-- Run supabase/schema.sql in your Supabase SQL editor
```

3. Install and run:

```bash
npm install
npm run dev
```

## Deploy to Vercel

```bash
vercel deploy
```

Set the environment variables in your Vercel project settings.

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── audit/page.tsx        # Audit input + streaming results
│   ├── results/[id]/page.tsx # Shareable results page
│   ├── pricing/page.tsx      # Pricing plans
│   └── api/
│       ├── analyze/route.ts  # Claude audit + Supabase storage
│       └── etherscan/route.ts # Contract source fetch
├── components/
│   ├── navbar.tsx
│   ├── score-ring.tsx
│   ├── severity-badge.tsx
│   └── finding-card.tsx
├── lib/
│   ├── supabase.ts
│   └── constants.ts
└── types/
    └── audit.ts
supabase/
└── schema.sql
```
