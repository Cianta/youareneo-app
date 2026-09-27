-- Run as database owner. Entire fixture is rolled back; no mail or lasting accounts.
begin;
create temporary table voice_test_ids(a uuid,b uuid,free uuid);
insert into voice_test_ids values(gen_random_uuid(),gen_random_uuid(),gen_random_uuid());
grant select on voice_test_ids to authenticated,service_role;
insert into auth.users(id,aud,role,email)
select id,'authenticated','authenticated',id::text || '@example.test' from voice_test_ids cross join lateral unnest(array[a,b,free]) id;
insert into public.neo_access(user_id,product,source) select a,'foerder','manual' from voice_test_ids;
insert into public.neo_access(user_id,product,source) select b,'app','manual' from voice_test_ids;
select set_config('request.jwt.claims',json_build_object('sub',a,'role','authenticated')::text,true) is not null as owner_session from voice_test_ids;
set local role authenticated;
insert into public.trinity_projects(user_id,name) select a,'Privat' from voice_test_ids;
insert into public.trinity_notes(user_id,title,transcript,summary,type,project,tags,source)
select a,'Test','Ein interner Testauftrag','Test','aufgabe','Privat',array['hermes'],'text' from voice_test_ids;
do $$begin
 if (select count(*) from public.hermes_queue)<>1 then raise exception 'queue trigger failed'; end if;
 if exists(select 1 from public.hermes_queue where status<>'wartet_auf_bestaetigung') then raise exception 'auto approval';end if;
 begin
  update public.hermes_queue set status='freigegeben'; raise exception 'client approved queue';
 exception when insufficient_privilege then null;end;
 begin
  insert into public.trinity_notes(user_id,title,transcript,type,source) select b,'x','x','notiz','text' from voice_test_ids;
  raise exception 'cross-owner write allowed';
 exception when insufficient_privilege then null;end;
 begin
  perform public.trinity_reserve_usage((select a from voice_test_ids),1,100,100);raise exception 'user quota mutation allowed';
 exception when insufficient_privilege then null;end;
end $$;
reset role;
set local role service_role;
do $$begin
 if exists(select 1 from public.trinity_hermes_pending) then raise exception 'waiting order exposed';end if;
 update public.hermes_queue set status='freigegeben' where user_id=(select a from voice_test_ids);
 if (select count(*) from public.trinity_hermes_pending)<>1 then raise exception 'approved order missing';end if;
 update public.trinity_hermes_pending set status='erledigt',result='Test';
 if not found then raise exception 'approved completion failed';end if;
 update public.hermes_queue set status='freigegeben',result=null where user_id=(select a from voice_test_ids);
end $$;
reset role;
select set_config('request.jwt.claims',json_build_object('sub',b,'role','authenticated')::text,true) is not null as other_session from voice_test_ids;
set local role authenticated;
do $$begin
 if exists(select 1 from public.trinity_notes) or exists(select 1 from public.hermes_queue) or exists(select 1 from public.trinity_projects) then raise exception 'foreign data visible';end if;
 if not public.trinity_can_save() then raise exception 'app entitlement failed';end if;
end $$;
reset role;
select set_config('request.jwt.claims',json_build_object('sub',free,'role','authenticated')::text,true) is not null as free_session from voice_test_ids;
set local role authenticated;
do $$begin
 if public.trinity_can_save() then raise exception 'free save allowed';end if;
 begin
  insert into public.trinity_notes(user_id,title,transcript,type,source) select free,'x','x','notiz','text' from voice_test_ids;
  raise exception 'free note saved';
 exception when insufficient_privilege then null;end;
 begin
  insert into storage.objects(bucket_id,name) select 'trinity-audio',free::text || '/test.webm' from voice_test_ids;
  raise exception 'free audio saved';
 exception when insufficient_privilege then null;end;
end $$;
reset role;
update public.neo_access set revoked_at=now() where user_id=(select a from voice_test_ids);
select set_config('request.jwt.claims',json_build_object('sub',a,'role','authenticated')::text,true) is not null as revoked_session from voice_test_ids;
set local role authenticated;
do $$begin
 if public.trinity_can_save() then raise exception 'revoked entitlement valid';end if;
 if (select count(*) from public.trinity_notes)<>1 then raise exception 'own notes inaccessible after revoke';end if;
 begin
  insert into public.trinity_notes(user_id,title,transcript,type,source) select a,'x','x','notiz','text' from voice_test_ids;
  raise exception 'revoked member saved';
 exception when insufficient_privilege then null;end;
end $$;
reset role;
set local role service_role;
do $$begin
 if exists(select 1 from public.trinity_hermes_pending) then raise exception 'revoked order exposed';end if;
 update public.trinity_hermes_pending set status='erledigt',result='x';
 if found then raise exception 'revoked order completed';end if;
end $$;
reset role;
set local role service_role;
do $$declare u uuid := (select a from voice_test_ids);begin
 if not public.trinity_reserve_usage(u,299,5,3) then raise exception 'quota initial failure';end if;
 if not public.trinity_reserve_usage(u,1,5,3) then raise exception 'quota boundary failure';end if;
 if public.trinity_reserve_usage(u,1,5,3) then raise exception 'minute limit exceeded';end if;
 if not public.trinity_reserve_usage(u,0,5,3) then raise exception 'classification budget failure';end if;
 if public.trinity_reserve_usage(u,0,5,3) then raise exception 'request limit exceeded';end if;
 if (select voice_seconds from public.usage where user_id=u)<>300 then raise exception 'quota incorrectly charged';end if;
end $$;
reset role;
set local role anon;
do $$begin
 begin perform * from public.trinity_notes;raise exception 'anon notes exposed';exception when insufficient_privilege then null;end;
 begin perform * from public.hermes_queue;raise exception 'anon queue exposed';exception when insufficient_privilege then null;end;
end $$;
reset role;
select 'PASS: ownership, free/revoked save denial, app entitlement, queue waiting/approval isolation, storage, minute and request limits, anon denial' as result;
rollback;
