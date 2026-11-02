-- Dreamboard: run in the SQL Editor of tbtzzpnshhsmpvyjjiyf.
-- Creates app tables and ownership policies; does not transfer old data.
begin;

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


create extension if not exists pgcrypto;

create table if not exists public.dreams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('travel', 'adventure', 'personal', 'style-health', 'material')),
  category_label text not null,
  tag text not null default '',
  title text not null check (char_length(trim(title)) > 0),
  location text,
  season text,
  price numeric(12, 2) check (price is null or price >= 0),
  duration text,
  difficulty text,
  description text not null default '',
  bucket_items jsonb not null default '[]'::jsonb,
  image text not null default '',
  done boolean not null default false,
  note text,
  saved_amount numeric(12, 2) not null default 0 check (saved_amount >= 0),
  cover_image_url text,
  completion_image_url text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dreams_user_id_idx
  on public.dreams(user_id);

create index if not exists dreams_user_done_idx
  on public.dreams(user_id, done);

alter table public.dreams enable row level security;

drop policy if exists "Users can view own dreams" on public.dreams;
create policy "Users can view own dreams"
  on public.dreams
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create own dreams" on public.dreams;
create policy "Users can create own dreams"
  on public.dreams
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own dreams" on public.dreams;
create policy "Users can update own dreams"
  on public.dreams
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own dreams" on public.dreams;
create policy "Users can delete own dreams"
  on public.dreams
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists dreams_set_updated_at on public.dreams;
create trigger dreams_set_updated_at
  before update on public.dreams
  for each row
  execute function public.set_updated_at();


alter table public.dreams
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists category text not null default 'personal',
  add column if not exists category_label text not null default 'Personal',
  add column if not exists tag text not null default '',
  add column if not exists title text not null default 'Untitled dream',
  add column if not exists location text,
  add column if not exists season text,
  add column if not exists price numeric(12, 2),
  add column if not exists duration text,
  add column if not exists difficulty text,
  add column if not exists description text not null default '',
  add column if not exists bucket_items jsonb not null default '[]'::jsonb,
  add column if not exists image text not null default '',
  add column if not exists done boolean not null default false,
  add column if not exists note text,
  add column if not exists saved_amount numeric(12, 2) not null default 0,
  add column if not exists cover_image_url text,
  add column if not exists completion_image_url text,
  add column if not exists completed_at timestamptz,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create index if not exists dreams_user_id_idx
  on public.dreams(user_id);

create index if not exists dreams_user_done_idx
  on public.dreams(user_id, done);

alter table public.dreams enable row level security;

grant select, insert, update, delete
  on public.dreams
  to authenticated;

drop policy if exists "Users can view own dreams" on public.dreams;
create policy "Users can view own dreams"
  on public.dreams
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create own dreams" on public.dreams;
create policy "Users can create own dreams"
  on public.dreams
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own dreams" on public.dreams;
create policy "Users can update own dreams"
  on public.dreams
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own dreams" on public.dreams;
create policy "Users can delete own dreams"
  on public.dreams
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.set_dream_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists dreams_set_updated_at on public.dreams;
create trigger dreams_set_updated_at
  before update on public.dreams
  for each row
  execute function public.set_dream_updated_at();


-- Explicit grants are needed when automatic table exposure is disabled.
grant usage on schema public to authenticated, service_role;
revoke all on public.dreams from anon;
grant select, insert, update, delete on public.dreams to authenticated, service_role;
-- Legacy server-only storage is never exposed to browser roles.
revoke all on public.kv_store_92c819cc from anon, authenticated;
grant select, insert, update, delete on public.kv_store_92c819cc to service_role;


commit;
