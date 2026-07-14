# Backend

This folder contains the server-side Supabase assets. It is deliberately separate from the Vite frontend.

- `supabase/schema.sql` creates the protected event store and analytics RPC.
- `supabase/functions/guardrail-scan` authenticates analysts, calls the evaluator, and persists the verified result.
- `.env.example` lists server-only deployment secrets. Do not expose these through Vite variables or commit their real values.

Deploy from this directory with the Supabase CLI:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set --env-file .env
supabase functions deploy guardrail-scan
```
