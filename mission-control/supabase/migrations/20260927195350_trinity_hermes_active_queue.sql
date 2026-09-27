-- Filter before pagination and re-check entitlement atomically at completion.
-- Simple updatable view: completed rows deliberately leave the view.
create view public.trinity_hermes_pending with (security_invoker = true) as
select q.note_id,q.user_id,q.instruction,q.status,q.result,q.created_at
from public.hermes_queue q
where q.status='freigegeben' and exists (
  select 1 from public.neo_access a where a.user_id=q.user_id
    and a.revoked_at is null and a.product=any(array['foerder','app'])
);
revoke all on public.trinity_hermes_pending from public,anon,authenticated;
grant select,update on public.trinity_hermes_pending to service_role;
