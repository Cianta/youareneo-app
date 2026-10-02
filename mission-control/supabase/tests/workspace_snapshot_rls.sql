begin;
create temporary table snapshot_ids(a uuid,b uuid);
insert into snapshot_ids values(gen_random_uuid(),gen_random_uuid());
grant select on snapshot_ids to authenticated;
insert into auth.users(id,aud,role,email) select id,'authenticated','authenticated',id::text||'@example.test' from snapshot_ids cross join lateral unnest(array[a,b]) id;
insert into public.neo_access(user_id,product,source) select a,'foerder','manual' from snapshot_ids;
select set_config('request.jwt.claims',json_build_object('sub',a,'role','authenticated')::text,true) from snapshot_ids;
set local role authenticated;
insert into public.guiding_workspace_snapshots(user_id,payload) select a,'{"version":1,"stores":{}}'::jsonb from snapshot_ids;
update public.guiding_workspace_snapshots set revision=2 where user_id=(select a from snapshot_ids) and revision=1;
do $$begin
 if (select revision from public.guiding_workspace_snapshots where user_id=(select a from snapshot_ids)) <> 2 then raise exception 'owner update failed';end if;
 if exists (select 1 from public.guiding_workspace_snapshots where revision=1) then raise exception 'stale revision matched';end if;
 begin update public.guiding_workspace_snapshots set user_id=(select b from snapshot_ids);raise exception 'owner reassignment allowed';exception when insufficient_privilege then null;end;
 begin insert into public.guiding_workspace_snapshots(user_id,payload) select b,'{}' from snapshot_ids;raise exception 'foreign insert allowed';exception when insufficient_privilege then null;end;
end $$;
reset role;
select set_config('request.jwt.claims',json_build_object('sub',b,'role','authenticated')::text,true) from snapshot_ids;
set local role authenticated;
do $$declare n integer;begin
 if exists (select 1 from public.guiding_workspace_snapshots) then raise exception 'foreign read exposed';end if;
 begin insert into public.guiding_workspace_snapshots(user_id,payload) select b,'{}' from snapshot_ids;raise exception 'inactive member write allowed';exception when insufficient_privilege then null;end;
 update public.guiding_workspace_snapshots set revision=3;get diagnostics n=row_count;if n<>0 then raise exception 'foreign update allowed';end if;
end $$;
reset role;
set local role anon;
do $$begin
 begin perform * from public.guiding_workspace_snapshots;raise exception 'anonymous read exposed';exception when insufficient_privilege then null;end;
end $$;
reset role;
select 'PASS: own create/read/update, ownership changes blocked, foreign isolation, anon denied' as result;
rollback;
