begin;
alter table public.ms_media add column visible boolean not null default true;
drop policy media_read on public.ms_media;
create policy media_read on public.ms_media for select to authenticated using(public.ms_is_staff() or (visible and (public.ms_owns(request_id) or public.ms_family_access(request_id,'gallery'))));
create or replace function public.ms_media_access(object_path text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.ms_media m join public.ms_requests r on r.id=m.request_id where m.path=object_path and m.visible and (r.owner_id=auth.uid() or public.ms_family_access(r.id,'gallery')))
$$;
create function public.set_media_visibility(mid uuid,is_visible boolean) returns void language plpgsql security definer set search_path='' as $$
declare rid uuid;
begin if not public.ms_is_staff() then raise exception 'Staff access required';end if;
 update public.ms_media set visible=is_visible where id=mid returning request_id into rid;
 if rid is null then raise exception 'Media not found';end if;perform ms_private.log_event(case when is_visible then 'media_restored' else 'media_hidden' end,rid);end$$;
revoke all on function public.set_media_visibility(uuid,boolean) from public,anon,authenticated;
grant execute on function public.set_media_visibility(uuid,boolean) to authenticated;
commit;
