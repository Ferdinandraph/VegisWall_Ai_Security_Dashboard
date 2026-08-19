-- Run in Supabase SQL Editor. The service that evaluates prompts should use the
-- service-role key server-side; browsers only use the anon key and read policies.
create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  agent_key text not null,
  flow text not null check (flow in ('402 CHALLENGE', 'SIGNED', 'SETTLED', '200 OK')),
  fee_usdc numeric(18, 6) not null default 0,
  verdict text not null check (verdict in ('SAFE', 'ATTACK_SHIELDED')),
  prompt text not null,
  malicious_block text,
  vectors jsonb not null,
  receipt jsonb not null,
  model text not null,
  endpoint text not null,
  source_ip inet,
  geo text not null default 'Unknown',
  latency_ms numeric(10, 2)
);

create index if not exists security_events_created_at_idx on public.security_events (created_at desc);
create index if not exists security_events_agent_key_idx on public.security_events (agent_key);
alter table public.security_events enable row level security;

-- ADJUSTMENT 1: Drop the old restrictive policy if it exists so we can replace it cleanly
drop policy if exists "Authenticated analysts can read security events" on public.security_events;

-- ADJUSTMENT 2: Allow both 'anon' (unauthenticated guests) and 'authenticated' users to read
create policy "Anyone can read security events"
  on public.security_events for select to anon, authenticated using (true);

alter table public.security_events replica identity full;
alter publication supabase_realtime add table public.security_events;

create or replace function public.get_security_dashboard_metrics()
returns table (total_revenue numeric, total_scans bigint, blocked_attacks bigint, average_latency_ms numeric)
language sql stable security invoker set search_path = public
as $$
  select coalesce(sum(fee_usdc), 0), count(*), count(*) filter (where verdict = 'ATTACK_SHIELDED'), avg(latency_ms)
  from public.security_events;
$$;

-- ADJUSTMENT 3: Grant execute permissions to 'anon' as well as 'authenticated'
grant execute on function public.get_security_dashboard_metrics() to anon, authenticated;

create table if not exists public.developer_accounts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null unique,
  password_hash text not null
);

create index if not exists developer_accounts_email_idx on public.developer_accounts (email);
alter table public.developer_accounts enable row level security;

create policy "Anyone can create developer accounts"
  on public.developer_accounts for insert to anon, authenticated with check (true);

create policy "Anyone can read developer accounts"
  on public.developer_accounts for select to anon, authenticated using (true);