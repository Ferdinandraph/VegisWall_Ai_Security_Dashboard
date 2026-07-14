# VegisWall AI Security Dashboard

Real-time analyst dashboard for guardrail decisions and x402 payment receipts.

## Stack

- React 18, TypeScript, Vite, Tailwind CSS and Lucide icons for the dashboard.
- Supabase Postgres, Realtime and Auth for protected audit-event storage and live updates.
- A separate guardrail API for scanning prompts, verifying payment proofs, and writing events with the Supabase service-role key. It must never run in the browser.

## Local setup

1. Create a Supabase project, then run [`server/supabase/schema.sql`](server/supabase/schema.sql) in its SQL Editor.
2. Copy `.env.example` to `.env.local` and set the project URL, anon key and your guardrail API URL.
3. Install and start the dashboard:

   ```bash
   npm install
   npm run dev
   ```

The dashboard intentionally shows no fabricated metrics or events when it is not connected. Sign in through Supabase Auth before querying protected events.

## Guardrail API contract

`POST $VITE_GUARDRAIL_API_URL`

```json
{ "prompt": "text submitted by an authorized analyst" }
```

The API returns a server-generated verdict and records the complete event in `security_events`:

```json
{
  "verdict": "SAFE",
  "vectors": { "systemOverride": 0, "dataLeakage": 0, "promptInjection": 0, "jailbreakAttempt": 0, "toolAbuse": 0, "credentialExfil": 0 },
  "receipt": "optional receipt identifier"
}
```

Use Supabase Edge Functions, a Node/Fastify service, or your existing firewall service for this API. Keep the Supabase service-role key, payment-provider secrets, and any model credentials only in that server environment.

This repository includes a deployable Supabase Edge Function at [`server/supabase/functions/guardrail-scan/index.ts`](server/supabase/functions/guardrail-scan/index.ts). Set `GUARDRAIL_EVALUATOR_URL`, `GUARDRAIL_EVALUATOR_API_KEY`, and `ALLOWED_ORIGIN` as Supabase secrets, deploy it with `supabase functions deploy guardrail-scan`, then set `VITE_GUARDRAIL_API_URL` to its public function URL. The evaluator is your actual model/policy service; the Edge Function authenticates the analyst, proxies the request, validates its verdict, and records the event.
