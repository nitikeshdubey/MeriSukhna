begin;
insert into auth.users(id,aud,role,email,email_confirmed_at) values
 ('11111111-1111-4111-8111-111111111111','authenticated','authenticated','ms-owner@example.invalid',now()),
 ('22222222-2222-4222-8222-222222222222','authenticated','authenticated','ms-relative@example.invalid',now()),
 ('33333333-3333-4333-8333-333333333333','authenticated','authenticated','ms-staff@example.invalid',now());
insert into ms_private.staff values('33333333-3333-4333-8333-333333333333');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","email":"ms-owner@example.invalid","role":"authenticated"}',true);
select set_config('ms_test.rid',public.create_request('{"package":"Complete","place":"Patiala","additions":[],"notes":"Private"}')::text,true);
do $$declare rid uuid:=current_setting('ms_test.rid')::uuid; begin
 if public.request_operations(rid) ? 'handover' then raise exception 'Owner saw staff handover';end if;
 begin perform public.request_amendment(rid,0,'Closed change');raise exception 'Expected cutoff denial';exception when raise_exception then if sqlerrm='Expected cutoff denial' then raise;end if;end;
end $$;
select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","email":"ms-staff@example.invalid","role":"authenticated"}',true);
select public.save_request_operations(current_setting('ms_test.rid')::uuid,0,now()+interval '1 hour',null,'','{"contact":"Family lead"}');
do $$declare rid uuid:=current_setting('ms_test.rid')::uuid; begin
 begin perform public.save_request_operations(rid,0,null,null,'','{}');raise exception 'Stale change accepted';exception when raise_exception then if sqlerrm='Stale change accepted' then raise;end if;end;
 begin perform public.save_request_operations(rid,1,null,null,'','{"purchases":true}');raise exception 'Unapproved purchases accepted';exception when raise_exception then if sqlerrm='Unapproved purchases accepted' then raise;end if;end;
 begin perform public.save_request_operations(rid,1,null,now(),'Call later','{}');raise exception 'Unscheduled calendar accepted';exception when raise_exception then if sqlerrm='Unscheduled calendar accepted' then raise;end if;end;
end $$;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","email":"ms-owner@example.invalid","role":"authenticated"}',true);
select public.request_amendment(current_setting('ms_test.rid')::uuid,1,'Please review the quantity');
select public.invite_family(current_setting('ms_test.rid')::uuid,'ms-relative@example.invalid',false,true,1);
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","email":"ms-relative@example.invalid","role":"authenticated"}',true);
do $$declare rid uuid:=current_setting('ms_test.rid')::uuid; result jsonb;begin
 result=public.request_operations(rid);
 if result ?| array['revision','family_change','handover','receipt_state','change_until'] then raise exception 'Family saw private data';end if;
 begin perform public.request_amendment(rid,2,'Relative change');raise exception 'Relative edited owner request';exception when raise_exception then if sqlerrm='Relative edited owner request' then raise;end if;end;
 begin perform public.request_operations(gen_random_uuid());raise exception 'Unrelated request accessible';exception when no_data_found then null;end;
end $$;
set local role anon;
do $$begin
 begin perform public.request_operations(current_setting('ms_test.rid')::uuid);raise exception 'Anonymous access';exception when insufficient_privilege then null;end;
end $$;
rollback;
