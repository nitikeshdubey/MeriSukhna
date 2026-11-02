-- Service-only delivery ledger: no customer contact data or message content.
create table if not exists ms_private.request_receipts (
 request_id uuid primary key references public.ms_requests(id) on delete cascade,
 state text not null check(state in ('sending','sent','failed')),
 attempts integer not null default 1,
 updated_at timestamptz not null default now()
);
alter table ms_private.request_receipts enable row level security;
revoke all on ms_private.request_receipts from public, anon, authenticated;
create or replace function public.claim_request_receipt(request_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare claimed uuid;
begin
 insert into ms_private.request_receipts as r(request_id,state) values(request_id,'sending')
 on conflict on constraint request_receipts_pkey do update
 set state='sending',attempts=r.attempts+1,updated_at=now()
 where r.state='failed' and r.attempts<3 and r.updated_at<now()-interval '5 minutes'
 returning r.request_id into claimed;
 return claimed is not null;
end $$;
create or replace function public.finish_request_receipt(request_id uuid, delivered boolean)
returns void language sql security definer set search_path='' as $$
 update ms_private.request_receipts set state=case when delivered then 'sent' else 'failed' end, updated_at=now()
 where request_receipts.request_id=finish_request_receipt.request_id and state='sending';
$$;
revoke all on function public.claim_request_receipt(uuid),public.finish_request_receipt(uuid,boolean) from public,anon,authenticated;
grant execute on function public.claim_request_receipt(uuid),public.finish_request_receipt(uuid,boolean) to service_role;
