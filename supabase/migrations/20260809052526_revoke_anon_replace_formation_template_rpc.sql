-- Ensure only signed-in users and service_role can execute the template replace RPC.

revoke all on function public.replace_formation_template(uuid, text, jsonb) from anon;
