begin;
alter table public.dreams add column product_url text not null default '' check(length(product_url)<=2000 and (product_url='' or product_url ~ '^https?://'));
create table public.wish_details (
 dream_id uuid primary key references public.dreams(id) on delete cascade,
 product_url text not null default '' check(length(product_url)<=2000 and (product_url='' or product_url ~ '^https?://')),
 size text not null default '' check(length(size)<=100),
 color text not null default '' check(length(color)<=100),
 allow_similar boolean not null default false,
 priority boolean not null default false
);
create table public.wish_reservations (
 dream_id uuid primary key references public.dreams(id) on delete cascade,
 viewer_id uuid not null,
 link_id uuid not null,
 foreign key(viewer_id,link_id) references public.wish_friends(viewer_id,link_id) on delete cascade
);
alter table public.wish_details enable row level security;
alter table public.wish_reservations enable row level security;
revoke all on public.wish_details,public.wish_reservations from public,anon,authenticated;
alter table public.wish_gifts add column selected boolean not null default true,
 add column private_note text not null default '' check(length(private_note)<=2000),
 add column status text not null default 'idea' check(status in ('idea','ordered','ready'));
alter table public.wish_links add column preferences jsonb not null default '{}'::jsonb;

create function public.wish_own_details(p_dream_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.dreams where id=p_dream_id and user_id=auth.uid()) then raise exception 'Нет доступа'; end if;
 return coalesce((select to_jsonb(w)-'dream_id' from public.wish_details w where w.dream_id=p_dream_id),jsonb_build_object('product_url',(select d.product_url from public.dreams d where d.id=p_dream_id)));
end; $$;
create function public.wish_save_details(p_dream_id uuid,p_url text,p_size text,p_color text,p_similar boolean,p_priority boolean) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 -- Serialize all priority changes by the same owner; never allow a fourth priority.
 perform 1 from auth.users where id=auth.uid() for update;
 if not exists(select 1 from public.dreams where id=p_dream_id and user_id=auth.uid() and not done) then raise exception 'Нет доступа к активной мечте'; end if;
 if p_priority and (select count(*) from public.wish_details w join public.dreams d on d.id=w.dream_id where d.user_id=auth.uid() and not d.done and w.priority and d.id<>p_dream_id)>=3 then raise exception 'Можно выделить только три желания. Снимите отметку с другого.'; end if;
 insert into public.wish_details values(p_dream_id,trim(p_url),trim(p_size),trim(p_color),p_similar,p_priority)
 on conflict(dream_id) do update set product_url=excluded.product_url,size=excluded.size,color=excluded.color,allow_similar=excluded.allow_similar,priority=excluded.priority;
 return public.wish_own_details(p_dream_id);
end; $$;
create function public.wish_preferences(p_surprise boolean,p_interests text,p_colors text,p_avoid text,p_occasion text,p_date date) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null or length(p_interests)>1000 or length(p_colors)>300 or length(p_avoid)>1000 or length(p_occasion)>100 then raise exception 'Проверьте заполненные поля'; end if;
 update public.wish_links set preferences=jsonb_build_object('surprise_ok',p_surprise,'interests',trim(p_interests),'colors',trim(p_colors),'avoid',trim(p_avoid),'occasion',trim(p_occasion),'occasion_date',p_date) where owner_id=auth.uid() returning preferences into result;
 if result is null then raise exception 'Сначала сохраните настройки своей ссылки'; end if;
 return result;
end; $$;
create or replace function public.wish_mark(p_link_id uuid,p_dream_id uuid,p_marked boolean) returns void language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.wish_friends f join public.wish_links l on l.id=f.link_id join public.dreams d on d.user_id=l.owner_id where f.viewer_id=auth.uid() and l.id=p_link_id and l.enabled and l.owner_id<>auth.uid() and d.id=p_dream_id and not d.done and (l.include_future or exists(select 1 from public.wish_link_items i where i.link_id=l.id and i.dream_id=d.id))) then raise exception 'Желание больше недоступно'; end if;
 insert into public.wish_gifts(viewer_id,link_id,dream_id,selected) values(auth.uid(),p_link_id,p_dream_id,p_marked)
 on conflict(viewer_id,link_id,dream_id) do update set selected=excluded.selected;
end; $$;
create function public.wish_gift_plan(p_link_id uuid,p_dream_id uuid,p_note text,p_status text) returns void language plpgsql security definer set search_path='' as $$
begin
 perform public.wish_mark(p_link_id,p_dream_id,true);
 update public.wish_gifts set private_note=p_note,status=p_status where viewer_id=auth.uid() and link_id=p_link_id and dream_id=p_dream_id;
end; $$;
create function public.wish_reserve(p_link_id uuid,p_dream_id uuid,p_reserved boolean) returns void language plpgsql security definer set search_path='' as $$
begin
 perform public.wish_mark(p_link_id,p_dream_id,true);
 if p_reserved then
   insert into public.wish_reservations values(p_dream_id,auth.uid(),p_link_id) on conflict(dream_id) do nothing;
   if not exists(select 1 from public.wish_reservations where dream_id=p_dream_id and viewer_id=auth.uid()) then raise exception 'Этот подарок уже занят. Выберите другой.'; end if;
 else
   delete from public.wish_reservations where dream_id=p_dream_id and viewer_id=auth.uid() and link_id=p_link_id;
 end if;
end; $$;
-- Private helper only used inside authorized board projection.
create function public.wish_gift_projection(p_dream_id uuid,p_link_id uuid,p_owner boolean) returns jsonb language sql security definer set search_path='' as $$
 select jsonb_build_object(
 'details',coalesce((select to_jsonb(w)-'dream_id' from public.wish_details w where w.dream_id=p_dream_id),jsonb_build_object('product_url',(select d.product_url from public.dreams d where d.id=p_dream_id))),
 'reservation',case when p_owner then null when exists(select 1 from public.wish_reservations r where r.dream_id=p_dream_id and r.viewer_id=auth.uid()) then 'mine' when exists(select 1 from public.wish_reservations r where r.dream_id=p_dream_id) then 'other' else 'free' end,
 'private_note',case when p_owner then '' else coalesce((select g.private_note from public.wish_gifts g where g.viewer_id=auth.uid() and g.link_id=p_link_id and g.dream_id=p_dream_id),'') end,
 'gift_status',case when p_owner then 'idea' else coalesce((select g.status from public.wish_gifts g where g.viewer_id=auth.uid() and g.link_id=p_link_id and g.dream_id=p_dream_id),'idea') end);
$$;
revoke all on function public.wish_gift_projection(uuid,uuid,boolean) from public,anon,authenticated;

create or replace function public.wish_settings() returns jsonb language sql security definer set search_path = '' as $$
 select jsonb_build_object('preferences',l.preferences,'token',l.token,'enabled',l.enabled,'include_future',l.include_future,'display_name',l.display_name,
 'dream_ids',coalesce((select jsonb_agg(i.dream_id) from public.wish_link_items i where i.link_id=l.id),'[]'::jsonb))
 from public.wish_links l where l.owner_id=auth.uid();
$$;

create or replace function public.wish_board(p_token uuid default null,p_link_id uuid default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare l public.wish_links;
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 select * into l from public.wish_links x where x.enabled and
 ((p_token is not null and x.token=p_token) or (p_token is null and x.id=p_link_id and exists(select 1 from public.wish_friends f where f.link_id=x.id and f.viewer_id=auth.uid())));
 if l.id is null then raise exception 'Ссылка недоступна или доступ отключён'; end if;
 return jsonb_build_object('preferences',l.preferences,'id',l.id,'name',l.display_name,'is_owner',l.owner_id=auth.uid(),
 'saved',exists(select 1 from public.wish_friends f where f.link_id=l.id and f.viewer_id=auth.uid()),
 'dreams',coalesce((select jsonb_agg(jsonb_build_object('id',d.id,'title',d.title,'description',d.description,'image',coalesce(nullif(d.cover_image_url,''),d.image),'price',d.price,'category',d.category,
 'marked',exists(select 1 from public.wish_gifts g where g.viewer_id=auth.uid() and g.link_id=l.id and g.dream_id=d.id and g.selected)) || public.wish_gift_projection(d.id,l.id,l.owner_id=auth.uid()) order by coalesce((select w.priority from public.wish_details w where w.dream_id=d.id),false) desc,d.created_at desc)
 from public.dreams d where d.user_id=l.owner_id and not d.done and (l.include_future or exists(select 1 from public.wish_link_items i where i.link_id=l.id and i.dream_id=d.id))),'[]'::jsonb));
end; $$;

create or replace function public.wish_friends_list() returns jsonb language sql security definer set search_path = '' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',l.id,'name',l.display_name,'available',l.enabled,
 'preferences',case when l.enabled then l.preferences else '{}'::jsonb end,'count',case when l.enabled then (select count(*) from public.dreams d where d.user_id=l.owner_id and not d.done and (l.include_future or exists(select 1 from public.wish_link_items i where i.link_id=l.id and i.dream_id=d.id))) else 0 end) order by f.created_at desc),'[]'::jsonb)
 from public.wish_friends f join public.wish_links l on l.id=f.link_id where f.viewer_id=auth.uid();
$$;

revoke all on function public.wish_own_details(uuid),public.wish_save_details(uuid,text,text,text,boolean,boolean),public.wish_preferences(boolean,text,text,text,text,date),public.wish_gift_plan(uuid,uuid,text,text),public.wish_reserve(uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.wish_own_details(uuid),public.wish_save_details(uuid,text,text,text,boolean,boolean),public.wish_preferences(boolean,text,text,text,text,date),public.wish_gift_plan(uuid,uuid,text,text),public.wish_reserve(uuid,uuid,boolean) to authenticated;
commit;
