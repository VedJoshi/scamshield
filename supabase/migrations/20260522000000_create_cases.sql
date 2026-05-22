create extension if not exists pgcrypto;

create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session_id text not null,
  input_type text not null,
  raw_input text not null,
  locale text not null,
  risk_level text not null check (risk_level in ('low', 'medium', 'high')),
  risk_score integer not null check (risk_score >= 0 and risk_score <= 100),
  signals jsonb not null,
  reasons jsonb not null,
  recommended_action text not null,
  short_report text not null
);

create index if not exists cases_session_created_idx on public.cases(session_id, created_at desc);
create index if not exists cases_created_idx on public.cases(created_at desc);
create index if not exists cases_risk_level_idx on public.cases(risk_level);

alter table public.cases enable row level security;

-- No anon/authenticated policies. ScamShield uses server-side API routes with a
-- server-only Supabase secret key and session-scoped queries.
