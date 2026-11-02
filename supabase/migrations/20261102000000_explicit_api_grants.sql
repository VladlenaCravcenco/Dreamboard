-- Explicit grants are needed when automatic table exposure is disabled.
grant usage on schema public to authenticated, service_role;
revoke all on public.dreams from anon;
grant select, insert, update, delete on public.dreams to authenticated, service_role;
-- Legacy server-only storage is never exposed to browser roles.
revoke all on public.kv_store_92c819cc from anon, authenticated;
grant select, insert, update, delete on public.kv_store_92c819cc to service_role;
