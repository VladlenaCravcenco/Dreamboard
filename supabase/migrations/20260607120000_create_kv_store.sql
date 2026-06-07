create table if not exists public.kv_store_92c819cc (
  key text primary key,
  value jsonb not null,
  user_id uuid not null references auth.users(id) on delete cascade
);

alter table public.kv_store_92c819cc
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists kv_store_92c819cc_user_id_idx
  on public.kv_store_92c819cc(user_id);

alter table public.kv_store_92c819cc enable row level security;
