begin;

-- Staff notes and family decisions stay outside the public API tables.
create table if not exists ms_private.request_operations (
 request_id uuid primary key references public.ms_requests(id) on delete cascade,
 change_until timestamptz, call_at timestamptz, fallback text not null default '',
 handover jsonb not null default '{}', family_change text not null default '',
 revision integer not null default 0
);
alter table ms_private.request_operations enable row level security;
revoke all on ms_private.request_operations from public, anon, authenticated;

create or replace function public.request_operations(rid uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare owner_access boolean := public.ms_owns(rid); staff boolean := public.ms_is_staff(); ops ms_private.request_operations; receipt ms_private.request_receipts; req public.ms_requests; result jsonb;
begin
 select * into strict req from public.ms_requests where id=rid and (owner_access or staff or public.ms_family_access(rid,'call'));
 select * into ops from ms_private.request_operations where request_id=rid;
 result=jsonb_build_object('call_at',case when req.selection->>'package'='Complete' and req.call_url is not null and req.status='scheduled' and (ops.call_at at time zone 'Asia/Kolkata')::date=req.scheduled_date then ops.call_at end,'fallback',ops.fallback);
 if owner_access or staff then
  select * into receipt from ms_private.request_receipts where request_id=rid;
  result=result||jsonb_build_object('revision',coalesce(ops.revision,0),'change_until',ops.change_until,'family_change',ops.family_change,
    'receipt_state',coalesce(receipt.state,'not_requested'),'receipt_updated',receipt.updated_at,'receipt_attempts',coalesce(receipt.attempts,0));
 end if;
 if staff then result=result||jsonb_build_object('handover',coalesce(ops.handover,'{}'::jsonb));end if;
 return result;
end $$;

create or replace function public.save_request_operations(rid uuid,expected_revision integer,change_until timestamptz,call_at timestamptz,fallback text,handover jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare req public.ms_requests; ver integer;
begin
 if not public.ms_is_staff() then raise exception 'Staff access required';end if;
 select * into strict req from public.ms_requests where id=rid for update;
 select revision into ver from ms_private.request_operations where request_id=rid;
 if expected_revision is distinct from coalesce(ver,0) then raise exception 'Request changed. Refresh and review the latest details.';end if;
 if length(coalesce(fallback,''))>300 or jsonb_typeof(handover) is distinct from 'object' or octet_length(handover::text)>2500 then raise exception 'Invalid handover';end if;
 if handover->'purchases'='true'::jsonb and not exists(select 1 from public.ms_quotes where request_id=rid and state='accepted') then raise exception 'Ask the family to accept the current quotation before marking purchases checked';end if;
 if call_at is not null and (req.selection->>'package' is distinct from 'Complete' or req.status<>'scheduled' or req.call_url is null or req.scheduled_date is distinct from (call_at at time zone 'Asia/Kolkata')::date or nullif(trim(fallback),'') is null) then raise exception 'Confirm a Premium call, matching Punjab date and fallback first';end if;
 insert into ms_private.request_operations as existing(request_id,change_until,call_at,fallback,handover,revision)
 values(rid,change_until,call_at,coalesce(fallback,''),handover,1)
 on conflict(request_id) do update set change_until=excluded.change_until,call_at=excluded.call_at,fallback=excluded.fallback,handover=excluded.handover,revision=existing.revision+1;
 perform ms_private.log_event('handover_updated',rid);
end $$;

create or replace function public.request_amendment(rid uuid,expected_revision integer,details text)
returns void language plpgsql security definer set search_path='' as $$
declare ops ms_private.request_operations; req public.ms_requests;
begin
 if not public.ms_owns(rid) then raise exception 'Owner access required';end if;
 if coalesce(length(trim(details)),0) not between 1 and 600 then raise exception 'Enter a change request under 600 characters';end if;
 select * into strict req from public.ms_requests where id=rid for update;
 select * into ops from ms_private.request_operations where request_id=rid;
 if expected_revision is distinct from coalesce(ops.revision,0) then raise exception 'Request changed. Refresh and check the latest details.';end if;
 if req.status='completed' or ops.change_until is null or ops.change_until<=clock_timestamp() then raise exception 'Changes are closed. Contact the coordinator.';end if;
 update ms_private.request_operations set family_change=trim(details),revision=revision+1 where request_id=rid;
 perform ms_private.log_event('family_change_requested',rid);
end $$;

revoke all on function public.request_operations(uuid),public.save_request_operations(uuid,integer,timestamptz,timestamptz,text,jsonb),public.request_amendment(uuid,integer,text) from public,anon;
grant execute on function public.request_operations(uuid),public.save_request_operations(uuid,integer,timestamptz,timestamptz,text,jsonb),public.request_amendment(uuid,integer,text) to authenticated;
commit;
