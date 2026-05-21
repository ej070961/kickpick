grant usage on schema public to authenticated;

grant select, insert, update, delete on public.teams to authenticated;
grant select, insert, update, delete on public.players to authenticated;
grant select, insert, update, delete on public.matches to authenticated;
grant select, insert, update, delete on public.match_players to authenticated;
grant select, insert, update, delete on public.quarter_formations to authenticated;
grant select, insert, update, delete on public.formation_slots to authenticated;

create or replace function public.is_team_owner(target_team_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.teams
    where id = target_team_id
      and owner_user_id = auth.uid()
  );
$$;

create or replace function public.is_match_owner(target_match_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.matches
    where id = target_match_id
      and public.is_team_owner(team_id)
  );
$$;

create or replace function public.is_quarter_formation_owner(
  target_quarter_formation_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.quarter_formations
    where id = target_quarter_formation_id
      and public.is_match_owner(match_id)
  );
$$;

create or replace function public.is_match_player_valid(
  target_match_id uuid,
  target_player_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.matches as m
    join public.players as p on p.team_id = m.team_id
    where m.id = target_match_id
      and p.id = target_player_id
      and public.is_team_owner(m.team_id)
  );
$$;

create or replace function public.is_formation_slot_assignment_valid(
  target_quarter_formation_id uuid,
  target_player_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select target_player_id is null or exists (
    select 1
    from public.quarter_formations as qf
    join public.matches as m on m.id = qf.match_id
    join public.players as p on p.team_id = m.team_id
    where qf.id = target_quarter_formation_id
      and p.id = target_player_id
      and public.is_team_owner(m.team_id)
  );
$$;

alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.match_players enable row level security;
alter table public.quarter_formations enable row level security;
alter table public.formation_slots enable row level security;

create policy "team owners can select teams"
on public.teams for select
to authenticated
using (owner_user_id = auth.uid());

create policy "users can create owned teams"
on public.teams for insert
to authenticated
with check (owner_user_id = auth.uid());

create policy "team owners can update teams"
on public.teams for update
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

create policy "team owners can delete teams"
on public.teams for delete
to authenticated
using (owner_user_id = auth.uid());

create policy "team owners can select players"
on public.players for select
to authenticated
using (public.is_team_owner(team_id));

create policy "team owners can create players"
on public.players for insert
to authenticated
with check (public.is_team_owner(team_id));

create policy "team owners can update players"
on public.players for update
to authenticated
using (public.is_team_owner(team_id))
with check (public.is_team_owner(team_id));

create policy "team owners can delete players"
on public.players for delete
to authenticated
using (public.is_team_owner(team_id));

create policy "team owners can select matches"
on public.matches for select
to authenticated
using (public.is_team_owner(team_id));

create policy "team owners can create matches"
on public.matches for insert
to authenticated
with check (public.is_team_owner(team_id));

create policy "team owners can update matches"
on public.matches for update
to authenticated
using (public.is_team_owner(team_id))
with check (public.is_team_owner(team_id));

create policy "team owners can delete matches"
on public.matches for delete
to authenticated
using (public.is_team_owner(team_id));

create policy "team owners can select match players"
on public.match_players for select
to authenticated
using (public.is_match_owner(match_id));

create policy "team owners can create match players"
on public.match_players for insert
to authenticated
with check (public.is_match_player_valid(match_id, player_id));

create policy "team owners can update match players"
on public.match_players for update
to authenticated
using (public.is_match_owner(match_id))
with check (public.is_match_player_valid(match_id, player_id));

create policy "team owners can delete match players"
on public.match_players for delete
to authenticated
using (public.is_match_owner(match_id));

create policy "team owners can select quarter formations"
on public.quarter_formations for select
to authenticated
using (public.is_match_owner(match_id));

create policy "team owners can create quarter formations"
on public.quarter_formations for insert
to authenticated
with check (public.is_match_owner(match_id));

create policy "team owners can update quarter formations"
on public.quarter_formations for update
to authenticated
using (public.is_match_owner(match_id))
with check (public.is_match_owner(match_id));

create policy "team owners can delete quarter formations"
on public.quarter_formations for delete
to authenticated
using (public.is_match_owner(match_id));

create policy "team owners can select formation slots"
on public.formation_slots for select
to authenticated
using (public.is_quarter_formation_owner(quarter_formation_id));

create policy "team owners can create formation slots"
on public.formation_slots for insert
to authenticated
with check (
  public.is_quarter_formation_owner(quarter_formation_id)
  and public.is_formation_slot_assignment_valid(quarter_formation_id, player_id)
);

create policy "team owners can update formation slots"
on public.formation_slots for update
to authenticated
using (public.is_quarter_formation_owner(quarter_formation_id))
with check (
  public.is_quarter_formation_owner(quarter_formation_id)
  and public.is_formation_slot_assignment_valid(quarter_formation_id, player_id)
);

create policy "team owners can delete formation slots"
on public.formation_slots for delete
to authenticated
using (public.is_quarter_formation_owner(quarter_formation_id));
