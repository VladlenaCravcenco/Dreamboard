begin;
create table public.wish_birthdays (
 user_id uuid primary key references auth.users(id) on delete cascade,
 month integer not null,
 day integer not null,
 visible boolean not null default false,
 check(month between 1 and 12),
 check(day between 1 and case when month=2 then 29 when month in (4,6,9,11) then 30 else 31 end)
);
alter table public.wish_birthdays enable row level security;
revoke all on public.wish_birthdays from public,anon,authenticated;
create function public.wish_birthday() returns jsonb language sql security definer set search_path='' as $$
 select to_jsonb(b)-'user_id' from public.wish_birthdays b where b.user_id=auth.uid();
$$;
create function public.wish_birthday_save(p_month integer,p_day integer,p_visible boolean) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Войдите в аккаунт'; end if;
 if p_month is null and p_day is null then
   delete from public.wish_birthdays where user_id=auth.uid();
 else
   insert into public.wish_birthdays values(auth.uid(),p_month,p_day,p_visible)
   on conflict(user_id) do update set month=excluded.month,day=excluded.day,visible=excluded.visible;
 end if;
 return public.wish_birthday();
end; $$;
-- Only used by authorized projections, never callable directly by clients.
create function public.wish_visible_birthday(p_owner uuid) returns jsonb language sql security definer set search_path='' as $$
 select jsonb_build_object('month',b.month,'day',b.day) from public.wish_birthdays b
 where b.user_id=p_owner and b.visible and exists(
 select 1 from public.wish_friends f join public.wish_links l on l.id=f.link_id
 where f.viewer_id=auth.uid() and l.owner_id=p_owner and l.enabled);
$$;
revoke all on function public.wish_visible_birthday(uuid) from public,anon,authenticated;
revoke all on function public.wish_birthday(),public.wish_birthday_save(integer,integer,boolean) from public,anon,authenticated;
grant execute on function public.wish_birthday(),public.wish_birthday_save(integer,integer,boolean) to authenticated;
create or replace function public.wish_board(p_token uuid default null,p_link_id uuid default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare l public.wish_links;
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 select * into l from public.wish_links x where x.enabled and
 ((p_token is not null and x.token=p_token) or (p_token is null and x.id=p_link_id and exists(select 1 from public.wish_friends f where f.link_id=x.id and f.viewer_id=auth.uid())));
 if l.id is null then raise exception 'Ссылка недоступна или доступ отключён'; end if;
 return jsonb_build_object('birthday',public.wish_visible_birthday(l.owner_id),'preferences',l.preferences,'id',l.id,'name',l.display_name,'is_owner',l.owner_id=auth.uid(),
 'saved',exists(select 1 from public.wish_friends f where f.link_id=l.id and f.viewer_id=auth.uid()),
 'dreams',coalesce((select jsonb_agg(jsonb_build_object('id',d.id,'title',d.title,'description',d.description,'image',coalesce(nullif(d.cover_image_url,''),d.image),'price',d.price,'category',d.category,
 'marked',exists(select 1 from public.wish_gifts g where g.viewer_id=auth.uid() and g.link_id=l.id and g.dream_id=d.id and g.selected)) || public.wish_gift_projection(d.id,l.id,l.owner_id=auth.uid()) order by coalesce((select w.priority from public.wish_details w where w.dream_id=d.id),false) desc,d.created_at desc)
 from public.dreams d where d.user_id=l.owner_id and not d.done and (l.include_future or exists(select 1 from public.wish_link_items i where i.link_id=l.id and i.dream_id=d.id))),'[]'::jsonb));
end; $$;

create or replace function public.wish_friends_list() returns jsonb language sql security definer set search_path = '' as $$
 select coalesce(jsonb_agg(jsonb_build_object('birthday',public.wish_visible_birthday(l.owner_id),'id',l.id,'name',l.display_name,'available',l.enabled,
 'preferences',case when l.enabled then l.preferences else '{}'::jsonb end,'count',case when l.enabled then (select count(*) from public.dreams d where d.user_id=l.owner_id and not d.done and (l.include_future or exists(select 1 from public.wish_link_items i where i.link_id=l.id and i.dream_id=d.id))) else 0 end) order by f.created_at desc),'[]'::jsonb)
 from public.wish_friends f join public.wish_links l on l.id=f.link_id where f.viewer_id=auth.uid();
$$;
commit;
