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
