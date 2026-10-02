-- Optional, explicitly selected local workspace backups. No session/audio/secret stores.
create table public.guiding_workspace_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revision bigint not null default 1 check (revision > 0),
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 2200000),
  updated_at timestamptz not null default now()
);
alter table public.guiding_workspace_snapshots enable row level security;
revoke all on public.guiding_workspace_snapshots from public, anon, authenticated;
grant select, insert, update on public.guiding_workspace_snapshots to authenticated;
grant all on public.guiding_workspace_snapshots to service_role;
create policy "Members read their own workspace snapshot" on public.guiding_workspace_snapshots
for select to authenticated using ((select auth.uid()) = user_id);
create policy "Members create their own workspace snapshot" on public.guiding_workspace_snapshots
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Members update their own workspace snapshot" on public.guiding_workspace_snapshots
for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
comment on table public.guiding_workspace_snapshots is 'Opt-in local workspace backups; access owned by auth user. Revisions prevent lost updates through the app API.';
