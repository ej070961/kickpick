-- Remove duplicate unique indexes created while hardening formation templates.
-- The existing indexes with the original schema names cover the same columns.

drop index if exists public.formation_template_slots_template_sort_order_key;
drop index if exists public.formation_template_slots_template_slot_name_key;
