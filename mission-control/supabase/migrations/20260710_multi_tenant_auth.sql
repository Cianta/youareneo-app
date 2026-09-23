-- ═══════════════════════════════════════════════════════════════════════════
-- TRINITY OS · Multi-Tenant Auth
-- Tabellen: firmen, profile, notebooks — inkl. Row Level Security (RLS)
-- Rollen: 'admin' (Firmen-Admin) und 'mitarbeiter'
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ── FIRMEN ──────────────────────────────────────────────────────────────────
create table public.firmen (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  -- Einladungscode, mit dem Mitarbeiter der Firma beitreten
  invite_code text not null unique default encode(gen_random_bytes(6), 'hex'),
  created_at  timestamptz not null default now()
);

-- ── PROFILE (1:1 zu auth.users) ─────────────────────────────────────────────
create table public.profile (
  id           uuid primary key references auth.users(id) on delete cascade,
  firma_id     uuid not null references public.firmen(id) on delete cascade,
  role         text not null default 'mitarbeiter' check (role in ('admin', 'mitarbeiter')),
  display_name text not null,
  avatar       text not null default '🥷',
  email        text,
  created_at   timestamptz not null default now()
);

create index profile_firma_idx on public.profile (firma_id);

-- ── NOTEBOOKS ───────────────────────────────────────────────────────────────
create table public.notebooks (
  id         uuid primary key default gen_random_uuid(),
  firma_id   uuid not null references public.firmen(id) on delete cascade,
  owner_id   uuid not null references public.profile(id) on delete cascade,
  title      text not null default 'Neues Notebook',
  content    jsonb not null default '{}'::jsonb,
  -- false = privat (nur Besitzer + Admin), true = für die ganze Firma sichtbar
  shared     boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index notebooks_firma_idx on public.notebooks (firma_id);
create index notebooks_owner_idx on public.notebooks (owner_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger notebooks_updated_at
  before update on public.notebooks
  for each row execute function public.set_updated_at();

-- ── HELPER (security definer verhindert RLS-Rekursion auf profile) ─────────
create or replace function public.auth_firma_id()
returns uuid language sql stable security definer set search_path = public as
$$ select firma_id from public.profile where id = auth.uid() $$;

create or replace function public.auth_is_admin()
returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.profile where id = auth.uid() and role = 'admin') $$;

-- ── RLS aktivieren ──────────────────────────────────────────────────────────
alter table public.firmen    enable row level security;
alter table public.profile   enable row level security;
alter table public.notebooks enable row level security;

-- FIRMEN: Mitglieder sehen ihre Firma, nur Admins dürfen sie ändern/löschen
create policy "firmen_select_member" on public.firmen
  for select using (id = public.auth_firma_id());

create policy "firmen_update_admin" on public.firmen
  for update using (id = public.auth_firma_id() and public.auth_is_admin());

create policy "firmen_delete_admin" on public.firmen
  for delete using (id = public.auth_firma_id() and public.auth_is_admin());

-- PROFILE: alle Mitglieder derselben Firma sehen sich gegenseitig
create policy "profile_select_same_firma" on public.profile
  for select using (firma_id = public.auth_firma_id());

create policy "profile_update_own" on public.profile
  for update using (id = auth.uid());

create policy "profile_update_admin" on public.profile
  for update using (firma_id = public.auth_firma_id() and public.auth_is_admin());

create policy "profile_delete_admin" on public.profile
  for delete using (
    firma_id = public.auth_firma_id()
    and public.auth_is_admin()
    and id <> auth.uid()          -- Admin kann sich nicht selbst löschen
  );

-- NOTEBOOKS: Besitzer immer; Firma bei shared=true; Admin sieht alles der Firma
create policy "notebooks_select" on public.notebooks
  for select using (
    owner_id = auth.uid()
    or (firma_id = public.auth_firma_id() and shared)
    or (firma_id = public.auth_firma_id() and public.auth_is_admin())
  );

create policy "notebooks_insert_own" on public.notebooks
  for insert with check (
    owner_id = auth.uid()
    and firma_id = public.auth_firma_id()
  );

create policy "notebooks_update" on public.notebooks
  for update using (
    owner_id = auth.uid()
    or (firma_id = public.auth_firma_id() and public.auth_is_admin())
  );

create policy "notebooks_delete" on public.notebooks
  for delete using (
    owner_id = auth.uid()
    or (firma_id = public.auth_firma_id() and public.auth_is_admin())
  );

-- kleine Validierung des Anzeigenamens
create or replace function public.avatar_check_name(n text)
returns text language sql immutable as
$$ select case when length(trim(n)) between 1 and 80 then trim(n) else 'Unbenannt' end $$;

-- ── RPC: Firma registrieren (Aufrufer wird Admin) ───────────────────────────
create or replace function public.register_firma(
  firma_name   text,
  display_name text,
  avatar       text default '🥷'
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  fid uuid;
begin
  if auth.uid() is null then
    raise exception 'Nicht angemeldet';
  end if;
  if exists (select 1 from public.profile where id = auth.uid()) then
    raise exception 'Profil existiert bereits';
  end if;

  insert into public.firmen (name) values (firma_name) returning id into fid;

  insert into public.profile (id, firma_id, role, display_name, avatar, email)
  values (
    auth.uid(), fid, 'admin', avatar_check_name(display_name), avatar,
    (select email from auth.users where id = auth.uid())
  );

  return fid;
end $$;

-- ── RPC: Firma per Einladungscode beitreten (Aufrufer wird Mitarbeiter) ────
create or replace function public.join_firma(
  code         text,
  display_name text,
  avatar       text default '🥷'
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  fid uuid;
begin
  if auth.uid() is null then
    raise exception 'Nicht angemeldet';
  end if;
  if exists (select 1 from public.profile where id = auth.uid()) then
    raise exception 'Profil existiert bereits';
  end if;

  select id into fid from public.firmen where invite_code = code;
  if fid is null then
    raise exception 'Ungültiger Einladungscode';
  end if;

  insert into public.profile (id, firma_id, role, display_name, avatar, email)
  values (
    auth.uid(), fid, 'mitarbeiter', avatar_check_name(display_name), avatar,
    (select email from auth.users where id = auth.uid())
  );

  return fid;
end $$;

-- Nur eingeloggte Nutzer dürfen die RPCs aufrufen
revoke execute on function public.register_firma(text, text, text) from anon, public;
revoke execute on function public.join_firma(text, text, text) from anon, public;
grant execute on function public.register_firma(text, text, text) to authenticated;
grant execute on function public.join_firma(text, text, text) to authenticated;

-- ── Advisor-Härtung ─────────────────────────────────────────────────────────
alter function public.avatar_check_name(text) set search_path = public;
alter function public.set_updated_at() set search_path = public;
revoke execute on function public.auth_firma_id() from anon, public;
revoke execute on function public.auth_is_admin() from anon, public;
grant execute on function public.auth_firma_id() to authenticated;
grant execute on function public.auth_is_admin() to authenticated;

-- ── Media-Storage-Bucket (Meditationsmusik, Bilder, Uploads) ────────────────
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "media_public_read" on storage.objects
  for select using (bucket_id = 'media');
create policy "media_team_insert" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'media');
create policy "media_team_delete" on storage.objects
  for delete to anon, authenticated using (bucket_id = 'media');
