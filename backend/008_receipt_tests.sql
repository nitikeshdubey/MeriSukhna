begin;
insert into auth.users(id,aud,role,email,email_confirmed_at) values('77777777-7777-4777-8777-777777777777','authenticated','authenticated','receipt-test@example.invalid',now());
insert into public.ms_requests(id,owner_id,selection) values('88888888-8888-4888-8888-888888888888','77777777-7777-4777-8777-777777777777','{}');
do $$begin
 if has_function_privilege('anon','public.claim_request_receipt(uuid)','EXECUTE') or has_function_privilege('authenticated','public.claim_request_receipt(uuid)','EXECUTE') then raise exception 'Public claim access';end if;
 if not (select relrowsecurity from pg_class where oid='ms_private.request_receipts'::regclass) then raise exception 'Missing RLS';end if;
 if not public.claim_request_receipt('88888888-8888-4888-8888-888888888888') then raise exception 'Initial claim failed';end if;
 if public.claim_request_receipt('88888888-8888-4888-8888-888888888888') then raise exception 'Duplicate accepted';end if;
 perform public.finish_request_receipt('88888888-8888-4888-8888-888888888888',false);
 if public.claim_request_receipt('88888888-8888-4888-8888-888888888888') then raise exception 'Retry spacing failed';end if;
 update ms_private.request_receipts set updated_at=now()-interval '6 minutes' where request_id='88888888-8888-4888-8888-888888888888';
 if not public.claim_request_receipt('88888888-8888-4888-8888-888888888888') then raise exception 'Retry failed';end if;
 perform public.finish_request_receipt('88888888-8888-4888-8888-888888888888',true);
 if public.claim_request_receipt('88888888-8888-4888-8888-888888888888') then raise exception 'Sent duplicate accepted';end if;
end $$;
rollback;
select 'Receipt security and idempotency checks passed; test data rolled back' as result;
