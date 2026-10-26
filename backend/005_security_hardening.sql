begin;
create or replace function ms_private.clean_selection(s jsonb) returns jsonb language plpgsql set search_path='' as $$
declare p text:=s->>'package'; g text:=trim(s->>'place'); result jsonb;
begin
 if jsonb_typeof(s) is distinct from 'object' or p not in('Basic','Plus','Complete') or p is null or coalesce(length(g),0) not between 1 and 180 or octet_length(s::text)>10000 then raise exception 'Invalid request selection';end if;
 if s->>'date' is not null and s->>'date'<>'' and (s->>'date')::date<current_date then raise exception 'Preferred date must be today or later';end if;
 if jsonb_typeof(s->'additions') is distinct from 'array' or jsonb_array_length(s->'additions')>10 then raise exception 'Invalid additions';end if;
 result=jsonb_build_object('package',p,'place',g,'paath',left(coalesce(s->>'paath','No additional Paath requested'),180),'notes',left(coalesce(s->>'notes',''),1200),'additions',(select coalesce(jsonb_agg(value),'[]'::jsonb) from jsonb_array_elements_text(s->'additions') where value in('Rumala Sahib','Deg / Karah Prashad','Ardaas','Langar seva','Food / fruit distribution') or (p='Complete' and value='Live video call')),'date',case when p='Complete' then coalesce(s->>'date','') else '' end);
return result;
end$$;
create or replace function public.create_request(selection jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare rid uuid;
begin
 if auth.uid() is null then raise exception 'Sign in first';end if;
 -- Serialize the per-account quota check and insert.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(auth.uid()::text,0));
 if (select count(*) from public.ms_requests where owner_id=auth.uid() and created_at>now()-interval '1 hour')>=10 then raise exception 'Too many requests. Please contact the team.';end if;
 insert into public.ms_requests(owner_id,selection) values(auth.uid(),ms_private.clean_selection(selection)) returning id into rid;
 insert into public.ms_events(request_id,stage,note) values(rid,'received','Your request has been received. Arrangements and cost still need confirmation.');
 perform ms_private.log_event('request_created',rid);return rid;
end$$;
create or replace function public.invite_family(rid uuid,email text,can_gallery boolean,can_call boolean,days integer default 7) returns uuid language plpgsql security definer set search_path='' as $$
declare iid uuid;
begin
 if not public.ms_owns(rid) then raise exception 'Only the request owner may invite';end if;
 perform 1 from public.ms_requests where id=rid for update;
 if email!~'^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or length(email)>254 or days not between 1 and 30 then raise exception 'Invalid email or expiry';end if;
 if can_call and not exists(select 1 from public.ms_requests where id=rid and selection->>'package'='Complete') then raise exception 'Live family calls are Premium only';end if;
 if (select count(*) from public.ms_family where request_id=rid and revoked_at is null and expires_at>now())>=10 then raise exception 'Maximum ten active invitations';end if;
 insert into public.ms_family(request_id,email,can_gallery,can_call,expires_at) values(rid,lower(trim(email)),can_gallery,can_call,now()+make_interval(days=>days)) returning id into iid;
 perform ms_private.log_event('family_invited',rid);return iid;
end$$;
commit;
