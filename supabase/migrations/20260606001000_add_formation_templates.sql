create table public.formation_templates (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  name text not null,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint formation_templates_name_not_blank check (length(btrim(name)) > 0)
);

create table public.formation_template_slots (
  id uuid primary key default gen_random_uuid(),
  formation_template_id uuid not null references public.formation_templates(id) on delete cascade,
  slot_name public.position_code not null,
  sort_order integer not null,
  x numeric not null,
  y numeric not null,
  created_at timestamptz not null default now(),
  constraint formation_template_slots_sort_order_range check (sort_order >= 0 and sort_order <= 10),
  constraint formation_template_slots_x_percent check (x >= 0 and x <= 100),
  constraint formation_template_slots_y_percent check (y >= 0 and y <= 100),
  unique (formation_template_id, slot_name),
  unique (formation_template_id, sort_order)
);

create index formation_templates_team_id_idx on public.formation_templates(team_id);
create index formation_template_slots_template_id_idx on public.formation_template_slots(formation_template_id);

create trigger formation_templates_set_updated_at
before update on public.formation_templates
for each row execute function public.set_updated_at();

alter table public.formation_templates enable row level security;
alter table public.formation_template_slots enable row level security;

create or replace function private.is_formation_template_owner(
  target_formation_template_id uuid
)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.formation_templates
    where id = target_formation_template_id
      and private.is_team_owner(team_id)
  );
$$;

grant execute on function private.is_formation_template_owner(uuid) to authenticated;

create policy "team owners can select formation templates"
on public.formation_templates for select
to authenticated
using (private.is_team_owner(team_id));

create policy "team owners can create formation templates"
on public.formation_templates for insert
to authenticated
with check (private.is_team_owner(team_id));

create policy "team owners can update formation templates"
on public.formation_templates for update
to authenticated
using (private.is_team_owner(team_id))
with check (private.is_team_owner(team_id));

create policy "team owners can delete formation templates"
on public.formation_templates for delete
to authenticated
using (private.is_team_owner(team_id));

create policy "team owners can select formation template slots"
on public.formation_template_slots for select
to authenticated
using (private.is_formation_template_owner(formation_template_id));

create policy "team owners can create formation template slots"
on public.formation_template_slots for insert
to authenticated
with check (private.is_formation_template_owner(formation_template_id));

create policy "team owners can update formation template slots"
on public.formation_template_slots for update
to authenticated
using (private.is_formation_template_owner(formation_template_id))
with check (private.is_formation_template_owner(formation_template_id));

create policy "team owners can delete formation template slots"
on public.formation_template_slots for delete
to authenticated
using (private.is_formation_template_owner(formation_template_id));
