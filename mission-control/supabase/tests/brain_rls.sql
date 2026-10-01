-- Optional acceptance fixture for the later integration session. Rolls back everything.
begin;
create temporary table brain_ids(a uuid,b uuid);
insert into brain_ids values(gen_random_uuid(),gen_random_uuid());
grant select on brain_ids to authenticated;
insert into auth.users(id,aud,role,email) select id,'authenticated','authenticated',id::text||'@example.test' from brain_ids cross join lateral unnest(array[a,b]) id;
insert into public.neo_access(user_id,product,source) select a,'foerder','manual' from brain_ids;
select set_config('request.jwt.claims',json_build_object('sub',a,'role','authenticated')::text,true) from brain_ids;
set local role authenticated;
insert into public.trinity_projects(user_id,name) select a,'Graph-Projekt' from brain_ids;
insert into public.trinity_notes(user_id,title,transcript,type,project,tags,source) select a,'Graph-Notiz','@Graph-Projekt #hermes','aufgabe','Graph-Projekt',array['hermes'],'text' from brain_ids;
do $$declare g jsonb:=public.trinity_brain_snapshot();begin
 if jsonb_array_length(g->'notes')<>1 or jsonb_array_length(g->'projects')<>1 or jsonb_array_length(g->'queue')<>1 then raise exception 'own snapshot incomplete';end if;
end $$;
reset role;
select set_config('request.jwt.claims',json_build_object('sub',b,'role','authenticated')::text,true) from brain_ids;
set local role authenticated;
do $$declare g jsonb:=public.trinity_brain_snapshot();begin
 if jsonb_array_length(g->'notes')<>0 or jsonb_array_length(g->'projects')<>0 or jsonb_array_length(g->'queue')<>0 then raise exception 'foreign graph exposed';end if;
end $$;
reset role;
set local role anon;
do $$begin
 begin perform public.trinity_brain_snapshot();raise exception 'anon graph exposed';exception when insufficient_privilege then null;end;
end $$;
reset role;
select 'PASS: own graph, cross-account isolation, anonymous denial' as result;
rollback;
