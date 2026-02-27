# CreditOS – AI-Powered Credit Intelligence

CreditOS is a subscription SaaS MVP for professional credit investors. It ingests earnings transcripts and produces structured institutional analysis, risk scoring, covenant insights, and maturity wall diagnostics.

## Stack
- Next.js App Router + TypeScript
- Tailwind CSS (dark institutional design)
- Supabase (auth + Postgres)
- OpenAI API (JSON-only prompt pipelines)
- Stripe subscriptions
- Vercel deployment target

## MVP Features Delivered
- Transcript upload flow with realistic sample transcript.
- AI-generated structured outputs:
  - Earnings summary
  - Y/Y revenue, EBITDA, FCF and margin delta check
  - Leverage + liquidity commentary
  - Covenant flexibility summary
  - Distressed warning flags
  - Exchange offer risk assessment
  - Maturity wall extraction
  - AI credit risk score (0-100) with explanation
- Institutional dashboard UI with sidebar, recent uploads, risk score gauge, maturity timeline, and key metric cards.
- Tier gating:
  - Free: 3 uploads/month, basic access
  - Pro: unlimited + premium pages/features
- Supabase route protection middleware and Stripe webhook subscription status updates.

## Environment Variables
Copy `.env.example` to `.env.local` and populate:

```bash
cp .env.example .env.local
```

Required keys:
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRO_PRICE_ID`

## Local Development
```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Supabase Setup
1. Create a Supabase project.
2. Run SQL in `supabase/schema.sql`.
3. Enable email OTP auth and add redirect URLs.
4. Ensure `users` row is created for each authenticated user (trigger or app-level upsert).

## Stripe Setup
1. Create a monthly product at `$299` and copy its Price ID into `STRIPE_PRO_PRICE_ID`.
2. Configure webhook endpoint: `/api/stripe/webhook`.
3. Subscribe to events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Store `STRIPE_WEBHOOK_SECRET`.

## Deployment to Vercel
1. Push repository to Git provider.
2. Import project into Vercel.
3. Set all env vars from `.env.example`.
4. Set webhook URL to production domain.
5. Deploy and verify login, analysis route, and upgrade flow.

## Production Notes (MVP)
- AI outputs are strict JSON to support deterministic UI rendering.
- If financial values are missing, model is instructed to return `Not disclosed`.
- PDF endpoint is an ingestion placeholder: connect OCR/parser service before analysis for production scale.
