create table if not exists public.users (
  id uuid primary key,
  email text not null unique,
  subscription_status text not null default 'free',
  stripe_customer_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sector text,
  created_at timestamptz not null default now()
);

create table if not exists public.transcripts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  company_id uuid references public.companies(id),
  upload_date timestamptz not null default now(),
  raw_text text not null
);

create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  transcript_id uuid not null references public.transcripts(id) on delete cascade,
  summary_json jsonb,
  risk_score int,
  leverage_metrics jsonb,
  liquidity_metrics jsonb,
  maturity_data jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.portfolio (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  company_id uuid references public.companies(id),
  bond_identifier text not null,
  cost_basis numeric(10, 4),
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.transcripts enable row level security;
alter table public.analyses enable row level security;
alter table public.portfolio enable row level security;

create policy if not exists "users_manage_own_profile" on public.users
  for all using (auth.uid() = id);

create policy if not exists "users_manage_own_transcripts" on public.transcripts
  for all using (auth.uid() = user_id);

create policy if not exists "users_manage_own_portfolio" on public.portfolio
  for all using (auth.uid() = user_id);
