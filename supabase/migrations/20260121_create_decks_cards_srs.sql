-- Create 'decks' table for the app
create table if not exists public.decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text default '',
  parent_topic text,
  cards jsonb not null default '[]',
  last_studied timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_decks_user_id on public.decks (user_id);

-- Enable Row Level Security and add policies so users can manage only their own decks
alter table public.decks enable row level security;

create policy "Users can manage their own decks"
  on public.decks
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

-- Trigger to keep updated_at current
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_decks_updated_at
before update on public.decks
for each row execute procedure set_updated_at();

-- Cards table (normalized)
create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.decks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  front text not null,
  back text not null,
  status text not null default 'new',
  ease_factor double precision,
  stability double precision,
  difficulty double precision,
  interval integer,
  review_count integer default 0,
  due_date timestamptz,
  last_reviewed timestamptz,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_cards_user_due on public.cards (user_id, due_date);

alter table public.cards enable row level security;

create policy "Users can manage their own cards"
  on public.cards
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

create or replace function set_updated_at_cards()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_cards_updated_at
before update on public.cards
for each row execute procedure set_updated_at_cards();

-- Per-user SRS parameters (JSON)
create table if not exists public.srs_params (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  params jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_srs_params_user_id on public.srs_params (user_id);

alter table public.srs_params enable row level security;

create policy "Users can manage their own SRS params"
  on public.srs_params
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

create or replace function set_updated_at_srs()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_srs_params_updated_at
before update on public.srs_params
for each row execute procedure set_updated_at_srs();
