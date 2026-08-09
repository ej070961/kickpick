-- Atomically replace a formation template name and slot rows.
--
-- Supabase RPC calls this Postgres function from the server action. Keeping the
-- update/delete/insert sequence inside one function prevents partial template
-- updates when one of the slot writes fails.

create or replace function public.replace_formation_template(
  p_template_id uuid,
  p_name text,
  p_slots jsonb
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_name text := btrim(coalesce(p_name, ''));
  v_template_id uuid;
  v_slot_count integer;
  v_distinct_slot_names integer;
  v_distinct_sort_orders integer;
  v_has_gk boolean;
  v_has_invalid_slot boolean;
begin
  if p_template_id is null then
    raise exception 'template id is required' using errcode = '22023';
  end if;

  if v_name = '' then
    raise exception 'template name is required' using errcode = '22023';
  end if;

  if p_slots is null or jsonb_typeof(p_slots) <> 'array' then
    raise exception 'slots must be a json array' using errcode = '22023';
  end if;

  with parsed_slots as (
    select
      (slot->>'slot_name')::public.position_code as slot_name,
      (slot->>'sort_order')::integer as sort_order,
      (slot->>'x')::numeric as x,
      (slot->>'y')::numeric as y
    from jsonb_array_elements(p_slots) as slot
  )
  select
    count(*),
    count(distinct slot_name),
    count(distinct sort_order),
    coalesce(bool_or(slot_name = 'GK'::public.position_code), false),
    coalesce(
      bool_or(
        slot_name is null
        or sort_order is null
        or sort_order < 0
        or x is null
        or x < 0
        or x > 100
        or y is null
        or y < 0
        or y > 100
      ),
      true
    )
  into
    v_slot_count,
    v_distinct_slot_names,
    v_distinct_sort_orders,
    v_has_gk,
    v_has_invalid_slot
  from parsed_slots;

  if v_slot_count <> 11 then
    raise exception 'formation template must have 11 slots' using errcode = '22023';
  end if;

  if v_distinct_slot_names <> 11 then
    raise exception 'formation template slots must be unique' using errcode = '22023';
  end if;

  if v_distinct_sort_orders <> 11 then
    raise exception 'formation template slot order must be unique' using errcode = '22023';
  end if;

  if not v_has_gk then
    raise exception 'formation template must include GK' using errcode = '22023';
  end if;

  if v_has_invalid_slot then
    raise exception 'formation template slot values are invalid' using errcode = '22023';
  end if;

  select ft.id
    into v_template_id
  from public.formation_templates as ft
  join public.teams as t on t.id = ft.team_id
  where ft.id = p_template_id
    and ft.is_deleted = false
    and t.owner_user_id = (select auth.uid())
  for update of ft;

  if v_template_id is null then
    raise exception 'formation template not found' using errcode = 'P0002';
  end if;

  update public.formation_templates
  set name = v_name
  where id = p_template_id;

  delete from public.formation_template_slots
  where formation_template_id = p_template_id;

  insert into public.formation_template_slots (
    formation_template_id,
    slot_name,
    sort_order,
    x,
    y
  )
  select
    p_template_id,
    (slot->>'slot_name')::public.position_code,
    (slot->>'sort_order')::integer,
    (slot->>'x')::numeric,
    (slot->>'y')::numeric
  from jsonb_array_elements(p_slots) as slot;
end;
$$;

revoke all on function public.replace_formation_template(uuid, text, jsonb) from public;
revoke all on function public.replace_formation_template(uuid, text, jsonb) from anon;
grant execute on function public.replace_formation_template(uuid, text, jsonb) to authenticated;
grant execute on function public.replace_formation_template(uuid, text, jsonb) to service_role;
