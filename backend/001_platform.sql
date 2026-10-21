-- Run once in a NEW Supabase project's SQL editor. No default staff account.
begin;
create schema if not exists ms_private;
revoke all on schema ms_private from public;
create table ms_private.staff(user_id uuid primary key references auth.users(id));
create table public.ms_requests(
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id),
 selection jsonb not null, status text not null default 'received' check(status in('received','details_confirmed','scheduled','completed')),
 scheduled_date date, call_url text, created_at timestamptz not null default now()
);
create index on public.ms_requests(owner_id);
create table public.ms_events(id uuid primary key default gen_random_uuid(),request_id uuid not null references public.ms_requests(id),stage text not null,note text not null,created_at timestamptz not null default now());
create index on public.ms_events(request_id);
create table public.ms_quotes(id uuid primary key default gen_random_uuid(),request_id uuid not null references public.ms_requests(id),version integer not null,currency text not null check(currency~'^[A-Z]{3}$'),items jsonb not null,total numeric,terms text not null,rate_snapshot jsonb not null default '{}',state text not null check(state in('draft','issued','superseded','accepted')),accepted_at timestamptz,created_at timestamptz not null default now(),unique(request_id,version));
create index on public.ms_quotes(request_id);
create table public.ms_family(id uuid primary key default gen_random_uuid(),request_id uuid not null references public.ms_requests(id),email text not null,can_gallery boolean not null default false,can_call boolean not null default false,expires_at timestamptz not null,revoked_at timestamptz,created_at timestamptz not null default now());
create index on public.ms_family(request_id);
create table public.ms_media(id uuid primary key default gen_random_uuid(),request_id uuid not null references public.ms_requests(id),path text unique not null,caption text not null,created_at timestamptz not null default now());
create table public.ms_reviews(id uuid primary key default gen_random_uuid(),request_id uuid unique not null references public.ms_requests(id),owner_id uuid not null references auth.users(id),display_name text not null,story text not null,consent boolean not null,approved boolean not null default false,created_at timestamptz not null default now());
create table public.ms_drafts(owner_id uuid primary key references auth.users(id),selection jsonb not null,updated_at timestamptz not null default now());
create table ms_private.audit(id uuid primary key default gen_random_uuid(),actor_id uuid,action text not null,request_id uuid,created_at timestamptz not null default now());
alter table ms_private.staff enable row level security;
alter table ms_private.audit enable row level security;

create function public.ms_is_staff() returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from ms_private.staff where user_id=auth.uid())$$;
create function public.ms_owns(rid uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.ms_requests where id=rid and owner_id=auth.uid())$$;
create function public.ms_family_access(rid uuid,scope text default 'updates') returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.ms_family where request_id=rid and lower(email)=lower(auth.jwt()->>'email') and revoked_at is null and expires_at>now() and (scope='updates' or (scope='gallery' and can_gallery) or (scope='call' and can_call)))
$$;
alter table public.ms_requests enable row level security;
alter table public.ms_events enable row level security;
alter table public.ms_quotes enable row level security;
alter table public.ms_family enable row level security;
alter table public.ms_media enable row level security;
alter table public.ms_reviews enable row level security;
alter table public.ms_drafts enable row level security;
create policy requests_read on public.ms_requests for select to authenticated using(owner_id=auth.uid() or public.ms_is_staff());
create policy events_read on public.ms_events for select to authenticated using(public.ms_owns(request_id) or public.ms_is_staff() or public.ms_family_access(request_id));
create policy quotes_read on public.ms_quotes for select to authenticated using(public.ms_is_staff() or (public.ms_owns(request_id) and state<>'draft'));
create policy family_read on public.ms_family for select to authenticated using(public.ms_owns(request_id) or public.ms_is_staff());
create policy media_read on public.ms_media for select to authenticated using(public.ms_owns(request_id) or public.ms_is_staff() or public.ms_family_access(request_id,'gallery'));
create policy reviews_read on public.ms_reviews for select to authenticated using(owner_id=auth.uid() or public.ms_is_staff());
create policy drafts_read on public.ms_drafts for select to authenticated using(owner_id=auth.uid());
revoke all on public.ms_requests,public.ms_events,public.ms_quotes,public.ms_family,public.ms_media,public.ms_reviews,public.ms_drafts from anon,authenticated;
grant select on public.ms_requests,public.ms_events,public.ms_quotes,public.ms_family,public.ms_media,public.ms_reviews,public.ms_drafts to authenticated;

create function ms_private.log_event(action text,rid uuid) returns void language sql security definer set search_path='' as $$insert into ms_private.audit(actor_id,action,request_id) values(auth.uid(),action,rid)$$;
create function ms_private.clean_selection(s jsonb) returns jsonb language plpgsql set search_path='' as $$
declare p text:=s->>'package'; g text:=trim(s->>'place'); result jsonb;
begin
 if jsonb_typeof(s)<>'object' or p not in('Basic','Plus','Complete') or p is null or coalesce(length(g),0) not between 1 and 180 or octet_length(s::text)>10000 then raise exception 'Invalid request selection';end if;
 if s->>'date' is not null and s->>'date'<>'' and (s->>'date')::date<current_date then raise exception 'Preferred date must be today or later';end if;
 if jsonb_typeof(s->'additions')<>'array' or jsonb_array_length(s->'additions')>10 then raise exception 'Invalid additions';end if;
 result=jsonb_build_object('package',p,'place',g,'paath',left(coalesce(s->>'paath','No additional Paath requested'),180),'notes',left(coalesce(s->>'notes',''),1200),'additions',(select coalesce(jsonb_agg(value),'[]'::jsonb) from jsonb_array_elements_text(s->'additions') where value in('Rumala Sahib','Deg / Karah Prashad','Ardaas','Langar seva','Food / fruit distribution') or (p='Complete' and value='Live video call')),'date',case when p='Complete' then coalesce(s->>'date','') else '' end);
 return result;
end$$;
create function public.create_request(selection jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare rid uuid;
begin
 if auth.uid() is null then raise exception 'Sign in first';end if;
 if (select count(*) from public.ms_requests where owner_id=auth.uid() and created_at>now()-interval '1 hour')>=10 then raise exception 'Too many requests. Please contact the team.';end if;
 insert into public.ms_requests(owner_id,selection) values(auth.uid(),ms_private.clean_selection(selection)) returning id into rid;
 insert into public.ms_events(request_id,stage,note) values(rid,'received','Your request has been received. Arrangements and cost still need confirmation.');
 perform ms_private.log_event('request_created',rid);return rid;
end$$;
create function public.save_draft(selection jsonb) returns void language plpgsql security definer set search_path='' as $$
begin if auth.uid() is null or octet_length(selection::text)>10000 then raise exception 'Invalid draft';end if;
 insert into public.ms_drafts values(auth.uid(),selection,now()) on conflict(owner_id) do update set selection=excluded.selection,updated_at=now();end$$;
create function public.clear_draft() returns void language sql security definer set search_path='' as $$delete from public.ms_drafts where owner_id=auth.uid()$$;
create function public.update_request(rid uuid,new_stage text,new_date date,live_url text,note text) returns void language plpgsql security definer set search_path='' as $$
declare s jsonb; old_stage text;
begin
 if not public.ms_is_staff() then raise exception 'Staff access required';end if;
 select selection,status into s,old_stage from public.ms_requests where id=rid for update;
 if s is null then raise exception 'Request not found';end if;
 if new_stage not in('received','details_confirmed','scheduled','completed') or length(note)>600 then raise exception 'Invalid stage or update';end if;
 if new_stage in('details_confirmed','scheduled','completed') and not exists(select 1 from public.ms_quotes where request_id=rid and state='accepted') then raise exception 'An accepted quotation is required first';end if;
 if new_stage='scheduled' and new_date is null then raise exception 'Enter the agreed date';end if;
 if coalesce(live_url,'')<>'' and (s->>'package'<>'Complete' or live_url!~'^https://[^[:space:]]+$') then raise exception 'HTTPS live call links are Premium only';end if;
 update public.ms_requests set status=new_stage,scheduled_date=new_date,call_url=nullif(live_url,'') where id=rid;
 insert into public.ms_events(request_id,stage,note) values(rid,new_stage,coalesce(nullif(trim(note),''),'Your request status has been updated.'));
 perform ms_private.log_event('status_updated',rid);
end$$;
create function public.save_quote(rid uuid,currency text,items jsonb,terms text,rate_snapshot jsonb,issue boolean default false) returns uuid language plpgsql security definer set search_path='' as $$
declare item jsonb; amount numeric:=0; pending boolean:=false; ver integer; qid uuid; cleaned jsonb:='[]';qty numeric;price numeric;
begin
 if not public.ms_is_staff() then raise exception 'Staff access required';end if;
 perform 1 from public.ms_requests where id=rid for update;if not found then raise exception 'Request not found';end if;
 if currency!~'^[A-Z]{3}$' or currency in('INR','PKR','BDT') or jsonb_typeof(items)<>'array' or jsonb_array_length(items) not between 1 and 30 or octet_length(items::text)>20000 or length(terms)>5000 then raise exception 'Invalid quotation';end if;
 for item in select value from jsonb_array_elements(items) loop
  qty=(item->>'quantity')::numeric;price=(item->>'unit_price')::numeric;
  if coalesce(length(trim(item->>'description')),0) not between 1 and 180 or qty is null or qty<=0 or qty>100000 or qty::text='NaN' or price<0 or price>10000000 or price::text='NaN' then raise exception 'Invalid quotation item';end if;
  if price is null then pending=true;else amount=amount+qty*price;end if;
  cleaned=cleaned||jsonb_build_array(jsonb_build_object('description',trim(item->>'description'),'quantity',qty,'unit_price',price));
 end loop;
 if issue and (pending or coalesce(length(trim(terms)),0)<20) then raise exception 'Confirm every price and enter payment, cancellation and refund terms before issuing';end if;
 select coalesce(max(version),0)+1 into ver from public.ms_quotes where request_id=rid;
 if issue then update public.ms_quotes set state='superseded' where request_id=rid and state in('issued','accepted');end if;
 insert into public.ms_quotes(request_id,version,currency,items,total,terms,rate_snapshot,state) values(rid,ver,currency,cleaned,case when pending then null else round(amount,2) end,terms,coalesce(rate_snapshot,'{}'),case when issue then 'issued' else 'draft' end) returning id into qid;
 perform ms_private.log_event(case when issue then 'quote_issued' else 'quote_draft_saved' end,rid);return qid;
end$$;
create function public.accept_quote(qid uuid) returns void language plpgsql security definer set search_path='' as $$
declare rid uuid;qstate text;
begin
 select request_id into rid from public.ms_quotes where id=qid;if not public.ms_owns(rid) then raise exception 'Only the request owner may accept';end if;
 perform 1 from public.ms_requests where id=rid for update;
 select state into qstate from public.ms_quotes where id=qid for update;
 if qstate<>'issued' then raise exception 'This quotation is not available for acceptance';end if;
 update public.ms_quotes set state='accepted',accepted_at=now() where id=qid;
 insert into public.ms_events(request_id,stage,note) values(rid,'details_confirmed','The customer accepted the written quotation. Scheduling will be confirmed by the team.');
 update public.ms_requests set status='details_confirmed' where id=rid;
 perform ms_private.log_event('quote_accepted',rid);
end$$;
create function public.invite_family(rid uuid,email text,can_gallery boolean,can_call boolean,days integer default 7) returns uuid language plpgsql security definer set search_path='' as $$
declare iid uuid;
begin
 if not public.ms_owns(rid) then raise exception 'Only the request owner may invite';end if;
 if email!~'^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or length(email)>254 or days not between 1 and 30 then raise exception 'Invalid email or expiry';end if;
 if can_call and not exists(select 1 from public.ms_requests where id=rid and selection->>'package'='Complete') then raise exception 'Live family calls are Premium only';end if;
 if (select count(*) from public.ms_family where request_id=rid and revoked_at is null and expires_at>now())>=10 then raise exception 'Maximum ten active invitations';end if;
 insert into public.ms_family(request_id,email,can_gallery,can_call,expires_at) values(rid,lower(trim(email)),can_gallery,can_call,now()+make_interval(days=>days)) returning id into iid;
 perform ms_private.log_event('family_invited',rid);return iid;
end$$;
create function public.revoke_family(iid uuid) returns void language plpgsql security definer set search_path='' as $$
declare rid uuid;
begin select request_id into rid from public.ms_family where id=iid;if not(public.ms_owns(rid) or public.ms_is_staff()) then raise exception 'Access denied';end if;
 update public.ms_family set revoked_at=now() where id=iid;perform ms_private.log_event('family_revoked',rid);end$$;
-- Family RPC returns only the permitted summary, never customer notes/quotes/email.
create function public.family_requests() returns table(id uuid,status text,scheduled_date date,call_url text) language sql stable security definer set search_path='' as $$
 select r.id,r.status,r.scheduled_date,case when public.ms_family_access(r.id,'call') then r.call_url else null end from public.ms_requests r where public.ms_family_access(r.id)
$$;
create function public.register_media(rid uuid,path text,caption text) returns void language plpgsql security definer set search_path='' as $$
begin if not public.ms_is_staff() or split_part(path,'/',1)<>rid::text or length(caption)>180 then raise exception 'Invalid upload';end if;
 if not exists(select 1 from storage.objects where bucket_id='completion' and name=path) then raise exception 'Upload not found';end if;
 insert into public.ms_media(request_id,path,caption) values(rid,path,caption);perform ms_private.log_event('media_added',rid);end$$;
create function public.submit_review(rid uuid,display_name text,story text,consent boolean) returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.ms_owns(rid) or not exists(select 1 from public.ms_requests where id=rid and status='completed') then raise exception 'Reviews are available for your completed requests';end if;
 if not consent or length(trim(display_name)) not between 1 and 60 or length(trim(story)) not between 20 and 2000 then raise exception 'Enter a display name, story and publication consent';end if;
 insert into public.ms_reviews(request_id,owner_id,display_name,story,consent) values(rid,auth.uid(),trim(display_name),trim(story),consent) on conflict(request_id) do update set display_name=excluded.display_name,story=excluded.story,consent=excluded.consent,approved=false;
end$$;
create function public.withdraw_review(rid uuid) returns void language plpgsql security definer set search_path='' as $$begin if not public.ms_owns(rid) then raise exception 'Access denied';end if; update public.ms_reviews set consent=false,approved=false where request_id=rid;end$$;
create function public.moderate_review(review_id uuid,publish boolean) returns void language plpgsql security definer set search_path='' as $$
declare rid uuid;
begin if not public.ms_is_staff() then raise exception 'Staff access required';end if;
 update public.ms_reviews set approved=publish where id=review_id and consent returning request_id into rid;if rid is null then raise exception 'Consented review not found';end if;perform ms_private.log_event('review_moderated',rid);end$$;
create function public.published_reviews() returns table(display_name text,story text,created_at timestamptz) language sql stable security definer set search_path='' as $$select display_name,story,created_at from public.ms_reviews where approved and consent order by created_at desc limit 100$$;
create function public.staff_audit(rid uuid) returns table(action text,created_at timestamptz) language plpgsql stable security definer set search_path='' as $$begin if not public.ms_is_staff() then raise exception 'Staff access required';end if;return query select a.action,a.created_at from ms_private.audit a where a.request_id=rid order by a.created_at desc;end$$;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('completion','completion',false,52428800,array['image/jpeg','image/png','image/webp','video/mp4','video/webm']) on conflict(id) do nothing;
create function public.ms_media_access(object_path text) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.ms_requests r where r.id::text=split_part(object_path,'/',1) and (r.owner_id=auth.uid() or public.ms_family_access(r.id,'gallery')))$$;
create policy completion_read on storage.objects for select to authenticated using(bucket_id='completion' and (public.ms_is_staff() or public.ms_media_access(name)));
create policy completion_upload on storage.objects for insert to authenticated with check(bucket_id='completion' and public.ms_is_staff() and exists(select 1 from public.ms_requests r where r.id::text=split_part(name,'/',1)));
create policy completion_delete on storage.objects for delete to authenticated using(bucket_id='completion' and public.ms_is_staff());
-- Default function execute grants are too broad. Only our explicit API is public.
revoke all on all functions in schema ms_private from public,anon,authenticated;
do $$declare f record;begin for f in select p.oid::regprocedure sig from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in('ms_is_staff','ms_owns','ms_family_access','create_request','save_draft','clear_draft','update_request','save_quote','accept_quote','invite_family','revoke_family','family_requests','register_media','submit_review','withdraw_review','moderate_review','published_reviews','staff_audit','ms_media_access') loop execute format('revoke all on function %s from public, anon, authenticated',f.sig);execute format('grant execute on function %s to authenticated',f.sig);end loop;end$$;
grant execute on function public.published_reviews() to anon;
commit;
