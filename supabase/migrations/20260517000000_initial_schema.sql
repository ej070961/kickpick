create extension if not exists pgcrypto;

create type public.position_code as enum (
  'GK',
  'LB',
  'LWB',
  'LCB',
  'CB',
  'RCB',
  'RWB',
  'RC',
  'LDM',
  'CDM',
  'RDM',
  'LCM',
  'CM',
  'RCM',
  'LM',
  'CAM',
  'RM',
  'LW',
  'LF',
  'CF',
  'RF',
  'RW'
);

create type public.match_status as enum (
  'draft',
  'generated',
  'completed'
);

create or replace function public.is_unique(anyarray)
returns boolean
language sql
immutable
strict
as $$
  select count(*) = count(distinct value)
  from unnest($1) as value;
$$;

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  name text not null,
  main_position public.position_code not null,
  sub_positions public.position_code[] not null default '{}',
  priority_rank integer not null,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint players_name_not_blank check (length(btrim(name)) > 0),
  constraint players_priority_rank_positive check (priority_rank > 0),
  constraint players_sub_positions_no_null check (
    array_position(sub_positions, null) is null
  ),
  constraint players_sub_positions_unique check (public.is_unique(sub_positions))
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  name text,
  match_date date,
  quarter_count integer not null,
  gk_fixed boolean not null default false,
  formation text not null,
  status public.match_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint matches_name_not_blank check (
    name is null or length(btrim(name)) > 0
  ),
  constraint matches_quarter_count_range check (quarter_count between 1 and 8),
  constraint matches_formation_not_blank check (length(btrim(formation)) > 0)
);

create table public.match_players (
  match_id uuid not null references public.matches(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete restrict,
  target_quota integer,
  is_reduced_quota boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (match_id, player_id),
  constraint match_players_target_quota_non_negative check (
    target_quota is null or target_quota >= 0
  )
);

create table public.quarter_formations (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  quarter_number integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quarter_formations_quarter_number_positive check (quarter_number > 0),
  unique (match_id, quarter_number)
);

create table public.formation_slots (
  id uuid primary key default gen_random_uuid(),
  quarter_formation_id uuid not null references public.quarter_formations(id) on delete cascade,
  slot_name public.position_code not null,
  x numeric(5, 2) not null,
  y numeric(5, 2) not null,
  player_id uuid references public.players(id) on delete set null,
  fit_score integer,
  is_manual boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint formation_slots_x_percent check (x >= 0 and x <= 100),
  constraint formation_slots_y_percent check (y >= 0 and y <= 100),
  constraint formation_slots_fit_score_range check (
    fit_score is null or fit_score between 0 and 10
  ),
  unique (quarter_formation_id, slot_name)
);

create index teams_owner_user_id_idx on public.teams(owner_user_id);
create index players_team_id_idx on public.players(team_id);
create index players_team_id_priority_rank_idx on public.players(team_id, priority_rank)
where is_deleted = false;
create index matches_team_id_created_at_idx on public.matches(team_id, created_at desc);
create index match_players_player_id_idx on public.match_players(player_id);
create index quarter_formations_match_id_idx on public.quarter_formations(match_id);
create index formation_slots_player_id_idx on public.formation_slots(player_id);
create index formation_slots_quarter_formation_id_idx on public.formation_slots(quarter_formation_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger teams_set_updated_at
before update on public.teams
for each row execute function public.set_updated_at();

create trigger players_set_updated_at
before update on public.players
for each row execute function public.set_updated_at();

create trigger matches_set_updated_at
before update on public.matches
for each row execute function public.set_updated_at();

create trigger quarter_formations_set_updated_at
before update on public.quarter_formations
for each row execute function public.set_updated_at();

create trigger formation_slots_set_updated_at
before update on public.formation_slots
for each row execute function public.set_updated_at();
