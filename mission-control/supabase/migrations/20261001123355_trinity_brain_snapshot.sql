-- One bounded, owner-scoped read for the private knowledge graph. No schema/data rewrites.
create or replace function public.trinity_brain_snapshot() returns jsonb
language sql stable security invoker set search_path = '' as $$
  with notes as materialized (
    select id,user_id,title,summary,transcript,type,project,tags,assignee,created_at
    from public.trinity_notes where user_id = (select auth.uid())
    order by created_at desc,id limit 1001
  ), projects as materialized (
    select user_id,name,created_at from public.trinity_projects
    where user_id = (select auth.uid()) order by created_at desc,name limit 201
  ), selected_notes as (select * from notes order by created_at desc,id limit 1000),
  selected_projects as (select * from projects order by created_at desc,name limit 200),
  queue as (
    select q.note_id,q.user_id,q.status,q.created_at from public.hermes_queue q
    join selected_notes n on n.id=q.note_id
    where q.user_id = (select auth.uid())
  )
  select jsonb_build_object(
    'notes',coalesce((select jsonb_agg(to_jsonb(n) order by n.created_at desc,n.id) from selected_notes n),'[]'::jsonb),
    'projects',coalesce((select jsonb_agg(to_jsonb(p) order by p.created_at desc,p.name) from selected_projects p),'[]'::jsonb),
    'queue',coalesce((select jsonb_agg(to_jsonb(q) order by q.created_at desc,q.note_id) from queue q),'[]'::jsonb),
    'truncated',(select count(*)>1000 from notes) or (select count(*)>200 from projects)
  );
$$;
revoke all on function public.trinity_brain_snapshot() from public, anon;
grant execute on function public.trinity_brain_snapshot() to authenticated;
