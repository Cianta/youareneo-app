-- Additive migration: auth.users and neo_profiles are not modified.
create table public.neo_access (
  user_id uuid not null references auth.users(id) on delete cascade,
  product text not null check (product ~ '^[a-z][a-z0-9_-]{0,63}$'),
  source text not null check (source ~ '^[a-z][a-z0-9_-]{0,63}$'),
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  primary key (user_id, product)
);

alter table public.neo_access enable row level security;
revoke all on public.neo_access from public, anon, authenticated;
grant select on public.neo_access to authenticated;
grant select, insert, update, delete on public.neo_access to service_role;

create policy neo_access_read_own on public.neo_access
  for select to authenticated
  using ((select auth.uid()) = user_id);

comment on table public.neo_access is 'NEO product entitlements. Only service_role writes; users read their own rows. Active when revoked_at is null.';
