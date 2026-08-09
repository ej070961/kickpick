-- Harden formation template persistence rules.
--
-- This migration keeps the current two-table model:
--   formation_templates -> formation_template_slots
--
-- It intentionally does not add a "default/source" column because starter
-- templates become normal team templates immediately after team creation.

-- Active template names should be unique within a team.
-- Soft-deleted templates keep their history and do not block reuse.
create unique index if not exists formation_templates_team_name_active_key
  on public.formation_templates (team_id, name)
  where is_deleted = false;

-- Recreate the slot FK with cascade semantics. The DO block avoids depending
-- on the previous FK constraint name.
do $$
declare
  existing_fk_name text;
begin
  select conname
    into existing_fk_name
  from pg_constraint
  where conrelid = 'public.formation_template_slots'::regclass
    and confrelid = 'public.formation_templates'::regclass
    and contype = 'f'
  limit 1;

  if existing_fk_name is not null then
    execute format(
      'alter table public.formation_template_slots drop constraint %I',
      existing_fk_name
    );
  end if;
end $$;

alter table public.formation_template_slots
  add constraint formation_template_slots_formation_template_id_fkey
  foreign key (formation_template_id)
  references public.formation_templates(id)
  on delete cascade;

-- Prevent duplicated slot order or duplicated slot position within a template.
create unique index if not exists formation_template_slots_template_sort_order_key
  on public.formation_template_slots (formation_template_id, sort_order);

create unique index if not exists formation_template_slots_template_slot_name_key
  on public.formation_template_slots (formation_template_id, slot_name);

-- Keep slot order and field coordinates in the valid app range.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.formation_template_slots'::regclass
      and conname = 'formation_template_slots_sort_order_non_negative'
  ) then
    alter table public.formation_template_slots
      add constraint formation_template_slots_sort_order_non_negative
      check (sort_order >= 0)
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.formation_template_slots'::regclass
      and conname = 'formation_template_slots_x_range'
  ) then
    alter table public.formation_template_slots
      add constraint formation_template_slots_x_range
      check (x >= 0 and x <= 100)
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.formation_template_slots'::regclass
      and conname = 'formation_template_slots_y_range'
  ) then
    alter table public.formation_template_slots
      add constraint formation_template_slots_y_range
      check (y >= 0 and y <= 100)
      not valid;
  end if;
end $$;

alter table public.formation_template_slots
  validate constraint formation_template_slots_sort_order_non_negative;

alter table public.formation_template_slots
  validate constraint formation_template_slots_x_range;

alter table public.formation_template_slots
  validate constraint formation_template_slots_y_range;
