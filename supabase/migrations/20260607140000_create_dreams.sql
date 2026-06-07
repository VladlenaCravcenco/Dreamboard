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
