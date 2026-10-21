-- Entire test is rolled back, including disposable test users. No emails sent.
begin;
insert into auth.users(id,aud,role,email,email_confirmed_at) values
 ('11111111-1111-4111-8111-111111111111','authenticated','authenticated','ms-test-owner@example.invalid',now()),
 ('22222222-2222-4222-8222-222222222222','authenticated','authenticated','ms-test-other@example.invalid',now()),
 ('33333333-3333-4333-8333-333333333333','authenticated','authenticated','ms-test-staff@example.invalid',now());
insert into ms_private.staff values('33333333-3333-4333-8333-333333333333');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","email":"ms-test-owner@example.invalid","role":"authenticated"}',true);
select set_config('ms_test.rid',public.create_request('{"package":"Plus","place":"Test Gurdwara","paath":"No additional Paath requested","additions":[],"date":"","notes":"Private customer note"}')::text,true);
do $$begin
 if (select count(*) from public.ms_requests)<>1 then raise exception 'Owner cannot read own request';end if;
 if public.ms_is_staff() then raise exception 'Customer became staff';end if;
 begin perform public.update_request(current_setting('ms_test.rid')::uuid,'completed',null,'','test');raise exception 'MISSING_DENIAL';exception when raise_exception then if sqlerrm='MISSING_DENIAL' then raise;end if;end;
 begin insert into ms_private.staff values(auth.uid());raise exception 'MISSING_ROLE_DENIAL';exception when insufficient_privilege then null;end;
end$$;
select public.save_draft('{"package":"Plus"}');
select set_config('ms_test.invite',public.invite_family(current_setting('ms_test.rid')::uuid,'ms-test-other@example.invalid',false,false,7)::text,true);
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","email":"ms-test-other@example.invalid","role":"authenticated"}',true);
do $$begin
 if (select count(*) from public.ms_requests)<>0 or (select count(*) from public.ms_drafts)<>0 then raise exception 'Cross-account private data leak';end if;
 if (select count(*) from public.family_requests())<>1 then raise exception 'Family invitation not recognised';end if;
 if public.ms_family_access(current_setting('ms_test.rid')::uuid,'gallery') then raise exception 'Family gallery permission leaked';end if;
 begin perform public.invite_family(current_setting('ms_test.rid')::uuid,'another@example.invalid',true,true,7);raise exception 'MISSING_DENIAL';exception when raise_exception then if sqlerrm='MISSING_DENIAL' then raise;end if;end;
end$$;
select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","email":"ms-test-staff@example.invalid","role":"authenticated"}',true);
do $$begin
 if not public.ms_is_staff() then raise exception 'Staff role missing';end if;
 begin perform public.save_quote(current_setting('ms_test.rid')::uuid,'CAD','[{"description":"Pending shop item","quantity":1,"unit_price":null}]','Payment and cancellation terms to be agreed','{}',true);raise exception 'MISSING_PENDING_DENIAL';exception when raise_exception then if sqlerrm='MISSING_PENDING_DENIAL' then raise;end if;end;
end$$;
select set_config('ms_test.qid',public.save_quote(current_setting('ms_test.rid')::uuid,'CAD','[{"description":"Plus coordination","quantity":1,"unit_price":230},{"description":"Shop addition","quantity":2,"unit_price":10}]','TEST ONLY: written payment, cancellation and refund terms. No payment is made.','{"currency":"CAD","rate":1}',true)::text,true);
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","email":"ms-test-other@example.invalid","role":"authenticated"}',true);
do $$begin
 if (select count(*) from public.ms_quotes)<>0 then raise exception 'Family quotation leak';end if;
 begin perform public.accept_quote(current_setting('ms_test.qid')::uuid);raise exception 'MISSING_ACCEPT_DENIAL';exception when raise_exception then if sqlerrm='MISSING_ACCEPT_DENIAL' then raise;end if;end;
end$$;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","email":"ms-test-owner@example.invalid","role":"authenticated"}',true);
do $$begin if (select total from public.ms_quotes where id=current_setting('ms_test.qid')::uuid)<>250 then raise exception 'Incorrect server-side quotation total';end if;end$$;
select public.accept_quote(current_setting('ms_test.qid')::uuid);
select public.revoke_family(current_setting('ms_test.invite')::uuid);
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","email":"ms-test-other@example.invalid","role":"authenticated"}',true);
do $$begin if exists(select 1 from public.family_requests()) then raise exception 'Revoked access still works';end if;end$$;
select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","email":"ms-test-staff@example.invalid","role":"authenticated"}',true);
select public.update_request(current_setting('ms_test.rid')::uuid,'completed',current_date,'','Completed in rollback test.');
insert into storage.objects(bucket_id,name) values('completion',current_setting('ms_test.rid')||'/test.png');
select public.register_media(current_setting('ms_test.rid')::uuid,current_setting('ms_test.rid')||'/test.png','Private test image');
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","email":"ms-test-owner@example.invalid","role":"authenticated"}',true);
do $$begin if not public.ms_media_access(current_setting('ms_test.rid')||'/test.png') then raise exception 'Owner gallery denied';end if;end$$;
select public.submit_review(current_setting('ms_test.rid')::uuid,'Test display name','This is a test story which will be rolled back, never published permanently.',true);
do $$begin if exists(select 1 from public.published_reviews()) then raise exception 'Unmoderated review published';end if;end$$;
select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","email":"ms-test-staff@example.invalid","role":"authenticated"}',true);
select public.moderate_review((select id from public.ms_reviews where request_id=current_setting('ms_test.rid')::uuid),true);
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","email":"ms-test-other@example.invalid","role":"authenticated"}',true);
do $$begin if public.ms_media_access(current_setting('ms_test.rid')||'/test.png') or exists(select 1 from public.ms_media) then raise exception 'Revoked family media leaked';end if;end$$;
set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
do $$begin
 if (select count(*) from public.published_reviews())<>1 then raise exception 'Consented approved review not published';end if;
 begin perform id from public.ms_requests;raise exception 'MISSING_ANON_DENIAL';exception when insufficient_privilege then null;end;
end$$;
rollback;
select 'PASS: ownership, staff-only writes, role escalation denial, family scope/revocation, quotations, acceptance, private media and moderated reviews. All test data rolled back.' as result;
