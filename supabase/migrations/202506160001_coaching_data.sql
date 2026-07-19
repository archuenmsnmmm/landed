-- Coaching data: meetings, suggestions, and deal outcomes for manager review.
-- Desktop app syncs here when authenticated; local storage remains the offline source of truth.

create table if not exists public.meetings (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default '',
  company text not null default '',
  call_date timestamptz not null default now(),
  duration_sec integer not null default 0,
  mode text not null default 'sales',
  summary text not null default '',
  summary_sections jsonb,
  status text default 'ready',
  next_steps jsonb not null default '[]'::jsonb,
  transcript jsonb not null default '[]'::jsonb,
  deal_score integer not null default 0,
  objections jsonb not null default '[]'::jsonb,
  suggestion_uses integer not null default 0,
  suggestions jsonb not null default '[]'::jsonb,
  deal_outcome text not null default 'open',
  deal_outcome_at timestamptz,
  deal_outcome_notes text,
  deal_link jsonb,
  manager_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Existing installs may have meetings without deal_outcome; backfill before indexing.
alter table public.meetings add column if not exists deal_outcome text not null default 'open';
alter table public.meetings add column if not exists deal_outcome_at timestamptz;
alter table public.meetings add column if not exists deal_outcome_notes text;
alter table public.meetings add column if not exists deal_link jsonb;
alter table public.meetings add column if not exists manager_notes text;
alter table public.meetings add column if not exists summary_sections jsonb;
alter table public.meetings add column if not exists status text default 'ready';
alter table public.meetings add column if not exists next_steps jsonb not null default '[]'::jsonb;
alter table public.meetings add column if not exists objections jsonb not null default '[]'::jsonb;
alter table public.meetings add column if not exists suggestions jsonb not null default '[]'::jsonb;

create index if not exists meetings_user_id_idx on public.meetings (user_id);
create index if not exists meetings_deal_outcome_idx on public.meetings (deal_outcome);
create index if not exists meetings_call_date_idx on public.meetings (call_date desc);

alter table public.meetings enable row level security;

create policy "Users manage own meetings"
  on public.meetings
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Future: team_members table + manager SELECT policy when org features ship.
