-- Link-only sharing. No direct API access: RPCs return a minimal projection,
-- and always identify the viewer from auth.uid(), never from a client argument.
begin;
create table public.wish_links (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  display_name text not null check (length(trim(display_name)) between 1 and 100),
  enabled boolean not null default false,
  include_future boolean not null default false
);
create table public.wish_link_items (
  link_id uuid not null references public.wish_links(id) on delete cascade,
  dream_id uuid not null references public.dreams(id) on delete cascade,
  primary key(link_id,dream_id)
);
create table public.wish_friends (
  viewer_id uuid not null references auth.users(id) on delete cascade,
  link_id uuid not null references public.wish_links(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(viewer_id,link_id)
);
create table public.wish_gifts (
  viewer_id uuid not null,
  link_id uuid not null,
  dream_id uuid not null references public.dreams(id) on delete cascade,
  primary key(viewer_id,link_id,dream_id),
  foreign key(viewer_id,link_id) references public.wish_friends(viewer_id,link_id) on delete cascade
);
alter table public.wish_links enable row level security;
alter table public.wish_link_items enable row level security;
alter table public.wish_friends enable row level security;
alter table public.wish_gifts enable row level security;
revoke all on public.wish_links, public.wish_link_items, public.wish_friends, public.wish_gifts from public, anon, authenticated;

create function public.wish_settings() returns jsonb language sql security definer set search_path = '' as $$
 select jsonb_build_object('token',l.token,'enabled',l.enabled,'include_future',l.include_future,'display_name',l.display_name,
 'dream_ids',coalesce((select jsonb_agg(i.dream_id) from public.wish_link_items i where i.link_id=l.id),'[]'::jsonb))
 from public.wish_links l where l.owner_id=auth.uid();
$$;

create function public.wish_configure(p_name text,p_enabled boolean,p_future boolean,p_dream_ids uuid[]) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare lid uuid;
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 if exists(select 1 from unnest(p_dream_ids) x where not exists(select 1 from public.dreams d where d.id=x and d.user_id=auth.uid())) then raise exception 'Invalid selection'; end if;
 insert into public.wish_links(owner_id,display_name,enabled,include_future) values(auth.uid(),trim(p_name),p_enabled,p_future)
 on conflict(owner_id) do update set display_name=excluded.display_name,enabled=excluded.enabled,include_future=excluded.include_future returning id into lid;
 delete from public.wish_link_items where link_id=lid;
 insert into public.wish_link_items select lid,x from (select distinct unnest(p_dream_ids) x) s;
 return public.wish_settings();
end; $$;

-- Rotating the link also revokes saved access and private marks for that link.
create function public.wish_rotate() returns jsonb language plpgsql security definer set search_path = '' as $$
declare lid uuid;
begin
 update public.wish_links set token=gen_random_uuid() where owner_id=auth.uid() returning id into lid;
 delete from public.wish_friends where link_id=lid;
 return public.wish_settings();
end; $$;

create function public.wish_board(p_token uuid default null,p_link_id uuid default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare l public.wish_links;
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 select * into l from public.wish_links x where x.enabled and
 ((p_token is not null and x.token=p_token) or (p_token is null and x.id=p_link_id and exists(select 1 from public.wish_friends f where f.link_id=x.id and f.viewer_id=auth.uid())));
 if l.id is null then raise exception 'Ссылка недоступна или доступ отключён'; end if;
 return jsonb_build_object('id',l.id,'name',l.display_name,'is_owner',l.owner_id=auth.uid(),
 'saved',exists(select 1 from public.wish_friends f where f.link_id=l.id and f.viewer_id=auth.uid()),
 'dreams',coalesce((select jsonb_agg(jsonb_build_object('id',d.id,'title',d.title,'description',d.description,'image',coalesce(nullif(d.cover_image_url,''),d.image),'price',d.price,'category',d.category,
 'marked',exists(select 1 from public.wish_gifts g where g.viewer_id=auth.uid() and g.link_id=l.id and g.dream_id=d.id)) order by d.created_at desc)
 from public.dreams d where d.user_id=l.owner_id and not d.done and (l.include_future or exists(select 1 from public.wish_link_items i where i.link_id=l.id and i.dream_id=d.id))),'[]'::jsonb));
end; $$;

create function public.wish_save_friend(p_token uuid) returns uuid language plpgsql security definer set search_path = '' as $$
declare l public.wish_links;
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 select * into l from public.wish_links where token=p_token and enabled;
 if l.id is null then raise exception 'Ссылка недоступна или доступ отключён'; end if;
 if l.owner_id=auth.uid() then raise exception 'Это ваш список'; end if;
 insert into public.wish_friends(viewer_id,link_id) values(auth.uid(),l.id) on conflict do nothing;
 return l.id;
end; $$;

create function public.wish_friends_list() returns jsonb language sql security definer set search_path = '' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',l.id,'name',l.display_name,'available',l.enabled,
 'count',case when l.enabled then (select count(*) from public.dreams d where d.user_id=l.owner_id and not d.done and (l.include_future or exists(select 1 from public.wish_link_items i where i.link_id=l.id and i.dream_id=d.id))) else 0 end) order by f.created_at desc),'[]'::jsonb)
 from public.wish_friends f join public.wish_links l on l.id=f.link_id where f.viewer_id=auth.uid();
$$;
create function public.wish_remove_friend(p_link_id uuid) returns void language sql security definer set search_path = '' as $$
 delete from public.wish_friends where viewer_id=auth.uid() and link_id=p_link_id;
$$;
create function public.wish_mark(p_link_id uuid,p_dream_id uuid,p_marked boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 if not exists(select 1 from public.wish_friends f join public.wish_links l on l.id=f.link_id join public.dreams d on d.user_id=l.owner_id
 where f.viewer_id=auth.uid() and l.id=p_link_id and l.enabled and l.owner_id<>auth.uid() and d.id=p_dream_id and not d.done
 and (l.include_future or exists(select 1 from public.wish_link_items i where i.link_id=l.id and i.dream_id=d.id))) then raise exception 'Желание больше недоступно'; end if;
 if p_marked then insert into public.wish_gifts values(auth.uid(),p_link_id,p_dream_id) on conflict do nothing;
 else delete from public.wish_gifts where viewer_id=auth.uid() and link_id=p_link_id and dream_id=p_dream_id; end if;
end; $$;

revoke all on function public.wish_settings(), public.wish_configure(text,boolean,boolean,uuid[]), public.wish_rotate(), public.wish_board(uuid,uuid), public.wish_save_friend(uuid), public.wish_friends_list(), public.wish_remove_friend(uuid), public.wish_mark(uuid,uuid,boolean) from public, anon, authenticated;
grant execute on function public.wish_settings(), public.wish_configure(text,boolean,boolean,uuid[]), public.wish_rotate(), public.wish_board(uuid,uuid), public.wish_save_friend(uuid), public.wish_friends_list(), public.wish_remove_friend(uuid), public.wish_mark(uuid,uuid,boolean) to authenticated;
commit;
