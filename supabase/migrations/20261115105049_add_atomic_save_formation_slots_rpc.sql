-- Save every formation slot for a match in one transaction.
-- SECURITY INVOKER keeps the caller's table grants and RLS policies in force.
create or replace function public.save_formation_slots(
  p_match_id uuid,
  p_slots jsonb
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_match_id uuid;
  v_input_count integer;
  v_distinct_slot_count integer;
  v_match_slot_count integer;
  v_updated_count integer;
begin
  if p_match_id is null then
    raise exception 'match id is required' using errcode = '22023';
  end if;

  if p_slots is null or jsonb_typeof(p_slots) <> 'array' then
    raise exception 'slots must be a json array' using errcode = '22023';
  end if;

  select m.id
    into v_match_id
  from public.matches as m
  where m.id = p_match_id;

  if v_match_id is null then
    raise exception 'match not found' using errcode = 'P0002';
  end if;

  with parsed_slots as (
    select id
    from jsonb_to_recordset(p_slots) as slot(id uuid)
  )
  select count(*), count(distinct id)
    into v_input_count, v_distinct_slot_count
  from parsed_slots;

  if v_input_count = 0 or v_input_count <> v_distinct_slot_count then
    raise exception 'slots must contain unique ids' using errcode = '22023';
  end if;

  select count(*)
    into v_match_slot_count
  from public.formation_slots as fs
  join public.quarter_formations as qf
    on qf.id = fs.quarter_formation_id
  where qf.match_id = p_match_id;

  if v_input_count <> v_match_slot_count then
    raise exception 'slot count does not match the match' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_slots) as slot(
      id uuid,
      player_id uuid,
      guest_player_id uuid,
      fit_score integer,
      is_manual boolean
    )
    where slot.player_id is not null
      and slot.guest_player_id is not null
  ) then
    raise exception 'a slot cannot have both player and guest assignments' using errcode = '22023';
  end if;

  update public.formation_slots as fs
  set
    fit_score = slot.fit_score,
    guest_player_id = slot.guest_player_id,
    is_manual = slot.is_manual,
    player_id = slot.player_id
  from jsonb_to_recordset(p_slots) as slot(
    id uuid,
    player_id uuid,
    guest_player_id uuid,
    fit_score integer,
    is_manual boolean
  )
  where fs.id = slot.id
    and exists (
      select 1
      from public.quarter_formations as qf
      where qf.id = fs.quarter_formation_id
        and qf.match_id = p_match_id
    );

  get diagnostics v_updated_count = row_count;

  if v_updated_count <> v_input_count then
    raise exception 'not all match slots could be updated' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.save_formation_slots(uuid, jsonb) from public;
revoke all on function public.save_formation_slots(uuid, jsonb) from anon;
grant execute on function public.save_formation_slots(uuid, jsonb) to authenticated;
grant execute on function public.save_formation_slots(uuid, jsonb) to service_role;
