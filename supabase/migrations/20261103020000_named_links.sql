begin;
alter table public.wish_links add column slug text unique;
-- Retain old names so an old invitation can never open another person's list.
create table public.wish_link_names (
 slug text primary key check(slug ~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$'),
 owner_id uuid not null references auth.users(id) on delete cascade
);
alter table public.wish_link_names enable row level security;
revoke all on public.wish_link_names from public,anon,authenticated;
create or replace function public.wish_settings() returns jsonb language sql security definer set search_path='' as $$
 select jsonb_build_object('slug',l.slug,'preferences',l.preferences,'token',l.token,'enabled',l.enabled,'include_future',l.include_future,'display_name',l.display_name,
 'dream_ids',coalesce((select jsonb_agg(i.dream_id) from public.wish_link_items i where i.link_id=l.id),'[]'::jsonb))
 from public.wish_links l where l.owner_id=auth.uid();
$$;
create function public.wish_configure_named(p_name text,p_slug text,p_enabled boolean,p_future boolean,p_dream_ids uuid[]) returns jsonb language plpgsql security definer set search_path='' as $$
declare normalized text:=lower(trim(p_slug)); old_slug text;
begin
 if auth.uid() is null then raise exception 'Войдите в аккаунт'; end if;
 if normalized is null or normalized !~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$' then raise exception 'В адресе нужно 3–30 латинских букв, цифр или дефисов. Начало и конец — буква или цифра.'; end if;
 perform 1 from auth.users where id=auth.uid() for update;
 select slug into old_slug from public.wish_links where owner_id=auth.uid();
 if old_slug is distinct from normalized then
  begin
   insert into public.wish_link_names values(normalized,auth.uid());
  exception when unique_violation then raise exception 'Это имя ссылки уже занято. Попробуйте другое.';
  end;
 end if;
 perform public.wish_configure(p_name,p_enabled,p_future,p_dream_ids);
 update public.wish_links set slug=normalized where owner_id=auth.uid();
 return public.wish_settings();
end; $$;
create function public.wish_board_named(p_slug text) returns jsonb language plpgsql security definer set search_path='' as $$
declare token_value uuid;
begin
 if auth.uid() is null then raise exception 'Войдите в аккаунт'; end if;
 select token into token_value from public.wish_links where slug=lower(p_slug) and enabled;
 if token_value is null then raise exception 'Ссылка недоступна или доступ отключён'; end if;
 return public.wish_board(token_value,null);
end; $$;
create function public.wish_save_friend_named(p_slug text) returns uuid language plpgsql security definer set search_path='' as $$
declare token_value uuid;
begin
 if auth.uid() is null then raise exception 'Войдите в аккаунт'; end if;
 select token into token_value from public.wish_links where slug=lower(p_slug) and enabled;
 if token_value is null then raise exception 'Ссылка недоступна или доступ отключён'; end if;
 return public.wish_save_friend(token_value);
end; $$;
create or replace function public.wish_rotate() returns jsonb language plpgsql security definer set search_path='' as $$
declare lid uuid;
begin
 update public.wish_links set token=gen_random_uuid(),slug=null,enabled=false where owner_id=auth.uid() returning id into lid;
 delete from public.wish_friends where link_id=lid;
 return public.wish_settings();
end; $$;
revoke all on function public.wish_configure_named(text,text,boolean,boolean,uuid[]),public.wish_board_named(text),public.wish_save_friend_named(text) from public,anon,authenticated;
grant execute on function public.wish_configure_named(text,text,boolean,boolean,uuid[]),public.wish_board_named(text),public.wish_save_friend_named(text) to authenticated;
commit;
